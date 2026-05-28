# Meeting Notes

Pure browser meeting-notes SPA for local recordings, chunked transcription, summaries, and portable backups.

## First PR Scope

This branch initializes the product shell only:

- Vite + React + TypeScript + Tailwind CSS v4 + shadcn/Radix scaffold.
- Static responsive SPA prototype for Dashboard, Record, Meeting Detail, Settings, and Import/Export.
- Domain types and mock fixtures for Meeting Note, Raw Recording, Transcript, Summary, and Processing Runs.
- Architecture context and ADRs for local-only app shape and chunked transcription rules.

Not included yet: MediaRecorder capture, OpenAI-compatible API calls, meeting-data persistence, real import/export, or background processing. Theme preference persistence is the only localStorage exception in this scaffold.

## Privacy Model

Meeting Notes is local-only. There is no backend in this app boundary. Browser-controlled local persistence will store notes and recordings in later PRs behind a repository boundary. Persisted data and backups should carry version metadata with forward-only migrations before saved shapes change. Portability uses explicit export/import backups instead of raw SQLite files. Backup defaults include provider credentials and raw recordings, with checkboxes to exclude either.

## AI Provider Model

Users configure an OpenAI-compatible base URL and API key. The UI uses the exact action label `Verify Provider`; later implementation should call the provider models endpoint and require valid models before processing.

Recording is allowed without a verified provider. Saved notes land in `recorded` state and show a CTA to configure and verify provider settings.

## Recording Requirements

Recording requires all three sources before the timer starts:

- Browser tab video.
- Tab audio.
- Microphone voice.

If tab audio or microphone voice is missing, the app must fail clearly before starting the timer. Desktop Chrome/Edge are the first supported browsers.

## Processing Rules

Chunked transcription is required:

- 5-minute chunks.
- 10-second overlap.
- Default concurrency 2, configurable from 1 to 4.
- Retry failed chunks twice with backoff.
- Resume incomplete processing on next launch.

## Setup

```bash
pnpm install
pnpm dev
```

## Commands

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm preview
pnpm format
pnpm shadcn info
```

Run `pnpm format` only when intentionally formatting source files. Use `pnpm shadcn info` after scaffold or component setup changes.

## Project Docs

- `CONTEXT.md` - product boundary, domain language, and first-PR scope.
- `docs/adr/0001-pure-browser-local-only-app.md` - local-only app decision.
- `docs/adr/0002-chunked-transcription-processing.md` - chunking/retry/resume decision.
- `docs/architecture/browser-spa-prototype.md` - scaffold architecture and future seams.
