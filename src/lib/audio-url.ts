/**
 * Validate that an audio URL is safe to play.
 * Returns the URL if valid, or null if not.
 */
export function validateAudioUrl(url: string | null): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}
