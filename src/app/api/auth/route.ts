import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const COOKIE_NAME = "translator_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

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

  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, validPassword, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return response;
}
