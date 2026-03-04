# TBD - Future Improvements

## 1. Source Language: Auto-detect + Manual Override

Currently users must manually select source language every time. A better approach:
auto-detect (zh/en/mixed) and display the result, allow one-click override.
Covers 95% of cases automatically, 5% edge cases fixable by user.

## 2. Source = Target Language Conflict

No validation when source and target language are the same (e.g., en → en).
Should warn or auto-swap.

## 3. DeepL Availability in China

DeepL may be inaccessible from mainland China. Options:
- Runtime reachability check with automatic fallback to DeepSeek
- Replace with a China-accessible translation API (e.g., Baidu, Tencent)

## 4. Long Text Progress Feedback

50K char translation can take 30s+ with only a spinner shown.
Use SSE streaming to return results chunk-by-chunk for real-time progress.

## 5. API Rate Limiting & Auth

Public endpoints `/api/translate` and `/api/dictionary` have no auth or rate limiting.
Anyone can call them directly and drain upstream paid quotas (DeepSeek/DeepL).
Add per-IP rate limiting and optional API key auth.

## 6. LLM Response Schema Validation

`JSON.parse(...) as Type` trusts LLM output blindly. Malformed JSON will crash the UI.
Add runtime schema validation (e.g., Zod) before returning dictionary data.

## 7. Upstream Request Timeouts

All `fetch()` calls lack `AbortSignal`. Requests can hang until platform timeout.
Add bounded timeouts (e.g., 10s per request) and map timeout errors to 502/504.

## 8. Structured Error Types

Error classification uses brittle `message.includes("API error")` string matching.
Missing API keys surface as generic 500. Use custom error classes with error codes instead.

## 9. Audio URL Validation

`DictionaryCard` loads arbitrary audio URLs via `new Audio(url)`.
Should allowlist `https:` protocol and trusted hosts, or proxy through server.

## 10. Extract Chunking to Shared Utility

`src/lib/deepl.ts` imports `splitIntoChunks` from `src/lib/deepseek.ts`, coupling providers.
Move chunking logic to `src/lib/chunking.ts` and import from both.
