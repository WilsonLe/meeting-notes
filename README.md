# Meeting Notes

Pure browser meeting-notes SPA for local recordings, chunked transcription, summaries, and portable backups.

## Current Scope

This branch keeps the app local-only while adding the first usable meeting-note loop:

- Vite + React + TypeScript + Tailwind CSS v4 + shadcn/Radix scaffold.
- Browser-local IndexedDB repository for local workspaces, selected workspace metadata, draft notes, and raw recording blobs.
- Minimal path routing for `/` and `/<meeting-id>/edit` without adding a router dependency.
- Meeting list UI with search/filter controls, local workspace switching, and draft creation.
- Minimal capture page using `getDisplayMedia({ video: true, audio: true })` plus `MediaRecorder` for browser-tab WebM capture.
- Domain types and mock fixtures for Meeting Note, Raw Recording, Transcript, Summary, and Processing Runs.

Not included yet: OpenAI-compatible API calls, real import/export, or background processing.

## Privacy Model

Meeting Notes is local-only. There is no backend in this app boundary. Browser-controlled local persistence stores workspaces, notes, and recordings behind repository functions in `src/lib/local-workspace-repository.ts`. Persisted records carry schema/database metadata with a migrations store as the forward-only migration boundary before saved shapes change. Portability uses explicit export/import backups instead of raw SQLite files. Backup defaults include provider credentials and raw recordings, with checkboxes to exclude either.

## AI Provider Model

Users configure an OpenAI-compatible base URL and API key. The UI uses the exact action label `Verify Provider`; later implementation should call the provider models endpoint and require valid models before processing.

Recording is allowed without a verified provider. Saved notes land in `recorded` state; provider processing remains later scope.

## Recording Requirements

Recording currently captures browser-tab media only:

- Browser tab video.
- Tab audio.

If tab video, tab audio, `getDisplayMedia`, or `MediaRecorder` is missing, the app fails clearly before saving. Desktop Chrome/Edge are the first supported browsers.

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
