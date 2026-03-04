/**
 * @jest-environment node
 */
import { POST } from "@/app/api/translate/route";
import { NextRequest } from "next/server";

jest.mock("@/lib/deepseek", () => ({
  translate: jest.fn(),
}));

jest.mock("@/lib/deepl", () => ({
  translateWithDeepL: jest.fn(),
}));

import { translate } from "@/lib/deepseek";
import { translateWithDeepL } from "@/lib/deepl";
import { UpstreamError, ConfigError } from "@/lib/errors";
const mockTranslate = translate as jest.MockedFunction<typeof translate>;
const mockDeepL = translateWithDeepL as jest.MockedFunction<typeof translateWithDeepL>;

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/translate", () => {
  test("routes pure English to DeepL", async () => {
    mockDeepL.mockResolvedValue("你好世界");

    const res = await POST(
      makeRequest({ text: "hello world", targetLang: "zh", sourceLang: "en" })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.translation).toBe("你好世界");
    expect(mockDeepL).toHaveBeenCalledWith("hello world", "zh");
    expect(mockTranslate).not.toHaveBeenCalled();
  });

  test("routes pure Chinese to DeepL", async () => {
    mockDeepL.mockResolvedValue("Hello world");

    const res = await POST(
      makeRequest({ text: "你好世界", targetLang: "en", sourceLang: "zh" })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.translation).toBe("Hello world");
    expect(mockDeepL).toHaveBeenCalledWith("你好世界", "en");
    expect(mockTranslate).not.toHaveBeenCalled();
  });

  test("routes mixed to DeepSeek", async () => {
    mockTranslate.mockResolvedValue("Hello world, and 你好");

    const res = await POST(
      makeRequest({
        text: "hello 你好",
        targetLang: "en",
        sourceLang: "mixed",
      })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.translation).toBe("Hello world, and 你好");
    expect(mockTranslate).toHaveBeenCalledWith("hello 你好", "en");
    expect(mockDeepL).not.toHaveBeenCalled();
  });

  test("trims input text", async () => {
    mockDeepL.mockResolvedValue("hi");

    await POST(
      makeRequest({ text: "  hello  ", targetLang: "en", sourceLang: "en" })
    );
    expect(mockDeepL).toHaveBeenCalledWith("hello", "en");
  });

  test("rejects invalid targetLang", async () => {
    const res = await POST(
      makeRequest({ text: "hello", targetLang: "fr", sourceLang: "en" })
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe("INVALID_INPUT");
  });

  test("rejects invalid sourceLang", async () => {
    const res = await POST(
      makeRequest({ text: "hello", targetLang: "zh", sourceLang: "fr" })
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe("INVALID_INPUT");
  });

  test("rejects empty text", async () => {
    const res = await POST(
      makeRequest({ text: "", targetLang: "zh", sourceLang: "en" })
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe("EMPTY_INPUT");
  });

  test("rejects whitespace-only text", async () => {
    const res = await POST(
      makeRequest({ text: "   ", targetLang: "zh", sourceLang: "en" })
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe("EMPTY_INPUT");
  });

  test("rejects text exceeding 50000 chars", async () => {
    const longText = "a".repeat(50001);
    const res = await POST(
      makeRequest({ text: longText, targetLang: "zh", sourceLang: "en" })
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe("INPUT_TOO_LONG");
  });

  test("handles DeepL API error", async () => {
    mockDeepL.mockRejectedValue(new UpstreamError("DeepL", 456, "Quota Exceeded"));

    const res = await POST(
      makeRequest({ text: "hello", targetLang: "zh", sourceLang: "en" })
    );
    const data = await res.json();

    expect(res.status).toBe(502);
    expect(data.code).toBe("UPSTREAM_ERROR");
  });

  test("handles DeepSeek API error", async () => {
    mockTranslate.mockRejectedValue(new UpstreamError("DeepSeek", 500, "Internal Server Error"));

    const res = await POST(
      makeRequest({ text: "hello 你好", targetLang: "zh", sourceLang: "mixed" })
    );
    const data = await res.json();

    expect(res.status).toBe(502);
    expect(data.code).toBe("UPSTREAM_ERROR");
  });

  test("handles missing API key as 502", async () => {
    mockDeepL.mockRejectedValue(new ConfigError("DEEPL_API_KEY"));

    const res = await POST(
      makeRequest({ text: "hello", targetLang: "zh", sourceLang: "en" })
    );
    const data = await res.json();

    expect(res.status).toBe(502);
    expect(data.code).toBe("UPSTREAM_ERROR");
  });

  test("handles unknown errors", async () => {
    mockDeepL.mockRejectedValue(new Error("Something unexpected"));

    const res = await POST(
      makeRequest({ text: "hello", targetLang: "zh", sourceLang: "en" })
    );
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.code).toBe("INTERNAL_ERROR");
  });
});
