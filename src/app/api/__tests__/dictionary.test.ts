/**
 * @jest-environment node
 */
import { POST } from "@/app/api/dictionary/route";
import { NextRequest } from "next/server";

jest.mock("@/lib/dictionary", () => ({
  lookupWord: jest.fn(),
}));

import { lookupWord } from "@/lib/dictionary";
import { UpstreamError, ConfigError } from "@/lib/errors";
const mockLookupWord = lookupWord as jest.MockedFunction<typeof lookupWord>;

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/dictionary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

const mockDictResult = {
  word: "hello",
  phonetics: [{ text: "/həˈloʊ/", audio: "https://audio.mp3" }],
  meanings: [
    {
      partOfSpeech: "exclamation",
      definitions: [{ definition: "used as a greeting" }],
    },
  ],
  source: "dictionary_api" as const,
};

describe("POST /api/dictionary", () => {
  test("successful English word lookup", async () => {
    mockLookupWord.mockResolvedValue(mockDictResult);

    const res = await POST(makeRequest({ word: "hello", targetLang: "en" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.word).toBe("hello");
    expect(data.source).toBe("dictionary_api");
    expect(mockLookupWord).toHaveBeenCalledWith("hello", "en");
  });

  test("successful Chinese word lookup", async () => {
    const chineseResult = {
      word: "苹果",
      phonetics: [{ text: "píng guǒ", audio: null }],
      meanings: [
        { partOfSpeech: "noun", definitions: [{ definition: "apple" }] },
      ],
      source: "llm" as const,
    };
    mockLookupWord.mockResolvedValue(chineseResult);

    const res = await POST(makeRequest({ word: "苹果", targetLang: "en" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.word).toBe("苹果");
    expect(data.source).toBe("llm");
  });

  test("rejects invalid targetLang", async () => {
    const res = await POST(makeRequest({ word: "hello", targetLang: "fr" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe("INVALID_WORD");
  });

  test("rejects empty word", async () => {
    const res = await POST(makeRequest({ word: "", targetLang: "en" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe("INVALID_WORD");
  });

  test("rejects non-word input (sentence)", async () => {
    const res = await POST(makeRequest({ word: "hello world", targetLang: "en" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe("INVALID_WORD");
  });

  test("handles DeepSeek API error", async () => {
    mockLookupWord.mockRejectedValue(new UpstreamError("DeepSeek", 500, "Internal Server Error"));

    const res = await POST(makeRequest({ word: "hello", targetLang: "en" }));
    const data = await res.json();

    expect(res.status).toBe(502);
    expect(data.code).toBe("UPSTREAM_ERROR");
  });

  test("handles missing API key error", async () => {
    mockLookupWord.mockRejectedValue(new ConfigError("DEEPSEEK_API_KEY"));

    const res = await POST(makeRequest({ word: "苹果", targetLang: "en" }));
    const data = await res.json();

    expect(res.status).toBe(502);
    expect(data.code).toBe("UPSTREAM_ERROR");
  });

  test("handles unknown errors", async () => {
    mockLookupWord.mockRejectedValue(new Error("Something unexpected"));

    const res = await POST(makeRequest({ word: "hello", targetLang: "en" }));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.code).toBe("INTERNAL_ERROR");
  });
});
