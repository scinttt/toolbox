import { translate, lookupChineseWord, lookupEnglishWordFallback, translateDefinitions, extractJSON } from "@/lib/deepseek";
import { ParseError } from "@/lib/errors";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const originalEnv = process.env;

beforeEach(() => {
  jest.resetAllMocks();
  process.env = { ...originalEnv, DEEPSEEK_API_KEY: "test-key" };
});

afterAll(() => {
  process.env = originalEnv;
});

function mockDeepSeekResponse(content: string) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      choices: [{ message: { content } }],
    }),
  });
}

describe("translate", () => {
  test("translates text to Chinese", async () => {
    mockDeepSeekResponse("你好世界");

    const result = await translate("hello world", "zh");
    expect(result).toBe("你好世界");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.deepseek.com/chat/completions");
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body);
    expect(body.model).toBe("deepseek-chat");
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[0].content).toContain("Chinese");
    expect(body.messages[1].content).toBe("hello world");
  });

  test("translates text to English", async () => {
    mockDeepSeekResponse("Hello world");

    const result = await translate("你好世界", "en");
    expect(result).toBe("Hello world");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.messages[0].content).toContain("English");
  });

  test("throws when API key is missing", async () => {
    delete process.env.DEEPSEEK_API_KEY;

    await expect(translate("hello", "zh")).rejects.toThrow(
      "DEEPSEEK_API_KEY is not configured"
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("throws on API error response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(translate("hello", "zh")).rejects.toThrow("DeepSeek API error: 500");
  });

  test("throws on empty response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [] }),
    });

    await expect(translate("hello", "zh")).rejects.toThrow(
      "DeepSeek returned empty response"
    );
  });
});

describe("translate (chunked)", () => {
  test("short text uses single API call", async () => {
    mockDeepSeekResponse("你好世界");

    const result = await translate("hello world", "zh");
    expect(result).toBe("你好世界");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test("long text splits into multiple API calls", async () => {
    // Create text that needs 2 chunks
    const text = "a".repeat(2000) + "\n\n" + "b".repeat(2000);
    mockDeepSeekResponse("翻译A");
    mockDeepSeekResponse("翻译B");

    const result = await translate(text, "zh");
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result).toBe("翻译A\n\n翻译B");
  });
});

describe("extractJSON", () => {
  test("extracts JSON from markdown code block", () => {
    const input = '```json\n{"word": "test"}\n```';
    expect(extractJSON(input)).toBe('{"word": "test"}');
  });

  test("extracts JSON from code block without language tag", () => {
    const input = '```\n{"word": "test"}\n```';
    expect(extractJSON(input)).toBe('{"word": "test"}');
  });

  test("returns raw content when no code block", () => {
    const input = '{"word": "test"}';
    expect(extractJSON(input)).toBe('{"word": "test"}');
  });

  test("handles extra whitespace around code block", () => {
    const input = '```json\n  {"word": "test"}  \n```';
    expect(extractJSON(input)).toBe('{"word": "test"}');
  });
});

describe("lookupChineseWord", () => {
  test("returns structured dictionary data", async () => {
    const dictData = {
      word: "苹果",
      phonetics: [{ text: "píng guǒ", audio: null }],
      meanings: [
        {
          partOfSpeech: "noun",
          definitions: [
            { definition: "apple", example: "I ate an apple." },
          ],
        },
      ],
    };
    mockDeepSeekResponse(JSON.stringify(dictData));

    const result = await lookupChineseWord("苹果", "en");
    expect(result.word).toBe("苹果");
    expect(result.source).toBe("llm");
    expect(result.phonetics[0].text).toBe("píng guǒ");
    expect(result.meanings[0].definitions[0].definition).toBe("apple");
  });

  test("handles markdown-wrapped JSON response", async () => {
    const dictData = {
      word: "日语",
      phonetics: [{ text: "rì yǔ", audio: null }],
      meanings: [
        {
          partOfSpeech: "noun",
          definitions: [
            { definition: "Japanese language", example: "She studies Japanese." },
          ],
        },
      ],
    };
    mockDeepSeekResponse("```json\n" + JSON.stringify(dictData, null, 2) + "\n```");

    const result = await lookupChineseWord("日语", "en");
    expect(result.word).toBe("日语");
    expect(result.source).toBe("llm");
  });

  test("uses correct language instruction for zh target", async () => {
    const dictData = {
      word: "苹果",
      phonetics: [{ text: "píng guǒ", audio: null }],
      meanings: [{ partOfSpeech: "noun", definitions: [{ definition: "水果" }] }],
    };
    mockDeepSeekResponse(JSON.stringify(dictData));

    await lookupChineseWord("苹果", "zh");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.messages[0].content).toContain("Chinese");
    expect(body.messages[0].content).toContain("释义");
  });

  test("throws ParseError on invalid JSON from LLM", async () => {
    mockDeepSeekResponse("this is not json at all");

    await expect(lookupChineseWord("苹果", "en")).rejects.toThrow(ParseError);
  });

  test("throws ParseError on wrong structure from LLM", async () => {
    mockDeepSeekResponse(JSON.stringify({ word: 123, phonetics: "wrong" }));

    await expect(lookupChineseWord("苹果", "en")).rejects.toThrow(ParseError);
  });

  test("accepts response with optional fields missing", async () => {
    const minimal = {
      word: "苹果",
      phonetics: [{ text: null, audio: null }],
      meanings: [{ partOfSpeech: "noun", definitions: [{ definition: "apple" }] }],
    };
    mockDeepSeekResponse(JSON.stringify(minimal));

    const result = await lookupChineseWord("苹果", "en");
    expect(result.word).toBe("苹果");
  });
});

describe("lookupEnglishWordFallback", () => {
  test("returns structured dictionary data with llm_fallback source", async () => {
    const dictData = {
      word: "hello",
      phonetics: [{ text: "/həˈloʊ/", audio: null }],
      meanings: [
        {
          partOfSpeech: "exclamation",
          definitions: [
            { definition: "used as a greeting", example: "Hello there!" },
          ],
        },
      ],
    };
    mockDeepSeekResponse(JSON.stringify(dictData));

    const result = await lookupEnglishWordFallback("hello", "en");
    expect(result.source).toBe("llm_fallback");
    expect(result.word).toBe("hello");
  });
});

describe("translateDefinitions", () => {
  test("translates array of definitions", async () => {
    mockDeepSeekResponse("1. 用作问候\n2. 问候语");

    const result = await translateDefinitions([
      "used as a greeting",
      "an utterance of hello",
    ]);
    expect(result).toEqual(["用作问候", "问候语"]);
  });

  test("returns empty array for empty input", async () => {
    const result = await translateDefinitions([]);
    expect(result).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("pads with empty strings if LLM returns fewer translations", async () => {
    mockDeepSeekResponse("1. 用作问候");

    const result = await translateDefinitions([
      "used as a greeting",
      "an utterance of hello",
    ]);
    expect(result.length).toBe(2);
    expect(result[0]).toBe("用作问候");
    expect(result[1]).toBe("");
  });
});
