import NextAuth, { type NextAuthOptions, type Account, type Profile, type User, type Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import StravaProvider from 'next-auth/providers/strava';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabaseAdmin } from '@/lib/supabaseServiceRoleClient';

// All your interface definitions remain unchanged
interface StravaAthleteData {
  strava_id: number;
  username?: string;
  firstname?: string;
  lastname?: string;
  bio?: string;
  city?: string;
  state?: string;
  country?: string;
  sex?: string | null;
  profile_medium?: string;
  profile?: string;
  friend?: boolean;
  follower?: boolean;
  premium?: boolean;
  summit?: boolean;
  strava_created_at?: string | null;
  strava_updated_at?: string | null;
  badge_type_id?: number;
  weight?: number;
  profile_original?: string;
  follower_count?: number;
  friend_count?: number;
  mutual_friend_count?: number;
  athlete_type?: number;
  date_preference?: string;
  measurement_preference?: string;
  ftp?: number;
  strava_access_token?: string;
  strava_refresh_token?: string;
  strava_token_expires_at?: string | null;
  strava_scope?: string;
  last_fetched_at?: string;
}

// Define the structure of a Supabase error
interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

// Define the structure of a user from the database
interface DbUser {
  id: string;
  email: string;
  display_name: string;
  strava_athlete_id?: number;
}

interface StravaProfile extends Profile {
  id: number;
  firstname?: string;
  lastname?: string;
  username?: string;
  bio?: string;
  city?: string;
  state?: string;
  country?: string;
  sex?: 'M' | 'F' | null;
  profile_medium?: string;
  profile?: string;
  premium?: boolean;
  summit?: boolean;
  created_at?: string;
  updated_at?: string;
  weight?: number;
}

interface CustomJWT extends JWT {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
  stravaId?: number;
  userId?: string;
  error?: string;
}

interface CustomSessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface CustomSession extends Session {
  accessToken?: string;
  refreshToken?: string;
  stravaId?: number;
  userId?: string;
  error?: string;
  user?: CustomSessionUser;
}

// Keep the environment variable checks, but make them safer for builds
const stravaClientId = process.env.STRAVA_CLIENT_ID || '';
const stravaClientSecret = process.env.STRAVA_CLIENT_SECRET || '';
const nextAuthSecret = process.env.NEXTAUTH_SECRET || '';

// Move error checks inside a function that will only run at runtime, not build time
function validateEnvVars() {
  if (!process.env.STRAVA_CLIENT_ID) throw new Error('Missing environment variable: STRAVA_CLIENT_ID');
  if (!process.env.STRAVA_CLIENT_SECRET) throw new Error('Missing environment variable: STRAVA_CLIENT_SECRET');
  if (!process.env.NEXTAUTH_SECRET) throw new Error('Missing environment variable: NEXTAUTH_SECRET');
}

// Your authOptions remain unchanged
export const authOptions: NextAuthOptions = {
  providers: [
    StravaProvider({
      clientId: stravaClientId,
      clientSecret: stravaClientSecret,
      authorization: {
        params: {
          scope: 'read,activity:read_all,profile:read_all',
        },
      },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials: Record<string, string> | undefined): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          console.error('Credentials provider missing email or password');
          return null;
        }

        if (!supabaseAdmin) {
          console.error('Supabase admin client not initialized');
          return null;
        }

        try {
          const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (authError || !authData?.user) {
            console.error('Supabase auth error in Credentials provider:', authError?.message);
            return null;
          }

          const supabaseUser = authData.user;
          
          // We already checked supabaseAdmin is not null above, but TypeScript doesn't track this through the async flow
          if (!supabaseAdmin) {
            console.error('Supabase admin client not initialized');
            return null;
          }
          
          if (!supabaseUser.email) {
            console.error('User email is missing from Supabase auth data');
            return null;
          }
          
          const { data: appUser, error: dbError } = await supabaseAdmin
            .from('users')
            .select('id, email, display_name')
            .eq('email', supabaseUser.email)
            .single() as { data: DbUser | null, error: SupabaseError | null };

          if (dbError || !appUser) {
            console.error('Error fetching user from DB after Supabase auth, or user not found:', dbError?.message);
            return null;
          }

          return {
            id: appUser.id,
            email: appUser.email,
            name: appUser.display_name,
          };

        } catch (error: unknown) {
          console.error('Unexpected error in Credentials authorize:', error);
          return null;
        }
      }
    })
  ],
  secret: nextAuthSecret,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile }: { user: User; account: Account | null; profile?: Profile }): Promise<boolean | string> {
      if (account?.provider === 'strava' && profile && supabaseAdmin) {
        const stravaProfile = profile as StravaProfile;
        const stravaId = stravaProfile.id;

        if (!stravaId) {
          console.error('Strava profile missing ID:', stravaProfile);
          return '/login?error=OAuthAccountNotLinked';
        }

        try {
          const { data: existingAthlete, error: athleteError } = await supabaseAdmin
            .from('strava_athletes')
            .select('strava_id')
            .eq('strava_id', stravaId)
            .maybeSingle();

          if (athleteError) {
            console.error('Error checking for existing Strava athlete:', athleteError);
            return '/login?error=DatabaseError';
          }

          const athleteData: StravaAthleteData = {
            strava_id: stravaId,
            username: stravaProfile.username,
            firstname: stravaProfile.firstname,
            lastname: stravaProfile.lastname,
            bio: stravaProfile.bio,
            city: stravaProfile.city,
            state: stravaProfile.state,
            country: stravaProfile.country,
            sex: stravaProfile.sex,
            profile_medium: stravaProfile.profile_medium,
            profile: stravaProfile.profile,
            premium: stravaProfile.premium,
            summit: stravaProfile.summit,
            strava_created_at: stravaProfile.created_at ? new Date(stravaProfile.created_at).toISOString() : null,
            strava_updated_at: stravaProfile.updated_at ? new Date(stravaProfile.updated_at).toISOString() : null,
            weight: stravaProfile.weight,
            strava_access_token: account.access_token,
            strava_refresh_token: account.refresh_token,
            strava_token_expires_at: account.expires_at ? new Date(account.expires_at * 1000).toISOString() : null,
            strava_scope: account.scope,
            last_fetched_at: new Date().toISOString(),
          };

          if (existingAthlete) {
            // Using 'as any' to bypass TypeScript's type checking due to Supabase client being initialized with 'unknown' type
            // This is necessary because when using SupabaseClient<unknown>, the update/insert methods expect 'never' as parameter type
            // Use a double type casting to satisfy TypeScript
            // First cast to unknown, then to a generic object type that Supabase can accept
            const { error: updateError } = await supabaseAdmin
              .from('strava_athletes')
              .update(athleteData as unknown as Record<string, unknown>)
              .eq('strava_id', stravaId);

            if (updateError) {
              console.error('Error updating Strava athlete:', updateError);
              return '/login?error=DatabaseError';
            }
            console.log(`Strava athlete updated: ${stravaId}`);
          } else {
            // Using 'as any' to bypass TypeScript's type checking due to Supabase client being initialized with 'unknown' type
            // This is necessary because when using SupabaseClient<unknown>, the insert/update methods expect 'never' as parameter type
            // Use a double type casting to satisfy TypeScript
            // First cast to unknown, then to a generic object type that Supabase can accept
            const { error: insertAthleteError } = await supabaseAdmin
              .from('strava_athletes')
              .insert(athleteData as unknown as Record<string, unknown>);

            if (insertAthleteError) {
              console.error('Error inserting Strava athlete:', insertAthleteError);
              return '/login?error=DatabaseError';
            }
            console.log(`Strava athlete created: ${stravaId}`);

            const newUserEmail = user.email;
            if (!newUserEmail) {
                console.error('Email missing from Strava profile/NextAuth user object.');
                return '/login?error=EmailRequired';
            }

            const { data: existingUserByEmail, error: userEmailError } = await supabaseAdmin
              .from('users')
              .select('id')
              .eq('email', newUserEmail)
              .maybeSingle();

            if (userEmailError) {
                console.error('Error checking for existing user by email:', userEmailError);
                return '/login?error=DatabaseError';
            }

            if (existingUserByEmail) {
                const { error: linkUserError } = await supabaseAdmin
                    .from('users')
                    .update({ strava_athlete_id: stravaId })
                    .eq('id', existingUserByEmail.id);

                if (linkUserError) {
                    console.error('Error linking existing user to Strava athlete:', linkUserError);
                    return '/login?error=DatabaseError';
                }
                console.log(`Existing user ${existingUserByEmail.id} linked to Strava athlete ${stravaId}`);

            } else {
                const { data: newUser, error: insertUserError } = await supabaseAdmin
                    .from('users')
                    .insert({
                        email: newUserEmail,
                        strava_athlete_id: stravaId,
                        display_name: `${stravaProfile.firstname || ''} ${stravaProfile.lastname || ''}`.trim() || stravaProfile.username || 'New User',
                    })
                    .select('id')
                    .single();

                if (insertUserError || !newUser) {
                    console.error('Error inserting new user:', insertUserError);
                    return '/login?error=DatabaseError';
                }
                console.log(`New user created: ${newUser.id} linked to Strava athlete ${stravaId}`);
            }
          }
          return true;
        } catch (error: unknown) {
          console.error('Unexpected error during Strava sign in:', error);
          return '/login?error=SignInFailed';
        }
      }
      return true;
    },

    async jwt({ token, user, account, profile }: { token: JWT; user?: User; account?: Account | null; profile?: Profile }): Promise<JWT> {
      const customToken = token as CustomJWT;

      if (account && user) {
        if (account.provider === 'strava' && profile) {
          const stravaProfile = profile as StravaProfile;
          customToken.accessToken = account.access_token;
          customToken.refreshToken = account.refresh_token;
          customToken.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : undefined;
          customToken.stravaId = stravaProfile.id;

          if (supabaseAdmin && customToken.stravaId) {
              try {
                  const { data: appUser, error } = await supabaseAdmin
                      .from('users')
                      .select('id')
                      .eq('strava_athlete_id', customToken.stravaId)
                      .single() as { data: DbUser | null, error: SupabaseError | null };

                  if (error || !appUser) {
                      console.error('Error fetching user ID for JWT (Strava):', error);
                      customToken.error = "UserNotFoundInDB";
                  } else {
                      customToken.userId = appUser.id;
                  }
              } catch (dbError: unknown) {
                  console.error('DB error fetching user ID for JWT (Strava):', dbError);
                  customToken.error = "DatabaseError";
              }
          }
        } else if (account.provider === 'credentials') {
          if (!user.id) {
            console.error('User ID is missing from credentials provider');
            customToken.error = "MissingUserId";
          } else {
            customToken.userId = user.id;
          }
        }
      }
      
      return customToken;
    },

    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      const customSession = session as CustomSession;
      const customToken = token as CustomJWT;

      // Only set properties if they exist in the token
      if (customToken.accessToken) customSession.accessToken = customToken.accessToken;
      if (customToken.refreshToken) customSession.refreshToken = customToken.refreshToken;
      if (customToken.stravaId) customSession.stravaId = customToken.stravaId;
      if (customToken.userId) customSession.userId = customToken.userId;
      if (customToken.error) customSession.error = customToken.error;

      customSession.user = {
        ...customSession.user,
        // Only set the ID if it exists
        ...(customToken.userId ? { id: customToken.userId } : {})
      };

      return customSession;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};

// Create a function to validate environment variables at runtime
// This prevents environment validation during build time
if (typeof window === 'undefined') {
  // Only run on server-side
  try {
    validateEnvVars();
  } catch (error) {
    // Log error but don't throw during build
    console.error('Environment validation error:', error);
  }
}

// Create individual exported functions for use in components/pages
// But don't initialize NextAuth here
const nextauth = (req: any, res: any) => NextAuth(req, res, authOptions);
export default nextauth;

// Export these helpers separately for component use
export function getNextAuthSession() {
  return NextAuth(authOptions);
}