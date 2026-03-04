import { lookupWord, transformFreeDictResponse } from "@/lib/dictionary";
import type { FreeDictEntry } from "@/types";

// Mock deepseek module
jest.mock("@/lib/deepseek", () => ({
  lookupChineseWord: jest.fn(),
  lookupEnglishWordFallback: jest.fn(),
  translateDefinitions: jest.fn(),
}));

import {
  lookupChineseWord,
  lookupEnglishWordFallback,
  translateDefinitions,
} from "@/lib/deepseek";

const mockLookupChineseWord = lookupChineseWord as jest.MockedFunction<typeof lookupChineseWord>;
const mockLookupEnglishWordFallback = lookupEnglishWordFallback as jest.MockedFunction<typeof lookupEnglishWordFallback>;
const mockTranslateDefinitions = translateDefinitions as jest.MockedFunction<typeof translateDefinitions>;

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
});

const sampleFreeDictResponse: FreeDictEntry[] = [
  {
    word: "hello",
    phonetic: "/həˈloʊ/",
    phonetics: [
      { text: "/həˈləʊ/", audio: "https://audio.uk.mp3" },
      { text: "/heˈloʊ/", audio: "https://audio.us.mp3" },
    ],
    meanings: [
      {
        partOfSpeech: "exclamation",
        definitions: [
          {
            definition: "used as a greeting",
            synonyms: ["greeting"],
            antonyms: ["goodbye"],
            example: "hello there!",
          },
        ],
        synonyms: [],
        antonyms: [],
      },
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "an utterance of 'hello'",
            synonyms: [],
            antonyms: [],
          },
        ],
        synonyms: [],
        antonyms: [],
      },
    ],
  },
];

describe("lookupWord", () => {
  test("routes Chinese word to DeepSeek", async () => {
    const mockResult = {
      word: "苹果",
      phonetics: [{ text: "píng guǒ", audio: null }],
      meanings: [
        { partOfSpeech: "noun", definitions: [{ definition: "apple" }] },
      ],
      source: "llm" as const,
    };
    mockLookupChineseWord.mockResolvedValue(mockResult);

    const result = await lookupWord("苹果", "en");
    expect(mockLookupChineseWord).toHaveBeenCalledWith("苹果", "en");
    expect(result.source).toBe("llm");
  });

  test("routes English word to Free Dictionary API (target en)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleFreeDictResponse,
    });

    const result = await lookupWord("hello", "en");
    expect(result.source).toBe("dictionary_api");
    expect(result.word).toBe("hello");
    expect(result.phonetics.length).toBe(2);
    expect(mockTranslateDefinitions).not.toHaveBeenCalled();
  });

  test("routes English word to Free Dictionary API + Chinese translations (target zh)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleFreeDictResponse,
    });
    mockTranslateDefinitions.mockResolvedValueOnce(["用作问候", "问候语"]);

    const result = await lookupWord("hello", "zh");
    expect(result.source).toBe("dictionary_api");
    expect(mockTranslateDefinitions).toHaveBeenCalled();
    expect(result.meanings[0].definitions[0].definitionSecondary).toBe("用作问候");
    expect(result.meanings[1].definitions[0].definitionSecondary).toBe("问候语");
  });

  test("falls back to LLM when Free Dict returns 404", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

    const fallbackResult = {
      word: "asdf",
      phonetics: [],
      meanings: [
        { partOfSpeech: "noun", definitions: [{ definition: "no definition" }] },
      ],
      source: "llm_fallback" as const,
    };
    mockLookupEnglishWordFallback.mockResolvedValueOnce(fallbackResult);

    const result = await lookupWord("asdf", "en");
    expect(result.source).toBe("llm_fallback");
    expect(mockLookupEnglishWordFallback).toHaveBeenCalledWith("asdf", "en");
  });

  test("falls back to LLM on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const fallbackResult = {
      word: "hello",
      phonetics: [],
      meanings: [],
      source: "llm_fallback" as const,
    };
    mockLookupEnglishWordFallback.mockResolvedValueOnce(fallbackResult);

    const result = await lookupWord("hello", "en");
    expect(result.source).toBe("llm_fallback");
  });

  test("falls back when Free Dict returns empty array", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const fallbackResult = {
      word: "hello",
      phonetics: [],
      meanings: [],
      source: "llm_fallback" as const,
    };
    mockLookupEnglishWordFallback.mockResolvedValueOnce(fallbackResult);

    const result = await lookupWord("hello", "en");
    expect(result.source).toBe("llm_fallback");
  });
});

describe("transformFreeDictResponse", () => {
  test("extracts phonetics correctly", () => {
    const result = transformFreeDictResponse(sampleFreeDictResponse, "hello");
    expect(result.phonetics).toEqual([
      { text: "/həˈləʊ/", audio: "https://audio.uk.mp3" },
      { text: "/heˈloʊ/", audio: "https://audio.us.mp3" },
    ]);
  });

  test("uses top-level phonetic when phonetics array is empty", () => {
    const entry: FreeDictEntry[] = [
      {
        word: "test",
        phonetic: "/tɛst/",
        phonetics: [],
        meanings: [],
      },
    ];
    const result = transformFreeDictResponse(entry, "test");
    expect(result.phonetics).toEqual([{ text: "/tɛst/", audio: null }]);
  });

  test("merges meanings across entries", () => {
    const entries: FreeDictEntry[] = [
      {
        word: "run",
        phonetics: [],
        meanings: [
          {
            partOfSpeech: "verb",
            definitions: [{ definition: "move fast", synonyms: [], antonyms: [] }],
            synonyms: [],
            antonyms: [],
          },
        ],
      },
      {
        word: "run",
        phonetics: [],
        meanings: [
          {
            partOfSpeech: "verb",
            definitions: [{ definition: "operate", synonyms: [], antonyms: [] }],
            synonyms: [],
            antonyms: [],
          },
          {
            partOfSpeech: "noun",
            definitions: [{ definition: "a period of running", synonyms: [], antonyms: [] }],
            synonyms: [],
            antonyms: [],
          },
        ],
      },
    ];

    const result = transformFreeDictResponse(entries, "run");
    expect(result.meanings.length).toBe(2); // verb + noun
    const verbMeaning = result.meanings.find((m) => m.partOfSpeech === "verb");
    expect(verbMeaning?.definitions.length).toBe(2); // merged
  });

  test("sets source to dictionary_api", () => {
    const result = transformFreeDictResponse(sampleFreeDictResponse, "hello");
    expect(result.source).toBe("dictionary_api");
  });
});
