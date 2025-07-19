import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const session = await auth();

  // If no session, redirect to home page
  if (!session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Otherwise, allow the request
  return NextResponse.next();
}

// Apply middleware only to these routes
export const config = {
  matcher: ["/dashboard/:path*"], // Adjust this as needed
};
