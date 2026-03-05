import { createHmac, timingSafeEqual } from "crypto";

export const COOKIE_NAME = "toolbox_auth";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Generate an HMAC-SHA256 session token from the password.
 * The token proves the user knew the password without storing it directly.
 */
export function generateSessionToken(password: string): string {
  return createHmac("sha256", password)
    .update("toolbox-session-v1")
    .digest("hex");
}

/**
 * Validate a session token against the current password.
 */
export function validateSessionToken(
  token: string,
  password: string
): boolean {
  const expected = generateSessionToken(password);
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
