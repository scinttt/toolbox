# Toolbox - Design Document

## 1. Overview

A personal productivity web app built with Next.js, featuring two tools accessible via tab navigation:

- **Translator** - Chinese-English bidirectional translation with smart dictionary lookup
- **Voice** - Audio recording with speech-to-text transcription and AI-powered text cleanup

Both tools share a common authentication layer and UI framework.

## 2. Architecture

```
Browser
  └── HomeTabs (tab navigation, lazy-loaded)
        ├── TranslatorPage
        │     ├── InputPanel ──── detectInputType() ──┐
        │     ├── TranslateButton                     │
        │     └── OutputPanel                    ┌────┴────┐
        │           ├── translated text          word     text
        │           └── DictionaryCard            │         │
        │                                    POST /api/  POST /api/
        │                                    dictionary  translate
        │                                         │         │
        │                                    Free Dict   DeepL /
        │                                    + DeepSeek  DeepSeek
        │
        └── VoicePage
              ├── AudioRecorder ──── MediaRecorder API
              ├── StatusIndicator ── Web Audio API (waveform)
              └── output textarea
                    │
              ┌─────┴──────┐
         POST /api/     POST /api/
         transcribe     cleanup
              │              │
         OpenAI Whisper   DeepSeek
```

### Authentication

Cookie-based password auth protects the entire app:

1. User enters password on `/login`
2. `POST /api/auth` validates against `BASIC_AUTH_PASS` env var
3. Server sets an HMAC-SHA256 session token as an httpOnly secure cookie (30-day TTL)
4. Subsequent requests are validated via `validateSessionToken()` in `src/lib/auth.ts`

## 3. Translator

### 3.1 Core Features

**Full-Text Translation** (phrase / paragraph input):
- Powered by DeepL API (pure Chinese/English) and DeepSeek Chat API (mixed-language)
- User selects source and target language
- Long text is chunked and translated in parallel

**Dictionary Lookup** (single word input):
- Auto-detected via regex (see 3.2)
- English words: Free Dictionary API for phonetics/audio/definitions, with DeepSeek supplement for Chinese translations
- Chinese words (1-4 chars): DeepSeek generates pinyin, definitions, examples
- LLM fallback: if Free Dictionary API fails, DeepSeek generates full dictionary data

**Vocabulary Book**:
- Save/remove words from dictionary lookups
- Case-insensitive deduplication
- Stored in localStorage with schema version for future migration

### 3.2 Input Detection

```
Input -> trim
  ├── Empty / whitespace-only -> disable translate button
  ├── Single English word -> Dictionary mode
  │   Regex: /^[a-zA-Z]+(-[a-zA-Z]+)*('[a-zA-Z]{1,2})?$/
  ├── Single Chinese word -> Dictionary mode
  │   Regex: /^[\u4e00-\u9fff]{1,4}$/
  └── Everything else -> Translation mode
```

Conservative detection: when in doubt, defaults to translation mode.

### 3.3 Translator UI Layout

```
┌─────────────────────────────────────────────────────┐
│  [Toolbox]                    [Translator] [Voice]  │
├──────────────────────┬──┬───────────────────────────┤
│  [Source Lang: ▼ EN] │  │  [Target Lang: ▼ 中文]    │
│                      │  │                           │
│  Input Textarea      │🔄│  Output Area              │
│                      │  │  - Plain text (translate)  │
│                      │  │  - Dictionary card (word)  │
│                      │  │                           │
├──────────────────────┴──┴───────────────────────────┤
│  [Vocabulary Book]                                  │
└─────────────────────────────────────────────────────┘
```

### 3.4 Dictionary Card

English word (target: Chinese):

```
┌──────────────────────────────────────────┐
│  hello                          [★ Save] │
│  /həˈləʊ/ 🔊   /heˈloʊ/ 🔊              │
├──────────────────────────────────────────┤
│  exclamation                             │
│  1. used as a greeting or to begin       │
│     a phone conversation.                │
│     → 用作问候或开始电话交谈               │
│     e.g. "hello there, Katie!"           │
│     synonyms: greeting, welcome          │
│                                          │
│  noun                                    │
│  1. an utterance of 'hello'; a greeting. │
│     → "hello"的说出；问候                 │
└──────────────────────────────────────────┘
```

## 4. Voice Transcription

### 4.1 Core Features

**Audio Recording**:
- Browser MediaRecorder API captures audio as WebM/Opus
- Web Audio API AnalyserNode drives a real-time waveform visualization
- Elapsed time display during recording

**Transcription Pipeline** (two-stage):
1. **ASR**: Audio blob sent to `POST /api/transcribe` -> OpenAI `gpt-4o-mini-transcribe`
2. **Cleanup**: Raw transcript sent to `POST /api/cleanup` -> DeepSeek `deepseek-chat`

**Output Modes** (selected before recording):

| Mode | Behavior |
|------|----------|
| `prompt` | Compresses to single paragraph, removes filler words, optimized for LLM input |
| `article` | Preserves paragraph structure, natural breaks, mixed language |

**State Machine**:

```
idle -> recording -> transcribing -> formatting -> done
  ^         |              |              |         |
  |         v              v              v         |
  +------- error <--------+--------------+---------+
```

### 4.2 Voice UI Layout

```
┌─────────────────────────────────────────────────────┐
│  [Toolbox]                    [Translator] [Voice]  │
├─────────────────────────────────────────────────────┤
│  [AI Prompt] [Article]                              │
│  ┌─────────────────────────────────────────────┐    │
│  │  [waveform / spinner / status]              │    │
│  │                                             │    │
│  │  Transcription will appear here...          │    │
│  │  (editable textarea)                        │    │
│  │                                             │    │
│  └─────────────────────────────────────────────┘    │
│              ( ⏺ Record )  [ Copy ]                 │
└─────────────────────────────────────────────────────┘
```

## 5. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| UI | Tailwind CSS + shadcn/ui |
| Translation | DeepL API (pure text) + DeepSeek Chat API (mixed/dictionary) |
| Dictionary | Free Dictionary API (dictionaryapi.dev) + DeepSeek fallback |
| ASR | OpenAI `gpt-4o-mini-transcribe` |
| Text cleanup | DeepSeek Chat API (`deepseek-chat`) |
| Audio capture | Browser MediaRecorder API + Web Audio API |
| Auth | Cookie-based HMAC-SHA256 session token |
| Storage | localStorage (vocabulary book, active tab) |
| Deployment | Vercel |

## 6. Project Structure

```
toolbox/
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Entry point -> HomeTabs
│   │   ├── login/page.tsx            # Password login page
│   │   ├── icon.tsx                  # Generated favicon
│   │   ├── apple-icon.tsx            # Generated Apple touch icon
│   │   └── api/
│   │       ├── auth/route.ts         # POST - password auth, sets session cookie
│   │       ├── translate/route.ts    # POST - text translation (DeepL / DeepSeek)
│   │       ├── dictionary/route.ts   # POST - word lookup (Free Dict + DeepSeek)
│   │       ├── transcribe/route.ts   # POST - audio -> text (OpenAI Whisper)
│   │       └── cleanup/route.ts      # POST - transcript cleanup (DeepSeek)
│   ├── components/
│   │   ├── HomeTabs.tsx              # Tab navigation (Translator / Voice)
│   │   ├── translator/
│   │   │   ├── TranslatorPage.tsx    # Translator root component
│   │   │   ├── InputPanel.tsx        # Left input textarea
│   │   │   ├── OutputPanel.tsx       # Right output area
│   │   │   ├── TranslateButton.tsx   # Center translate button
│   │   │   ├── LanguageSelector.tsx  # Target language dropdown
│   │   │   ├── SourceLanguageSelector.tsx
│   │   │   └── DictionaryCard.tsx    # Word dictionary display
│   │   ├── voice/
│   │   │   ├── VoicePage.tsx         # Voice root component (state machine)
│   │   │   ├── AudioRecorder.tsx     # Record/stop button + copy button
│   │   │   └── StatusIndicator.tsx   # Waveform canvas + processing spinner
│   │   ├── vocabulary/
│   │   │   └── VocabularyBook.tsx    # Saved words list
│   │   └── ui/                       # shadcn/ui components
│   ├── hooks/
│   │   └── useAudioRecorder.ts       # MediaRecorder + Web Audio abstraction
│   ├── services/
│   │   └── transcriptionApiClient.ts # Client-side fetch for transcribe + cleanup
│   ├── lib/
│   │   ├── auth.ts               # HMAC session token generation/validation
│   │   ├── deepseek.ts           # DeepSeek API client
│   │   ├── deepl.ts              # DeepL API client
│   │   ├── dictionary.ts         # Free Dictionary API client
│   │   ├── detect.ts             # Input type detection (word vs text)
│   │   ├── vocabulary.ts         # localStorage CRUD for saved words
│   │   ├── chunking.ts           # Text chunking for long translations
│   │   ├── schemas.ts            # Zod validation schemas
│   │   ├── errors.ts             # Custom error classes (ConfigError, UpstreamError)
│   │   ├── fetch-with-timeout.ts # Bounded fetch with AbortSignal
│   │   ├── rate-limit.ts         # Per-IP rate limiting
│   │   ├── audio-url.ts          # Audio URL validation
│   │   └── utils.ts              # General utilities
│   └── types/
│       └── index.ts              # Shared TypeScript type definitions
├── public/
├── docs/
│   └── design.md                 # This file
├── .env.example
├── next.config.ts
├── tsconfig.json
└── package.json
```

## 7. API Routes

### `POST /api/auth`

Password authentication endpoint.

```typescript
// Request
{ password: string }

// Success Response (200) — sets httpOnly cookie
{ success: true }

// Error Response (401)
{ error: "Incorrect password" }
```

### `POST /api/translate`

Proxies translation requests to DeepL or DeepSeek. Keeps API keys server-side.

```typescript
// Request
{
  text: string;            // Input text (max 5000 chars)
  targetLang: "zh" | "en";
  sourceLang: "zh" | "en" | "auto";
}

// Success Response (200)
{ translation: string }

// Error Response (400 | 500 | 502)
{ error: string; code: "INVALID_INPUT" | "EMPTY_INPUT" | "INPUT_TOO_LONG"
    | "UPSTREAM_ERROR" | "INTERNAL_ERROR" }
```

### `POST /api/dictionary`

Handles both English and Chinese word lookups.

```typescript
// Request
{
  word: string;            // Single word (English or Chinese)
  targetLang: "zh" | "en";
}

// Success Response (200)
{
  word: string;
  phonetics: { text: string | null; audio: string | null }[];
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      definitionSecondary?: string;
      example?: string;
      synonyms?: string[];
      antonyms?: string[];
    }[];
  }[];
  source: "dictionary_api" | "llm_fallback" | "llm";
}

// Error Response (400 | 502 | 500)
{ error: string; code: "INVALID_WORD" | "UPSTREAM_ERROR" | "INTERNAL_ERROR" }
```

### `POST /api/transcribe`

Sends audio to OpenAI Whisper for speech-to-text.

```typescript
// Request: multipart/form-data with "audio" field (Blob, max 4MB)

// Success Response (200)
{ rawTranscript: string }

// Error Response (400 | 422 | 502)
{ error: string; code: "EMPTY_INPUT" | "INPUT_TOO_LONG" | "NO_SPEECH" | "UPSTREAM_ERROR" }
```

Supported audio formats: WebM, OGG, MP4, MP3, WAV, FLAC.

### `POST /api/cleanup`

Cleans up raw transcripts using DeepSeek with mode-specific prompts.

```typescript
// Request
{
  rawTranscript: string;
  mode: "article" | "prompt";
}

// Success Response (200)
{ cleanedText: string }

// Error Response (400 | 502)
{ error: string; code: "EMPTY_INPUT" | "UPSTREAM_ERROR" }
```

## 8. Key Design Decisions

### Why DeepSeek + DeepL for Translation?

- DeepL excels at pure Chinese-English translation but cannot handle mixed-language input
- DeepSeek handles mixed input reliably and powers dictionary features
- Dual-provider strategy: DeepL for quality, DeepSeek for flexibility

### Why Free Dictionary API + DeepSeek for Dictionary?

- Free Dictionary API is free, provides high-quality phonetics and pronunciation audio
- DeepSeek supplements Chinese translations and serves as LLM fallback
- Every word gets a result even if the dictionary API fails

### Why Two-Stage Voice Pipeline (Transcribe + Cleanup)?

- Separating ASR and text cleanup keeps each API call under Vercel's function timeout
- Different models for different tasks: Whisper for speech recognition, DeepSeek for text intelligence
- Mode-specific cleanup (article vs. prompt) without re-transcribing

### Why Cookie-Based Auth (not JWT / OAuth)?

- Single-user personal tool: shared password is sufficient
- HMAC-SHA256 token avoids storing the raw password in cookies
- httpOnly + secure + sameSite=strict flags for defense-in-depth

### Why localStorage for Vocabulary & Tab State?

- MVP simplicity: no backend database needed
- Sufficient for single-device personal use
- Schema version field allows future migration to server-side storage

## 9. Environment Variables

```
DEEPSEEK_API_KEY=sk-xxx       # DeepSeek API (translation, dictionary, cleanup)
DEEPL_API_KEY=xxx             # DeepL API (pure text translation)
OPENAI_API_KEY=sk-xxx         # OpenAI API (Whisper transcription)
BASIC_AUTH_PASS=xxx           # Password for app login
```

## 10. Error Handling

| Scenario | Behavior |
|----------|----------|
| Empty / whitespace input | Translate button disabled / 400 returned |
| Input exceeds limits | Client-side validation + server 400 |
| DeepSeek API error | Show error message, suggest retry |
| DeepL API error | Fall back to DeepSeek for translation |
| Free Dict API 404 | Fall back to DeepSeek LLM-generated dictionary |
| OpenAI Whisper error | Show error message with retry option |
| No speech detected | 422 with "No speech detected" message |
| Audio too short/empty | Client-side validation before upload |
| Recording too large (>4MB) | Server rejects with 400 |
| Microphone access denied | Specific error message with settings guidance |
| localStorage unavailable | Vocabulary save button disabled gracefully |
