import {
  translateWithDeepL,
  callDeepL,
  batchTexts,
  getDeepLTargetLang,
  DEEPL_API_URL,
} from "@/lib/deepl";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const originalEnv = process.env;

beforeEach(() => {
  jest.resetAllMocks();
  process.env = { ...originalEnv, DEEPL_API_KEY: "test-deepl-key" };
});

afterAll(() => {
  process.env = originalEnv;
});

function mockDeepLResponse(texts: string[]) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      translations: texts.map((text) => ({
        detected_source_language: "EN",
        text,
      })),
    }),
  });
}

describe("getDeepLTargetLang", () => {
  test("maps zh to ZH-HANS", () => {
    expect(getDeepLTargetLang("zh")).toBe("ZH-HANS");
  });

  test("maps en to EN", () => {
    expect(getDeepLTargetLang("en")).toBe("EN");
  });
});

describe("batchTexts", () => {
  test("returns single batch for few short texts", () => {
    const batches = batchTexts(["hello", "world"]);
    expect(batches).toEqual([["hello", "world"]]);
  });

  test("splits at 50 texts per batch", () => {
    const texts = Array.from({ length: 60 }, (_, i) => `text ${i}`);
    const batches = batchTexts(texts);
    expect(batches.length).toBe(2);
    expect(batches[0].length).toBe(50);
    expect(batches[1].length).toBe(10);
  });
});

describe("callDeepL", () => {
  test("calls DeepL API with correct params", async () => {
    mockDeepLResponse(["你好世界"]);

    const results = await callDeepL(["hello world"], "zh");
    expect(results).toEqual(["你好世界"]);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe(DEEPL_API_URL);
    expect(options.method).toBe("POST");
    expect(options.headers["Authorization"]).toBe(
      "DeepL-Auth-Key test-deepl-key"
    );

    const body = JSON.parse(options.body);
    expect(body.text).toEqual(["hello world"]);
    expect(body.target_lang).toBe("ZH-HANS");
  });

  test("throws when API key missing", async () => {
    delete process.env.DEEPL_API_KEY;

    await expect(callDeepL(["hello"], "zh")).rejects.toThrow(
      "DEEPL_API_KEY is not configured"
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("throws on API error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 456,
      statusText: "Quota Exceeded",
    });

    await expect(callDeepL(["hello"], "zh")).rejects.toThrow(
      "DeepL API error: 456"
    );
  });

  test("throws on empty response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ translations: [] }),
    });

    await expect(callDeepL(["hello"], "zh")).rejects.toThrow(
      "DeepL returned empty response"
    );
  });

  test("translates to English", async () => {
    mockDeepLResponse(["Hello world"]);

    const results = await callDeepL(["你好世界"], "en");
    expect(results).toEqual(["Hello world"]);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.target_lang).toBe("EN");
  });
});

describe("translateWithDeepL", () => {
  test("short text uses single API call", async () => {
    mockDeepLResponse(["你好世界"]);

    const result = await translateWithDeepL("hello world", "zh");
    expect(result).toBe("你好世界");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
