import { auth } from "@/auth";

// No callback: when authorized() returns false, NextAuth redirects to pages.signIn
export default auth;

export const config = {
  matcher: ["/admin/:path*"],
};
