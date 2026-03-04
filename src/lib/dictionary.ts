import type {
  DictionaryResponse,
  FreeDictEntry,
  TargetLang,
} from "@/types";
import {
  lookupChineseWord,
  lookupEnglishWordFallback,
  translateDefinitions,
} from "./deepseek";
import { isChinese } from "./detect";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

const FREE_DICT_API = "https://api.dictionaryapi.dev/api/v2/entries/en";

export async function lookupWord(
  word: string,
  targetLang: TargetLang
): Promise<DictionaryResponse> {
  if (isChinese(word)) {
    return lookupChineseWord(word, targetLang);
  }

  return lookupEnglishWord(word, targetLang);
}

async function lookupEnglishWord(
  word: string,
  targetLang: TargetLang
): Promise<DictionaryResponse> {
  try {
    const res = await fetchWithTimeout(
      `${FREE_DICT_API}/${encodeURIComponent(word)}`,
      {},
      5_000,
      "Dictionary"
    );

    if (!res.ok) {
      // 404 or other error → fallback to LLM
      return lookupEnglishWordFallback(word, targetLang);
    }

    const entries = (await res.json()) as FreeDictEntry[];
    if (!entries || entries.length === 0) {
      return lookupEnglishWordFallback(word, targetLang);
    }

    const result = transformFreeDictResponse(entries, word);

    // If target is Chinese, supplement with Chinese translations
    if (targetLang === "zh") {
      await addChineseTranslations(result);
    }

    return result;
  } catch {
    // Network error → fallback to LLM
    return lookupEnglishWordFallback(word, targetLang);
  }
}

function transformFreeDictResponse(
  entries: FreeDictEntry[],
  word: string
): DictionaryResponse {
  const entry = entries[0];

  const phonetics = entry.phonetics
    .filter((p) => p.text || p.audio)
    .map((p) => ({
      text: p.text ?? null,
      audio: p.audio ?? null,
    }));

  // If no phonetics from array, use top-level phonetic
  if (phonetics.length === 0 && entry.phonetic) {
    phonetics.push({ text: entry.phonetic, audio: null });
  }

  // Merge meanings from all entries
  const meaningsMap = new Map<
    string,
    DictionaryResponse["meanings"][number]
  >();

  for (const e of entries) {
    for (const m of e.meanings) {
      const existing = meaningsMap.get(m.partOfSpeech);
      const defs = m.definitions.map((d) => ({
        definition: d.definition,
        example: d.example,
        synonyms: d.synonyms.length > 0 ? d.synonyms : undefined,
        antonyms: d.antonyms.length > 0 ? d.antonyms : undefined,
      }));

      if (existing) {
        existing.definitions.push(...defs);
      } else {
        meaningsMap.set(m.partOfSpeech, {
          partOfSpeech: m.partOfSpeech,
          definitions: defs,
        });
      }
    }
  }

  return {
    word: entry.word || word,
    phonetics,
    meanings: Array.from(meaningsMap.values()),
    source: "dictionary_api",
  };
}

async function addChineseTranslations(
  result: DictionaryResponse
): Promise<void> {
  // Collect all English definitions
  const allDefs: string[] = [];
  for (const meaning of result.meanings) {
    for (const def of meaning.definitions) {
      allDefs.push(def.definition);
    }
  }

  if (allDefs.length === 0) return;

  const translations = await translateDefinitions(allDefs);

  // Map translations back to definitions
  let idx = 0;
  for (const meaning of result.meanings) {
    for (const def of meaning.definitions) {
      def.definitionSecondary = translations[idx] || undefined;
      idx++;
    }
  }
}

// Exported for testing
export { FREE_DICT_API, transformFreeDictResponse, addChineseTranslations };
