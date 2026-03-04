import { validateAudioUrl } from "@/lib/audio-url";

describe("validateAudioUrl", () => {
  test("returns valid HTTPS URL as-is", () => {
    expect(validateAudioUrl("https://example.com/audio.mp3")).toBe(
      "https://example.com/audio.mp3"
    );
  });

  test("accepts dictionaryapi.dev URL", () => {
    const url = "https://api.dictionaryapi.dev/media/pronunciations/en/hello-au.mp3";
    expect(validateAudioUrl(url)).toBe(url);
  });

  test("rejects HTTP URL", () => {
    expect(validateAudioUrl("http://example.com/audio.mp3")).toBeNull();
  });

  test("rejects javascript: protocol", () => {
    expect(validateAudioUrl("javascript:alert(1)")).toBeNull();
  });

  test("rejects data: protocol", () => {
    expect(validateAudioUrl("data:audio/mp3;base64,abc")).toBeNull();
  });

  test("rejects empty string", () => {
    expect(validateAudioUrl("")).toBeNull();
  });

  test("returns null for null input", () => {
    expect(validateAudioUrl(null)).toBeNull();
  });

  test("rejects malformed URL", () => {
    expect(validateAudioUrl("not-a-url")).toBeNull();
  });
});
