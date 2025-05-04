import NextAuth, { type NextAuthOptions, type Account, type Profile, type User, type Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import StravaProvider from 'next-auth/providers/strava';
import { supabaseAdmin } from './supabaseServiceRoleClient'; // Use the service role client for admin tasks

// Type definitions (adjust based on actual Strava profile structure and your DB schema)
// These might need refinement once Supabase types are generated and Strava response is confirmed.
interface StravaProfile extends Profile {
  id: number; // Strava Athlete ID
  firstname?: string;
  lastname?: string;
  username?: string;
  bio?: string;
  city?: string;
  state?: string;
  country?: string;
  sex?: 'M' | 'F' | null;
  profile_medium?: string; // URL
  profile?: string; // URL
  premium?: boolean;
  summit?: boolean;
  created_at?: string; // ISO Date string
  updated_at?: string; // ISO Date string
  weight?: number;
  // Add other fields as needed from Strava API response
}

interface CustomJWT extends JWT {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
  stravaId?: number;
  userId?: string; // Our application's user ID (from public.users)
  error?: string;
}

// Define the expected structure of the user object in the session
interface CustomSessionUser {
  id?: string; // Our application's user ID (from public.users)
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface CustomSession extends Session {
  accessToken?: string;
  refreshToken?: string;
  stravaId?: number;
  userId?: string; // Our application's user ID (duplicate for direct access if needed)
  error?: string;
  user?: CustomSessionUser; // Override the default user type
}

// Ensure environment variables are defined
const stravaClientId = process.env.STRAVA_CLIENT_ID;
const stravaClientSecret = process.env.STRAVA_CLIENT_SECRET;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;

if (!stravaClientId) throw new Error('Missing environment variable: STRAVA_CLIENT_ID');
if (!stravaClientSecret) throw new Error('Missing environment variable: STRAVA_CLIENT_SECRET');
if (!nextAuthSecret) throw new Error('Missing environment variable: NEXTAUTH_SECRET');

export const authOptions: NextAuthOptions = {
  providers: [
    StravaProvider({
      clientId: stravaClientId,
      clientSecret: stravaClientSecret,
      authorization: {
        params: {
          scope: 'read,activity:read_all,profile:read_all', // Request necessary scopes
        },
      },
    }),
    // Add other providers if needed
  ],
  secret: nextAuthSecret,
  session: {
    strategy: 'jwt', // Using JWT strategy for session management
  },
  callbacks: {
    /**
     * Called on successful sign in.
     * Handles creating/updating user and athlete records in Supabase.
     */
    async signIn({ user, account, profile }: { user: User; account: Account | null; profile?: Profile }): Promise<boolean | string> {
      if (account?.provider === 'strava' && profile && supabaseAdmin) {
        const stravaProfile = profile as StravaProfile;
        const stravaId = stravaProfile.id;

        if (!stravaId) {
          console.error('Strava profile missing ID:', stravaProfile);
          return '/login?error=OAuthAccountNotLinked'; // Redirect with error
        }

        try {
          // 1. Check if strava_athlete exists
          const { data: existingAthlete, error: athleteError } = await supabaseAdmin
            .from('strava_athletes')
            .select('strava_id')
            .eq('strava_id', stravaId)
            .maybeSingle();

          if (athleteError) {
            console.error('Error checking for existing Strava athlete:', athleteError);
            return '/login?error=DatabaseError';
          }

          const athleteData = {
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
            // 2a. Athlete exists, update tokens and profile info
            const { error: updateError } = await supabaseAdmin
              .from('strava_athletes')
              .update(athleteData)
              .eq('strava_id', stravaId);

            if (updateError) {
              console.error('Error updating Strava athlete:', updateError);
              return '/login?error=DatabaseError';
            }
            console.log(`Strava athlete updated: ${stravaId}`);
          } else {
            // 2b. Athlete does not exist, create athlete and user records
            // Create strava_athlete first
            const { error: insertAthleteError } = await supabaseAdmin
              .from('strava_athletes')
              .insert(athleteData);

            if (insertAthleteError) {
              console.error('Error inserting Strava athlete:', insertAthleteError);
              // Potential conflict if username is not unique? Handle specific errors if needed.
              return '/login?error=DatabaseError';
            }
            console.log(`Strava athlete created: ${stravaId}`);

            // Create corresponding user record in public.users
            // Use Strava profile info for initial user details
            const newUserEmail = user.email; // Email should be provided by NextAuth from Strava
            if (!newUserEmail) {
                console.error('Email missing from Strava profile/NextAuth user object.');
                // Decide how to handle missing email - maybe redirect with specific error?
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
                // User with this email exists, link them to the new Strava athlete
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
                // User with this email does not exist, create a new user record
                const { data: newUser, error: insertUserError } = await supabaseAdmin
                    .from('users')
                    .insert({
                        email: newUserEmail,
                        strava_athlete_id: stravaId,
                        // Populate display_name, potentially from Strava firstname/lastname
                        display_name: `${stravaProfile.firstname || ''} ${stravaProfile.lastname || ''}`.trim() || stravaProfile.username || 'New User',
                        // app_preferences: {}, // Initialize preferences if needed
                    })
                    .select('id') // Select the ID of the newly created user
                    .single(); // Expect a single record

                if (insertUserError || !newUser) {
                    console.error('Error inserting new user:', insertUserError);
                    // Rollback? Or handle inconsistency? For now, log and return error.
                    // Consider deleting the just-created strava_athlete record if user creation fails.
                    return '/login?error=DatabaseError';
                }
                console.log(`New user created: ${newUser.id} linked to Strava athlete ${stravaId}`);
            }
          }
          return true; // Sign in successful
        } catch (error) {
          console.error('Unexpected error during Strava sign in:', error);
          return '/login?error=SignInFailed';
        }
      }
      // Allow other providers or scenarios
      return true;
    },

    /**
     * Called whenever a JWT is created or updated.
     * Persists access token, expiry, refresh token, and IDs in the JWT.
     */
    async jwt({ token, user, account, profile }: { token: JWT; user?: User; account?: Account | null; profile?: Profile }): Promise<JWT> {
      const customToken = token as CustomJWT;

      // Initial sign in
      if (account && user && profile && account.provider === 'strava') {
        const stravaProfile = profile as StravaProfile;
        customToken.accessToken = account.access_token;
        customToken.refreshToken = account.refresh_token;
        customToken.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : undefined; // Convert to ms
        customToken.stravaId = stravaProfile.id;

        // Fetch our application user ID from public.users based on stravaId
        if (supabaseAdmin && customToken.stravaId) {
            try {
                const { data: appUser, error } = await supabaseAdmin
                    .from('users')
                    .select('id')
                    .eq('strava_athlete_id', customToken.stravaId)
                    .single();

                if (error || !appUser) {
                    console.error('Error fetching user ID for JWT:', error);
                    customToken.error = "UserNotFoundInDB";
                } else {
                    customToken.userId = appUser.id;
                }
            } catch (dbError) {
                console.error('DB error fetching user ID for JWT:', dbError);
                customToken.error = "DatabaseError";
            }
        }
        return customToken;
      }

      // TODO: Implement token refresh logic if needed
      // Check if the access token is expired
      // if (customToken.accessTokenExpires && Date.now() >= customToken.accessTokenExpires) {
      //   console.log('Access token expired, attempting refresh...');
      //   // Call refreshAccessToken function (needs implementation)
      //   // return refreshAccessToken(customToken);
      // }

      return customToken; // Return previous token if not expired or not initial sign in
    },

    /**
     * Called whenever a session is checked.
     * Exposes necessary data to the client-side session object.
     */
    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      const customSession = session as CustomSession;
      const customToken = token as CustomJWT;

      // Add data from JWT to the session
      customSession.accessToken = customToken.accessToken;
      customSession.refreshToken = customToken.refreshToken; // Be careful about exposing refresh token to client
      customSession.stravaId = customToken.stravaId;
      customSession.userId = customToken.userId;
      customSession.error = customToken.error; // Pass potential errors

      // Add userId to the session.user object, creating it if necessary
      // The user object might already exist from the default session population
      customSession.user = {
        ...customSession.user, // Preserve existing user properties (like name, email, image)
        id: customToken.userId, // Add our application user ID
      };

      return customSession;
    },
  },
  pages: {
    signIn: '/login', // Redirect users to custom login page
    error: '/login', // Redirect users to login page on error (will pass error query param)
  },
  // Add debug option if needed during development
  // debug: process.env.NODE_ENV === 'development',
};

// Export handlers for the API route
export const { handlers, signIn, signOut, auth } = NextAuth(authOptions);