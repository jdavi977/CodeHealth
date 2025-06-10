import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// This variable contains the function createRouteMatcher. Any pathways placed here will need to be protected by authentication.
const isProtectedRoute = createRouteMatcher(["/generate-program", "/profile"]);

// This clerkMiddleware method intercepts all incoming requests. 
// If a protected pathway is requested the method will make sure they are authenticated first.
export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};