# Translator - Design Document

## 1. Overview

A Next.js web application for Chinese-English bidirectional translation. The app automatically detects whether the input is a single word (English or Chinese) or a longer text (phrase/paragraph), and provides either a dictionary lookup or a full translation accordingly.

**Core principle**: Input language can be Chinese, English, or mixed. The output language is always the user-specified target language.

## 2. Core Features

### 2.1 Full-Text Translation (Phrase / Paragraph)

- Triggered when input is detected as non-single-word (see 2.3)
- Powered by **DeepSeek Chat API** (`deepseek-chat` model)
- Supports Chinese-to-English, English-to-Chinese, and mixed-input translation
- Output is strictly in the user-selected target language

### 2.2 Dictionary Lookup (Single Word)

- Triggered when input is a single word — either English or Chinese (see 2.3)
- Dictionary mode activates **regardless of output language**. Definitions are displayed in the target language.

#### 2.2.1 English Word Lookup

- Primary data source: **Free Dictionary API** (`https://api.dictionaryapi.dev/api/v2/entries/en/{word}`)
  - Phonetic transcriptions (IPA) — multiple variants supported (e.g. US / UK)
  - Pronunciation audio playback — multiple audio URLs supported
  - All parts of speech with definitions and example sentences
  - Synonyms and antonyms
- When target is **Chinese**: definitions supplemented by DeepSeek Chat to provide Chinese translations for each sense
- When target is **English**: English definitions displayed directly from Free Dictionary API
- **Fallback**: If Free Dictionary API returns 404 or fails, fall back to DeepSeek Chat to generate dictionary-style output

#### 2.2.2 Chinese Word Lookup

- No free Chinese dictionary API available — powered entirely by **DeepSeek Chat API**
- DeepSeek generates structured dictionary data: pinyin, English definitions, parts of speech, example sentences
- When target is **English**: English definitions with pinyin
- When target is **Chinese**: Chinese-to-Chinese definitions (释义) with pinyin
- Output layout: same structured dictionary card as English words

### 2.3 Auto-Detection Logic

The app automatically determines the translation mode with robust normalization:

```
Input → trim
  ├─ Empty or whitespace-only → no-op (disable translate button)
  ├─ Single English word → Dictionary mode
  │   Regex: /^[a-zA-Z]+(-[a-zA-Z]+)*('[a-zA-Z]{1,2})?$/
  │   Covers: hello, don't, self-driving, teacher's, I'm, etc.
  ├─ Single Chinese word → Dictionary mode
  │   Rule: 1-4 Chinese characters, no punctuation, no spaces
  │   Regex: /^[\u4e00-\u9fff]{1,4}$/
  │   Covers: 你好, 苹果, 翻译, 人工智能, etc.
  └─ Everything else → Translation mode
      (multiple words, mixed content, longer Chinese text, punctuation)
```

No manual mode switch needed. The detection is conservative — when in doubt, it defaults to translation mode, which handles all inputs correctly.

### 2.4 Word Collection / Vocabulary Book

- Users can save words from dictionary lookups to a personal vocabulary book
- Storage: **localStorage** (MVP phase, backend sync planned for later)
- Schema version field included for future migration
- Features:
  - Save / remove words (deduplicated by word string)
  - View saved words list with phonetics and brief definition
  - Persist across browser sessions (same device)

## 3. UI Design

### 3.1 Layout (Reference: DeepL)

```
┌─────────────────────────────────────────────────────┐
│  Logo / Title                                       │
├────────────────────┬──┬─────────────────────────────┤
│                    │  │  [Output Language: ▼ 中文]   │
│                    │  │                             │
│   Input Textarea   │🔄│   Output Area               │
│                    │  │                             │
│   (auto-detect     │  │   - Plain text (translate)  │
│    input language)  │  │   - Dictionary card (word)  │
│                    │  │                             │
│                    │  │                             │
├────────────────────┴──┴─────────────────────────────┤
│                                                     │
└─────────────────────────────────────────────────────┘
```

- **Left panel**: Input textarea, free-form text entry
- **Center**: Translate button (🔄)
- **Right panel**: Output area
  - Translation mode: rendered translated text
  - Dictionary mode: structured card with phonetics, audio player, definitions, examples
- **Right top**: Output language selector (Chinese / English)
- **Empty/whitespace input**: Translate button disabled

### 3.2 Dictionary Card Layout

#### English word → Chinese output:

```
┌──────────────────────────────────────────┐
│  hello                          [★ Save] │
│  🇬🇧 /həˈləʊ/ 🔊   🇺🇸 /heˈloʊ/ 🔊      │
├──────────────────────────────────────────┤
│  exclamation                             │
│  1. used as a greeting or to begin       │
│     a phone conversation.                │
│     → 用作问候或开始电话交谈                │
│     e.g. "hello there, Katie!"           │
│     synonyms: greeting, welcome          │
│                                          │
│  noun                                    │
│  1. an utterance of 'hello'; a greeting. │
│     → "hello"的说出；问候                  │
│     e.g. "polite nods and hellos"        │
│                                          │
│  verb                                    │
│  1. say or shout 'hello'.               │
│     → 说或喊"hello"                       │
│     e.g. "I pressed the phone            │
│     button and helloed"                  │
└──────────────────────────────────────────┘
```

#### Chinese word → English output:

```
┌──────────────────────────────────────────┐
│  苹果  píng guǒ               [★ Save]  │
├──────────────────────────────────────────┤
│  noun                                    │
│  1. apple — a round fruit with red or    │
│     green skin and white flesh           │
│     e.g. "I ate an apple for lunch"      │
│                                          │
│  2. (computing) Apple Inc. — an American │
│     technology company                   │
│     e.g. "She bought a new Apple laptop" │
└──────────────────────────────────────────┘
```

### 3.3 Tech Stack (UI)

- **Tailwind CSS** + **shadcn/ui** component library
- Responsive design (desktop-first, mobile-friendly)

## 4. Technical Architecture

### 4.1 Tech Stack

| Layer       | Technology                              |
|-------------|-----------------------------------------|
| Framework   | Next.js (App Router)                    |
| UI          | Tailwind CSS + shadcn/ui                |
| Translation | DeepSeek Chat API (`deepseek-chat`)     |
| Dictionary  | Free Dictionary API (dictionaryapi.dev) |
| Dict fallback | DeepSeek Chat API (when Free Dict fails) |
| Chinese defs| DeepSeek Chat API (supplement)          |
| Storage     | localStorage (MVP)                      |
| Deployment  | Vercel                                  |

### 4.2 Project Structure

```
translator/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Main translator page
│   │   └── api/
│   │       ├── translate/
│   │       │   └── route.ts    # Translation API route (DeepSeek proxy)
│   │       └── dictionary/
│   │           └── route.ts    # Dictionary API route (Free Dict + DeepSeek)
│   ├── components/
│   │   ├── translator/
│   │   │   ├── InputPanel.tsx       # Left input textarea
│   │   │   ├── OutputPanel.tsx      # Right output area
│   │   │   ├── TranslateButton.tsx  # Center translate button
│   │   │   ├── LanguageSelector.tsx # Output language dropdown
│   │   │   └── DictionaryCard.tsx   # Word dictionary display
│   │   └── vocabulary/
│   │       └── VocabularyBook.tsx   # Saved words list
│   ├── lib/
│   │   ├── deepseek.ts         # DeepSeek API client
│   │   ├── dictionary.ts       # Free Dictionary API client
│   │   ├── detect.ts           # Input type detection (word vs text)
│   │   └── vocabulary.ts       # localStorage CRUD for saved words
│   └── types/
│       └── index.ts            # TypeScript type definitions
├── public/
├── .env.local                  # DEEPSEEK_API_KEY
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 4.3 API Routes

#### `POST /api/translate`

Proxies translation requests to DeepSeek Chat API. Keeps the API key server-side.

```typescript
// Request
{
  text: string;            // Input text (max 5000 chars)
  targetLang: "zh" | "en"; // Target output language
}

// Success Response (200)
{
  translation: string;     // Translated text
}

// Error Response (400 | 500 | 502)
{
  error: string;           // Error message
  code: "INVALID_INPUT" | "EMPTY_INPUT" | "INPUT_TOO_LONG"
      | "UPSTREAM_ERROR" | "INTERNAL_ERROR";
}
```

**Request validation**:
- `text` must be non-empty after trim, max 5000 characters
- `targetLang` must be `"zh"` or `"en"`

**DeepSeek prompt strategy**: System prompt instructs the model to act as a professional translator, output strictly in the target language regardless of input language mix.

#### `POST /api/dictionary`

Handles both English and Chinese word lookups.

```typescript
// Request
{
  word: string;            // Single word (English or Chinese)
  targetLang: "zh" | "en"; // Target output language
}

// Success Response (200)
{
  word: string;
  phonetics: {                         // IPA for English, pinyin for Chinese
    text: string | null;               // Phonetic transcription
    audio: string | null;              // Pronunciation audio URL (English only)
  }[];
  meanings: {
    partOfSpeech: string;              // e.g. "noun", "verb"
    definitions: {
      definition: string;             // Definition in target language
      definitionSecondary?: string;   // Definition in source language (optional)
      example?: string;               // Example sentence
      synonyms?: string[];            // Synonym list
      antonyms?: string[];            // Antonym list
    }[];
  }[];
  source: "dictionary_api" | "llm_fallback" | "llm";  // Data source
}

// Error Response (400 | 502 | 500)
{
  error: string;
  code: "INVALID_WORD" | "UPSTREAM_ERROR" | "INTERNAL_ERROR";
}
```

**Flow (English word)**:
1. Call Free Dictionary API → get phonetics, audio, English definitions, synonyms/antonyms
2. If Free Dict returns 404 or network error → fall back to DeepSeek Chat to generate full dictionary data, set `source: "llm_fallback"`
3. If target is zh: call DeepSeek Chat API → translate each English definition to Chinese
4. Merge and return combined result

**Flow (Chinese word)**:
1. Call DeepSeek Chat API → generate pinyin, definitions in target language, parts of speech, examples
2. Return structured result with `source: "llm"`

### 4.4 Input Detection Logic

```typescript
function detectInputType(input: string): "word" | "text" {
  const trimmed = input.trim();

  if (trimmed.length === 0) return "text"; // handled as empty upstream

  // Single English word: letters, hyphens, common contractions
  // Matches: hello, don't, self-driving, teacher's, I'm, won't, etc.
  if (/^[a-zA-Z]+(-[a-zA-Z]+)*('[a-zA-Z]{1,2})?$/.test(trimmed)) {
    return "word";
  }

  // Single Chinese word: 1-4 Chinese characters, no punctuation
  // Matches: 你好, 苹果, 翻译, 人工智能, etc.
  if (/^[\u4e00-\u9fff]{1,4}$/.test(trimmed)) {
    return "word";
  }

  return "text";
}
```

**Behavior**: `detectInputType` returns `"word"` → dictionary mode (regardless of target language). Returns `"text"` → translation mode.

### 4.5 Data Flow

```
User types input
       │
       ▼
 Click Translate (or Enter)
       │
       ▼
 Validate input (empty? too long?)
       │
       ▼
 detectInputType(input)
       │
  ┌────┴────┐
  │         │
word       text
  │         │
  ▼         ▼
POST       POST
/api/      /api/
dictionary translate
  │         │
  ▼         ▼
Dictionary  Translated
Card        Text
```

## 5. Key Design Decisions

### 5.1 Why DeepSeek Chat for Translation (not DeepL)?

- DeepL cannot handle mixed Chinese-English input reliably
- DeepL has no dictionary features
- DeepSeek Chat can be prompted to always output in the target language regardless of input language mix
- Cost-effective for personal use

### 5.2 Why Free Dictionary API + DeepSeek (not a Chinese dictionary API)?

- Free Dictionary API is free, no API key needed
- Provides high-quality phonetics and pronunciation audio
- English definitions are authoritative
- DeepSeek supplements Chinese translations, combining the best of both
- LLM fallback ensures every word gets a result even if the dictionary API fails

### 5.3 Why localStorage for Vocabulary Book?

- MVP simplicity: no backend, no auth, no database needed
- Sufficient for single-device personal use
- Schema includes version field for future migration

### 5.4 Dictionary Mode for All Target Languages

- Single word always triggers dictionary mode regardless of target language
- English word + target zh: Free Dict API + DeepSeek Chinese definitions
- English word + target en: Free Dict API English definitions displayed directly
- Chinese word + target en: DeepSeek generates English definitions with pinyin
- Chinese word + target zh: DeepSeek generates Chinese definitions (释义) with pinyin
- Dictionary definitions are always in the target language, consistent with the core principle

## 6. Error Handling Strategy

| Scenario | Behavior |
|----------|----------|
| Empty / whitespace input | Translate button disabled, no request sent |
| Input exceeds 5000 chars | Client-side validation error shown |
| DeepSeek API error (translate) | Show error message: "Translation service unavailable, please try again" |
| Free Dict API 404 (word not found) | Fall back to DeepSeek LLM-generated dictionary |
| Free Dict API network error | Fall back to DeepSeek LLM-generated dictionary |
| DeepSeek API error (dictionary) | Show error message: "Dictionary service unavailable, please try again" |
| Both Free Dict and DeepSeek fail | Show error message with retry button |
| localStorage full / unavailable | Gracefully degrade: vocabulary save button disabled with tooltip |

## 7. Environment Variables

```
DEEPSEEK_API_KEY=sk-xxx   # DeepSeek API key
```

Only one secret needed for MVP.

## 8. Future Enhancements (Out of Scope for MVP)

- Backend database + user auth for cross-device vocabulary sync
- Translation history
- Keyboard shortcut (Ctrl+Enter to translate)
- Text-to-speech for translated output
- Streaming translation output (SSE)
- Dark mode
- Server-side caching for dictionary lookups
- Chinese dictionary API integration (if a reliable free one becomes available)
