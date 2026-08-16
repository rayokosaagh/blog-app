import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Runs at the edge, so it deliberately does NOT import `@/auth` — that module
 * pulls in Prisma, whose WASM query compiler cannot run in the Edge runtime
 * and fails the whole request. Reading the JWT directly keeps this edge-safe.
 *
 * This is a first line of defence only. Every guarded route re-checks the role
 * server-side (the dashboard layouts, and each /api route), because a proxy
 * that silently stops running must never be the only thing standing in the way.
 */
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  const role = token?.role as string | undefined;
  const isStaff = role === "ADMIN" || role === "EDITOR";

  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL(isStaff ? "/dashboard" : "/", req.url));
  }

  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // The dashboard is staff tooling. A READER — anyone signed in via
    // Google/GitHub as a public reader — has a valid session but isn't staff,
    // so being logged in is not on its own enough to see it.
    if (!isStaff) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (pathname.startsWith("/dashboard/users") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
