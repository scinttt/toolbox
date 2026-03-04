# Lessons Learned

## LES-001: Jest 30 renamed `setupFilesAfterSetup` → `setupFilesAfterEnv`
- **Problem**: Jest config used `setupFilesAfterSetup` key, which is silently ignored with a warning
- **Cause**: Jest 30 changed the config key name
- **Fix**: Use `setupFilesAfterEnv` instead. The warning message from Jest pointed to the correct key.

## LES-002: Jest 30 renamed `--testPathPattern` → `--testPathPatterns`
- **Problem**: `npm test -- --testPathPattern="detect"` failed with validation error
- **Cause**: Jest 30 renamed the CLI flag
- **Fix**: Use `npx jest --testPathPatterns="detect"` or `npx jest detect` (shorthand works)

## LES-003: `next/server` imports fail in jsdom test environment
- **Problem**: API route test files failed with `ReferenceError: Request is not defined`
- **Cause**: `next/server` expects Web API globals (`Request`, `Response`) which jsdom doesn't provide
- **Fix**: Add `/** @jest-environment node */` pragma to API route test files. Node 18+ has native Web APIs.

## LES-004: create-next-app refuses to initialize in non-empty directory
- **Problem**: `npx create-next-app . --typescript ...` failed because directory contained existing files (CLAUDE.md, etc.)
- **Cause**: create-next-app checks for conflicting files and refuses to overwrite
- **Fix**: Initialize in a temp directory, then copy generated files to the project root.
