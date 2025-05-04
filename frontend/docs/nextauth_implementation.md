```markdown
# Authentication Flows Documentation (NextAuth.js Implementation)

This document outlines the mandated authentication flows for the application, utilizing **NextAuth.js** as the primary authentication layer, integrated with Supabase via the `@next-auth/supabase-adapter` and the Strava OAuth provider.

**Note:** This documentation describes the *intended* flow using NextAuth.js, adhering to the project's tech stack requirements and the plan in `frontend/docs/nextjs_implementation.md`. It assumes the standard database schema required by `@next-auth/supabase-adapter` (`users`, `accounts`, `sessions`, `verification_tokens` within the Supabase `auth` schema or `public` schema depending on adapter config) is used for storing core authentication data, including provider tokens. Existing SQL files (`frontend/docs/users.sql`, `frontend/docs/strava_athlete.sql`) may define alternative structures which would need to be reconciled during implementation.

## 1. Strava OAuth Flow (via NextAuth.js)

This flow uses the NextAuth.js Strava provider and the Supabase adapter.

1.  **Initiation:**
    *   User clicks a "Login with Strava" button.
    *   The client-side code calls the NextAuth.js `signIn('strava')` function.

2.  **Redirect to NextAuth.js:**
    *   The `signIn` function redirects the user to the NextAuth.js API route responsible for handling Strava authentication (typically `/api/auth/signin/strava`).

3.  **Redirect to Strava:**
    *   The NextAuth.js Strava provider redirects the user's browser to the Strava authorization page, including the configured scopes (e.g., `read,activity:read_all,profile:read_all`).

4.  **Strava Login & Authorization:**
    *   The user logs into their Strava account (if not already logged in).
    *   Strava prompts the user to authorize the application with the requested scopes.

5.  **Callback to NextAuth.js:**
    *   Upon successful authorization, Strava redirects the user back to the application's NextAuth.js callback URL (typically `/api/auth/callback/strava`).

6.  **NextAuth.js Processing & Adapter Interaction:**
    *   The NextAuth.js Strava provider handles the callback.
    *   It exchanges the authorization code received from Strava for an `access_token`, `refresh_token`, and expiry time.
    *   NextAuth.js invokes the `@next-auth/supabase-adapter`'s methods:
        *   `getUserByAccount`: Checks if an account already exists for this Strava user (`provider` = 'strava', `providerAccountId` = Strava User ID).
        *   If the account exists, it retrieves the linked user from the `users` table. It may also update the tokens in the `accounts` table if they have changed.
        *   If the account *doesn't* exist:
            *   `getUserByEmail`: Checks if a user with the email provided by Strava already exists in the `users` table.
            *   If no user exists, `createUser` is called to add a new record to the `users` table using profile information from Strava (email, name, image).
            *   `linkAccount` is called to create a new record in the `accounts` table, linking the `users` record (`userId`) to the Strava provider (`provider`, `providerAccountId`) and storing the `access_token`, `refresh_token`, `expires_at`, and `scope`.
        *   **(Optional Custom Logic):** If defined, NextAuth.js `callbacks` (like `signIn` or `jwt`/`session`) could be used here to perform additional actions, such as populating a separate `profiles` table with Strava data upon first login, as suggested in `nextjs_implementation.md`.

7.  **Session Establishment:**
    *   NextAuth.js establishes a user session. Since the `database` session strategy is used (default with adapters), session details are stored in the `sessions` table managed by the adapter.
    *   A secure session cookie is set in the user's browser.

8.  **Redirection:** The user is typically redirected to a protected page (e.g., `/dashboard`) or their intended destination.

9.  **Error Handling:**
    *   Errors during the flow (e.g., user denies access on Strava, Strava API issues, adapter database errors) are handled by NextAuth.js.
    *   The user is typically redirected back to a login or error page, often with error details in the URL query parameters (e.g., `/login?error=OAuthCallback`).

## 2. Email Login Flow (via NextAuth.js Credentials Provider)

This flow uses the NextAuth.js Credentials provider, which internally validates credentials against Supabase Auth.

1.  **Input:** User enters their email and password into a login form.
2.  **Submission:** The form submission triggers a call to the NextAuth.js `signIn('credentials', { email, password, redirect: false })` function.
3.  **NextAuth.js Credentials Provider:**
    *   The request is sent to the NextAuth.js API route (typically `/api/auth/callback/credentials`).
    *   The configured Credentials provider's `authorize` function is executed.
4.  **Validation via Supabase Auth:**
    *   Inside the `authorize` function, code calls `supabase.auth.signInWithPassword({ email, password })` to verify the credentials against Supabase's `auth.users` table.
    *   **Important:** This requires a configured Supabase client instance available server-side.
5.  **User Retrieval/Linking:**
    *   If `signInWithPassword` is successful, it returns Supabase user details (including the Supabase User ID and email).
    *   The `authorize` function should then:
        *   Use the returned email or Supabase User ID to query the `users` table managed by the NextAuth.js adapter (using `adapter.getUserByEmail` or potentially a custom query if linking via Supabase ID).
        *   If a user record exists in the adapter's `users` table, return that user object (containing at least `id` and `email`).
        *   If no user record exists in the adapter's `users` table (e.g., user signed up via Supabase UI but not via NextAuth before), the `authorize` function might need to create one using `adapter.createUser` before returning the user object. This ensures consistency within the NextAuth.js session/adapter context.
    *   If `signInWithPassword` fails, the `authorize` function should return `null` or throw an error, causing NextAuth.js to reject the sign-in attempt.
6.  **Session Establishment:**
    *   If the `authorize` function returns a valid user object, NextAuth.js proceeds to establish a session as described in the Strava flow (using the database strategy and setting a session cookie).
7.  **Client Response:** The `signIn` call on the client-side resolves. If successful (`redirect: false` was used), the result indicates success, allowing client-side redirection (e.g., `router.push('/dashboard')`). If unsuccessful, the result indicates an error.
8.  **Error Handling:** Errors from `signInWithPassword` or if the `authorize` function returns `null` are caught by NextAuth.js. The client-side `signIn` call will return an error object, allowing the UI to display feedback (e.g., "Invalid credentials").

## 3. Session Management & Data Retrieval (NextAuth.js Context)

Once authenticated via NextAuth.js (using any provider):

1.  **Session Validation:** NextAuth.js manages the user's session via the database adapter and secure cookies.
    *   **Server-Side (RSC, API Routes):** Use `import { auth } from "@/lib/auth"` (assuming `auth.ts` exports handlers) or `getServerSession(authOptions)` to securely retrieve the session data, which includes `user.id` (the ID from the adapter's `users` table).
    *   **Client-Side:** Use the `useSession()` hook from `next-auth/react` (requires `<SessionProvider>`).
2.  **Data Access:**
    *   The `user.id` obtained from the NextAuth.js session is the primary key for querying application-specific data.
    *   Use this `user.id` to query the Supabase database (e.g., a `profiles` table or the `public.users` table if adapted) for related application data.
    *   **RLS:** Row Level Security policies in Supabase should be configured based on the `user.id` present in the *NextAuth.js session context*, likely requiring a way to pass this authenticated user ID securely to Supabase queries (e.g., via custom Supabase client setup or API route validation). Standard Supabase RLS often relies on `auth.uid()`, which corresponds to the Supabase Auth user; careful integration is needed if NextAuth.js manages the primary session state.

```