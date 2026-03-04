import type { TargetLang } from "@/types";
import { splitIntoChunks } from "@/lib/chunking";
import { ConfigError, UpstreamError, ParseError } from "@/lib/errors";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

const DEEPL_API_URL = "https://api-free.deepl.com/v2/translate";

// DeepL request body limit is 128 KiB. Use ~100KB to stay safe with JSON overhead.
const MAX_REQUEST_BYTES = 100_000;
const MAX_TEXTS_PER_REQUEST = 50;

interface DeepLTranslation {
  detected_source_language: string;
  text: string;
}

interface DeepLResponse {
  translations: DeepLTranslation[];
}

function getDeepLTargetLang(targetLang: TargetLang): string {
  return targetLang === "zh" ? "ZH-HANS" : "EN";
}

async function callDeepL(
  texts: string[],
  targetLang: TargetLang
): Promise<string[]> {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    throw new ConfigError("DEEPL_API_KEY");
  }

  const res = await fetchWithTimeout(
    DEEPL_API_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `DeepL-Auth-Key ${apiKey}`,
      },
      body: JSON.stringify({
        text: texts,
        target_lang: getDeepLTargetLang(targetLang),
      }),
    },
    10_000,
    "DeepL"
  );

  if (!res.ok) {
    throw new UpstreamError("DeepL", res.status, res.statusText);
  }

  const data = (await res.json()) as DeepLResponse;
  if (!data.translations || data.translations.length === 0) {
    throw new ParseError("DeepL returned empty response");
  }

  return data.translations.map((t) => t.text);
}

// Split texts into batches respecting DeepL limits (50 texts, ~100KB per request)
function batchTexts(texts: string[]): string[][] {
  const batches: string[][] = [];
  let currentBatch: string[] = [];
  let currentSize = 0;

  for (const text of texts) {
    const textSize = Buffer.byteLength(text, "utf-8");

    if (
      currentBatch.length >= MAX_TEXTS_PER_REQUEST ||
      (currentBatch.length > 0 && currentSize + textSize > MAX_REQUEST_BYTES)
    ) {
      batches.push(currentBatch);
      currentBatch = [];
      currentSize = 0;
    }

    currentBatch.push(text);
    currentSize += textSize;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

export async function translateWithDeepL(
  text: string,
  targetLang: TargetLang
): Promise<string> {
  // For short text, single API call
  const textBytes = Buffer.byteLength(text, "utf-8");
  if (textBytes <= MAX_REQUEST_BYTES) {
    const results = await callDeepL([text], targetLang);
    return results[0];
  }

  // For long text, split into chunks and batch
  // Use ~2500 chars per chunk to stay well within byte limits with multibyte chars
  const chunks = splitIntoChunks(text, 2500);
  const batches = batchTexts(chunks);

  const allResults: string[] = [];
  for (const batch of batches) {
    const results = await callDeepL(batch, targetLang);
    allResults.push(...results);
  }

  return allResults.join("\n\n");
}

// Exported for testing
export { callDeepL, batchTexts, getDeepLTargetLang, DEEPL_API_URL };
