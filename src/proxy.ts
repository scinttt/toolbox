import { NextRequest, NextResponse } from "next/server";
import { RateLimiter } from "@/lib/rate-limit";
import { COOKIE_NAME, validateSessionToken } from "@/lib/auth";

const apiLimiter = new RateLimiter({
  windowMs: 60_000,
  maxRequests: 60,
});

// Stricter limiter for login attempts
const authLimiter = new RateLimiter({
  windowMs: 60_000,
  maxRequests: 10,
});

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets — always pass through
  if (
    pathname.startsWith("/login") ||
    pathname === "/icon" ||
    pathname === "/apple-icon"
  ) {
    return NextResponse.next();
  }

  // Rate limit /api/auth BEFORE allowing through (prevent brute-force)
  if (pathname.startsWith("/api/auth")) {
    const ip = getClientIp(request);
    const result = authLimiter.check(ip);
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts, please try again later", code: "RATE_LIMITED" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)),
          },
        }
      );
    }
    return NextResponse.next();
  }

  // Auth check
  const validPassword = process.env.BASIC_AUTH_PASS;
  if (!validPassword) {
    if (process.env.NODE_ENV === "development") return NextResponse.next();
    return new NextResponse("Server misconfigured: BASIC_AUTH_PASS must be set", {
      status: 500,
    });
  }

  const authCookie = request.cookies.get(COOKIE_NAME);
  if (!authCookie || !validateSessionToken(authCookie.value, validPassword)) {
    // API routes get a JSON 401; pages redirect to login
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    const ip = getClientIp(request);
    const result = apiLimiter.check(ip);

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
