import { NextRequest, NextResponse } from "next/server";
import {
  COOKIE_NAME,
  COOKIE_MAX_AGE,
  generateSessionToken,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const validPassword = process.env.BASIC_AUTH_PASS;

  if (!validPassword) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  if (password !== validPassword) {
    return NextResponse.json(
      { error: "Incorrect password" },
      { status: 401 }
    );
  }

  const token = generateSessionToken(validPassword);
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return response;
}
