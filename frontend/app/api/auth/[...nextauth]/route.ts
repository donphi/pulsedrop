import { auth } from '@/lib/auth'; // Corrected relative path

// Export the handlers for GET and POST requests
// These handlers manage all the NextAuth.js API endpoints (signin, signout, callback, session, etc.)
export const GET = auth;
export const POST = auth;

// Optional: If you need edge compatibility (e.g., for Vercel Edge Functions),
// you might need to set the runtime. Check NextAuth.js documentation for details.
// export const runtime = "edge";