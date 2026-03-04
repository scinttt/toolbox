import type { InputType } from "@/types";

// Single English word: letters, hyphens, common contractions
// Matches: hello, don't, self-driving, teacher's, I'm, won't, etc.
const ENGLISH_WORD_RE = /^[a-zA-Z]+(-[a-zA-Z]+)*('[a-zA-Z]{1,2})?$/;

// Single Chinese word: 1-4 Chinese characters, no punctuation, no spaces
// Matches: 你好, 苹果, 翻译, 人工智能, etc.
const CHINESE_WORD_RE = /^[\u4e00-\u9fff]{1,4}$/;

export function detectInputType(input: string): InputType {
  const trimmed = input.trim();

  if (trimmed.length === 0) return "text";

  if (ENGLISH_WORD_RE.test(trimmed)) {
    return "word";
  }

  if (CHINESE_WORD_RE.test(trimmed)) {
    return "word";
  }

  return "text";
}

export function isChinese(word: string): boolean {
  return CHINESE_WORD_RE.test(word.trim());
}
