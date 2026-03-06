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

- Record audio and transcribe to text
- Powered by Whisper API

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
BASIC_AUTH_PASS=your-password-here
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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

## Roadmap

- [ ] SSE streaming for real-time translation progress on long texts
- [ ] Source language auto-detection with manual override
- [ ] Source = target language conflict warning
- [ ] Backend database + user auth for cross-device vocabulary sync
- [ ] Runtime schema validation (Zod) for LLM responses
- [ ] Bounded request timeouts with proper error mapping
- [ ] Dark mode

## License

[MIT](LICENSE)
