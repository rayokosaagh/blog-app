import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const middleware = auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard") && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Admin only routes
  if (pathname.startsWith("/dashboard/users")) {
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};