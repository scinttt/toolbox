// App-wide constants
export const MAX_INPUT_LENGTH = 50000;

// Target language options
export type TargetLang = "zh" | "en";

// Source language options (user-selected)
export type SourceLang = "zh" | "en" | "mixed";

// Input detection result
export type InputType = "word" | "text";

// --- Translation API ---

export interface TranslateRequest {
  text: string;
  targetLang: TargetLang;
  sourceLang: SourceLang;
}

export interface TranslateResponse {
  translation: string;
}

export type TranslateErrorCode =
  | "INVALID_INPUT"
  | "EMPTY_INPUT"
  | "INPUT_TOO_LONG"
  | "UPSTREAM_ERROR"
  | "INTERNAL_ERROR"
  | "RATE_LIMITED";

export interface TranslateErrorResponse {
  error: string;
  code: TranslateErrorCode;
}

// --- Dictionary API ---

export interface DictionaryRequest {
  word: string;
  targetLang: TargetLang;
}

export interface Phonetic {
  text: string | null;
  audio: string | null;
}

export interface Definition {
  definition: string;
  definitionSecondary?: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

export interface Meaning {
  partOfSpeech: string;
  definitions: Definition[];
}

export interface DictionaryResponse {
  word: string;
  phonetics: Phonetic[];
  meanings: Meaning[];
  source: "dictionary_api" | "llm_fallback" | "llm";
}

export type DictionaryErrorCode =
  | "INVALID_WORD"
  | "UPSTREAM_ERROR"
  | "INTERNAL_ERROR"
  | "RATE_LIMITED";

export interface DictionaryErrorResponse {
  error: string;
  code: DictionaryErrorCode;
}

// --- Vocabulary Book ---

export interface VocabularyEntry {
  word: string;
  phonetic?: string;
  briefDefinition: string;
  savedAt: number;
}

export interface VocabularyStore {
  version: 1;
  entries: VocabularyEntry[];
}

// --- Free Dictionary API raw types ---

export interface FreeDictPhonetic {
  text?: string;
  audio?: string;
  sourceUrl?: string;
  license?: { name: string; url: string };
}

export interface FreeDictDefinition {
  definition: string;
  synonyms: string[];
  antonyms: string[];
  example?: string;
}

export interface FreeDictMeaning {
  partOfSpeech: string;
  definitions: FreeDictDefinition[];
  synonyms: string[];
  antonyms: string[];
}

export interface FreeDictEntry {
  word: string;
  phonetic?: string;
  phonetics: FreeDictPhonetic[];
  meanings: FreeDictMeaning[];
  license?: { name: string; url: string };
  sourceUrls?: string[];
}
