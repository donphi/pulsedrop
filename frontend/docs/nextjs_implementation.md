# Architectural Report: NextAuth.js Integration with Supabase & Strava OAuth

This report outlines the implementation strategy for integrating NextAuth.js with Supabase and adding Strava OAuth authentication, adhering to the project's technical standards and constraints.

## 1. Integrate NextAuth.js with Supabase

**Strategy:** Utilize the official `@next-auth/supabase-adapter` to seamlessly connect NextAuth.js with the existing Supabase instance for user persistence and session management.

**Implementation Steps:**

1.  **Install Adapter:** Add `@next-auth/supabase-adapter` as a project dependency.
2.  **Configure Adapter:**
    *   In `/lib/auth.ts`, import the `SupabaseAdapter` and the configured `supabaseClient` from `/lib/supabaseClient.ts`.
    *   Instantiate the adapter within the `AuthOptions`, passing the `supabaseClient` instance:
        ```typescript
        // Example snippet for /lib/auth.ts
        import { SupabaseAdapter } from "@next-auth/supabase-adapter"
        import { supabaseClient } from "@/lib/supabaseClient" // Adjust path as needed
        import { AuthOptions } from "next-auth"

        export const authOptions: AuthOptions = {
          adapter: SupabaseAdapter({
            url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
            secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          }),
          // ... other options
        };
        ```
    *   Ensure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are defined in `.env` (and present in `.env.template`) as per security protocols. The adapter handles the necessary database interactions based on the standard NextAuth.js schema.

## 2. Configure Strava OAuth

**Strategy:** Add Strava as an OAuth provider within the NextAuth.js configuration, securely handling credentials via environment variables.

**Implementation Steps:**

1.  **Update `.env.template`:** Add `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET` to the `.env.template` file.
2.  **Configure Provider:**
    *   In `/lib/auth.ts`, import the `StravaProvider` from `next-auth/providers/strava`.
    *   Add the `StravaProvider` to the `providers` array within `AuthOptions`.
    *   Reference the environment variables for the client ID and secret:
        ```typescript
        // Example snippet for /lib/auth.ts
        import StravaProvider from "next-auth/providers/strava";

        export const authOptions: AuthOptions = {
          // ... adapter config
          providers: [
            StravaProvider({
              clientId: process.env.STRAVA_CLIENT_ID!,
              clientSecret: process.env.STRAVA_CLIENT_SECRET!,
              authorization: {
                params: {
                  scope: "read,activity:read_all,profile:read_all", // Define required scopes
                },
              },
            }),
            // ... other providers if any
          ],
          // ... other options
        };
        ```
    *   Define the necessary Strava API scopes (e.g., `read,activity:read_all,profile:read_all`) within the provider configuration's `authorization.params.scope` property.

## 3. Session & Cookie Management

**Strategy:** Leverage NextAuth.js's default secure session and cookie management mechanisms.

**Implementation Details:**

*   **Session Strategy:** By default, when using a database adapter like the Supabase adapter, NextAuth.js uses a `database` session strategy. This is secure and suitable for this setup. Explicit configuration (`session: { strategy: "database" }`) in `/lib/auth.ts` is generally not required unless overriding defaults.
*   **Cookies:** NextAuth.js automatically handles session cookies, setting them as `HttpOnly` and `Secure` (in production) by default. No specific configuration is typically needed unless advanced customization of cookie names, paths, or domains is required, which can be done within the `cookies` object in `AuthOptions`.
*   **JWT:** While the session strategy is `database`, NextAuth.js still uses JWTs internally for communication between the server and client components/middleware. The encoding/decoding secrets will be managed via the `NEXTAUTH_SECRET` environment variable (ensure it's in `.env.template` and `.env`).

## 4. Supabase User Schema

**Strategy:** Define a `profiles` table in Supabase to store application-specific user data, linked to the authentication data managed by Supabase Auth and the NextAuth.js adapter.

**Schema Definition:**

*   **`users` Table:** Managed automatically by Supabase Auth and the NextAuth.js adapter. Contains core user identity info (e.g., `id`, `email`).
*   **`accounts` Table:** Managed automatically by the NextAuth.js adapter. Links `users.id` to provider accounts (e.g., Strava `providerAccountId`).
*   **`sessions` Table:** Managed automatically by the NextAuth.js adapter for database sessions.
*   **`verification_tokens` Table:** Managed automatically by the NextAuth.js adapter if email verification is used.
*   **`profiles` Table (Custom):**
    *   `id` (UUID, Default: `gen_random_uuid()`, Primary Key)
    *   `user_id` (UUID, Foreign Key referencing `auth.users.id` ON DELETE CASCADE, Unique, Not Null) - *Ensure this references `auth.users.id` correctly.*
    *   `strava_athlete_id` (BigInt, Unique, Nullable) - Stores the unique athlete ID from Strava.
    *   `first_name` (Text, Nullable)
    *   `last_name` (Text, Nullable)
    *   `profile_picture_url` (Text, Nullable) - URL to the user's Strava profile picture.
    *   `created_at` (Timestamptz, Default: `now()`, Not Null)
    *   `updated_at` (Timestamptz, Default: `now()`, Not Null)

**Note:** Row Level Security (RLS) policies must be configured on the `profiles` table to ensure users can only access/modify their own profile data.

## 5. Initial Profile Data Population

**Strategy:** Populate the custom `profiles` table with data fetched from Strava during the user's *first* successful sign-in via the Strava OAuth provider.

**Implementation Steps:**

1.  **Utilize Callbacks:** Implement logic within the `callbacks` object in `/lib/auth.ts`, specifically the `signIn` callback.
2.  **Check for Existing Profile:** Inside the `signIn` callback, when the sign-in is successful (`user` and `account` objects are available, and `account.provider === 'strava'`), query the `profiles` table using the `user.id` provided by the adapter.
3.  **Create Profile on First Login:**
    *   If no profile exists for the `user.id`, it indicates a first-time login with Strava for this user.
    *   Extract relevant data from the `profile` object passed to the `signIn` callback (e.g., `profile.id` for `strava_athlete_id`, `profile.firstname`, `profile.lastname`, `profile.profile`). *Note: The exact structure of the Strava `profile` object should be verified from NextAuth.js documentation or testing.*
    *   Insert a new record into the `profiles` table using the extracted Strava data and the `user.id`.
    *   Ensure this database operation is handled securely, potentially within a try/catch block, and returns `true` from the `signIn` callback upon success. If profile creation fails, return `false` or redirect to an error page to prevent login.

