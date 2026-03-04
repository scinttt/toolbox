# Architecture Decision Records

## DEC-001: Jest environment split for API route tests

- **Date**: 2026-03-03
- **Context**: API route handlers import `next/server` which requires Web API globals (`Request`, `Response`, `Headers`). The default `jsdom` test environment doesn't provide these.
- **Decision**: Use `@jest-environment node` pragma in API route test files instead of polyfilling Web APIs in jsdom.
- **Rationale**: Node 18+ has native Web API support. This is cleaner than installing polyfills and keeps lib tests in jsdom (needed for `localStorage` mocking).

## DEC-002: Single `fetch` call per definition-translation batch

- **Date**: 2026-03-03
- **Context**: When target is Chinese for English word lookups, we need to translate all definitions. Could send one API call per definition or batch them.
- **Decision**: Batch all definitions into a single numbered list and send one DeepSeek API call.
- **Rationale**: Minimizes API calls and latency. The numbered format ensures correct mapping back to definitions.

## DEC-003: Vocabulary deduplication by case-insensitive word match

- **Date**: 2026-03-03
- **Context**: Users might save "Hello" and "hello" — should they be separate entries?
- **Decision**: Case-insensitive deduplication. First saved form is preserved.
- **Rationale**: For a personal vocabulary book, "Hello" and "hello" are the same word. Prevents confusion from duplicate entries.
