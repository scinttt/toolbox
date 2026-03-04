import { NextRequest, NextResponse } from "next/server";
import { RateLimiter } from "@/lib/rate-limit";

const COOKIE_NAME = "translator_auth";

const limiter = new RateLimiter({
  windowMs: 60_000,
  maxRequests: 60,
});

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes through without auth
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/icon" ||
    pathname === "/apple-icon"
  ) {
    return NextResponse.next();
  }

  // Auth check
  const validPassword = process.env.BASIC_AUTH_PASS;
  if (!validPassword) {
    // No password configured — allow in dev, block in production
    if (process.env.NODE_ENV === "development") return NextResponse.next();
    return new NextResponse("Server misconfigured: BASIC_AUTH_PASS must be set", {
      status: 500,
    });
  }

  const authCookie = request.cookies.get(COOKIE_NAME);
  if (!authCookie || authCookie.value !== validPassword) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Rate limiting (only for API routes)
  if (pathname.startsWith("/api/")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const result = limiter.check(ip);

    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many requests, please try again later", code: "RATE_LIMITED" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)),
          },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
