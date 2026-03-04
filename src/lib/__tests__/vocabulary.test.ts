import {
  getVocabularyEntries,
  addWord,
  removeWord,
  hasWord,
  isStorageAvailable,
  STORAGE_KEY,
} from "@/lib/vocabulary";
import type { VocabularyEntry } from "@/types";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((_index: number) => null),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
});

const sampleEntry: VocabularyEntry = {
  word: "hello",
  phonetic: "/həˈloʊ/",
  briefDefinition: "used as a greeting",
  savedAt: Date.now(),
};

describe("getVocabularyEntries", () => {
  test("returns empty array when no data", () => {
    expect(getVocabularyEntries()).toEqual([]);
  });

  test("returns entries from storage", () => {
    localStorageMock.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, entries: [sampleEntry] })
    );
    expect(getVocabularyEntries()).toEqual([sampleEntry]);
  });

  test("returns empty on invalid JSON", () => {
    localStorageMock.setItem(STORAGE_KEY, "not json");
    expect(getVocabularyEntries()).toEqual([]);
  });

  test("returns empty on wrong version", () => {
    localStorageMock.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 99, entries: [sampleEntry] })
    );
    expect(getVocabularyEntries()).toEqual([]);
  });
});

describe("addWord", () => {
  test("adds a new word", () => {
    addWord(sampleEntry);
    const entries = getVocabularyEntries();
    expect(entries.length).toBe(1);
    expect(entries[0].word).toBe("hello");
  });

  test("deduplicates by word (case-insensitive)", () => {
    addWord(sampleEntry);
    addWord({ ...sampleEntry, word: "Hello" });
    const entries = getVocabularyEntries();
    expect(entries.length).toBe(1);
  });

  test("adds at the beginning (most recent first)", () => {
    addWord(sampleEntry);
    const second: VocabularyEntry = {
      word: "world",
      briefDefinition: "the earth",
      savedAt: Date.now(),
    };
    addWord(second);
    const entries = getVocabularyEntries();
    expect(entries[0].word).toBe("world");
    expect(entries[1].word).toBe("hello");
  });
});

describe("removeWord", () => {
  test("removes existing word", () => {
    addWord(sampleEntry);
    removeWord("hello");
    expect(getVocabularyEntries()).toEqual([]);
  });

  test("case-insensitive removal", () => {
    addWord(sampleEntry);
    removeWord("Hello");
    expect(getVocabularyEntries()).toEqual([]);
  });

  test("no-op when word doesn't exist", () => {
    addWord(sampleEntry);
    removeWord("world");
    expect(getVocabularyEntries().length).toBe(1);
  });
});

describe("hasWord", () => {
  test("returns true for existing word", () => {
    addWord(sampleEntry);
    expect(hasWord("hello")).toBe(true);
  });

  test("case-insensitive check", () => {
    addWord(sampleEntry);
    expect(hasWord("Hello")).toBe(true);
  });

  test("returns false for non-existing word", () => {
    expect(hasWord("hello")).toBe(false);
  });
});

describe("isStorageAvailable", () => {
  test("returns true when localStorage works", () => {
    expect(isStorageAvailable()).toBe(true);
  });

  test("returns false when localStorage throws", () => {
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error("QuotaExceeded");
    });
    expect(isStorageAvailable()).toBe(false);
  });
});
