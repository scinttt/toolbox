# Toolbox

A personal productivity web app featuring **Chinese-English bidirectional translation** with smart dictionary lookup, and **voice transcription**.

## Features

### Translator

- **Smart detection**: Automatically detects single words vs. phrases/paragraphs
  - Single word input triggers **dictionary mode** with phonetics, pronunciation audio, definitions, and examples
  - Phrase/paragraph input triggers **full translation mode**
- **Bidirectional**: Chinese-to-English, English-to-Chinese, and mixed-input translation
- **Dictionary lookup**: English words via Free Dictionary API with IPA phonetics and audio; Chinese words via LLM-generated pinyin and definitions
- **LLM fallback**: When dictionary API fails, DeepSeek generates structured dictionary data
- **Vocabulary book**: Save words to a personal vocabulary list (localStorage)

### Voice Transcription

- Record audio and transcribe to text via OpenAI Whisper
- AI-powered text cleanup with two output modes:
  - **AI Prompt** - compressed, filler-free, optimized for LLM input
  - **Article** - preserves paragraph structure and natural language flow
- Real-time waveform visualization during recording
- Editable output with one-click copy

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | Tailwind CSS + shadcn/ui |
| Translation | DeepL API (pure text) + DeepSeek Chat API (mixed/dictionary) |
| Dictionary | Free Dictionary API + DeepSeek fallback |
| Transcription | Whisper API |
| Storage | localStorage (MVP) |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
git clone https://github.com/scinttt/toolbox.git
cd toolbox
npm install
```

Create a `.env.local` file based on the example:

```bash
cp .env.example .env.local
```

Fill in your API keys in `.env.local`:

```
DEEPSEEK_API_KEY=sk-xxx
DEEPL_API_KEY=xxx
OPENAI_API_KEY=sk-xxx
BASIC_AUTH_PASS=your-password-here
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

Log in with the password you set in `BASIC_AUTH_PASS`. The app has two tabs: **Translator** and **Voice**.

### Translator

1. Type or paste text in the left panel
2. Select source and target languages
3. Click the translate button (or press Enter)

The app automatically detects your input:
- **Single word** (e.g. "hello", "苹果") → shows a dictionary card with phonetics, audio, definitions, and examples. Click the star icon to save it to your vocabulary book.
- **Phrase or paragraph** → returns a full translation in the right panel.

### Voice

1. Choose an output mode: **AI Prompt** (concise, LLM-ready) or **Article** (natural paragraphs)
2. Click the red record button and speak
3. Click stop — the app transcribes your audio, then cleans up the text automatically
4. Edit the result if needed, then click copy

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main page with tab navigation
│   ├── api/
│   │   ├── translate/        # Translation API (DeepSeek/DeepL proxy)
│   │   ├── dictionary/       # Dictionary API (Free Dict + DeepSeek)
│   │   └── transcribe/       # Voice transcription API
├── components/
│   ├── translator/           # Translator UI components
│   ├── voice/                # Voice recorder and transcription UI
│   ├── vocabulary/           # Vocabulary book
│   └── ui/                   # shadcn/ui components
├── lib/                      # API clients, detection logic, utilities
├── hooks/                    # Custom React hooks
├── services/                 # API client services
└── types/                    # TypeScript type definitions
```

See [docs/design.md](docs/design.md) for detailed architecture and design decisions.

## License

[MIT](LICENSE)
