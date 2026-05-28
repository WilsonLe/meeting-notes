# Meeting Notes Context

## Product Boundary

Meeting Notes is a pure browser single-page app for one user. It has no backend, no hosted sync, and no server-side job runner. Browser-controlled local persistence owns all user data. Portability comes from explicit export/import backups, not raw SQLite files.

## Storage Contract

Later persistence work must keep user data in browser-controlled storage behind a repository boundary. Meeting Note owns Raw Recording, Transcript, Summary, and Processing Runs; provider settings and backup options live in app settings. Persisted data and backup payloads must include schema/version metadata, with forward-only migrations or checkpoints before saved shapes change.

## Domain Language

- Meeting Note: canonical aggregate shown in the UI. It owns Raw Recording, Transcript, Summary, and Processing Runs.
- Raw Recording: browser-captured tab video, tab audio, and microphone voice saved before any AI processing.
- Transcript: chunked transcription output, stored as ordered chunks.
- Summary: generated overview, decisions, action items, and risks.
- Processing Run: resumable attempt to transcribe and summarize a Meeting Note.
- Provider: user-configured OpenAI-compatible base URL plus API key.
- Backup: portable export/import payload. Defaults include credentials and raw recordings, with checkboxes to exclude either.

## Meeting Note States

- draft: note metadata exists before completed recording.
- recorded: raw recording saved, provider may be missing or processing not started.
- processing: transcript or summary work is running or resumable.
- ready: transcript and summary are available.
- failed: recording preflight or processing failed clearly.
- archived: hidden from active work but available in Archived filter and backups.

## UX Decisions

- Primary screens: Dashboard, Record, Meeting Detail, Settings, and Import/Export dialog.
- Dashboard filters: All, Ready, Processing, Failed, Archived. Search applies after the visible filter.
- Recording is allowed without provider settings. Saved notes land in recorded state with a CTA to configure and Verify Provider.
- Record preflight requires browser tab video, tab audio, and microphone voice. Missing tab audio or microphone fails before the timer starts.
- Desktop Chrome/Edge are first supported browsers; unsupported browsers must fail clearly.
- Settings uses `Verify Provider` wording. Verification calls the provider models endpoint and expects valid models.

## Processing Contract

- Transcription uses 5-minute chunks with 10-second overlap.
- Default concurrency is 2 and user-configurable from 1 to 4.
- Failed chunks retry twice with backoff before the run fails.
- Incomplete processing resumes on next launch.

## First PR Scope

This PR initializes the app scaffold, domain docs/types, mock data, and static prototype shell only. It does not implement MediaRecorder capture, OpenAI requests, meeting-data persistence, import/export execution, or background processing. Theme preference localStorage is the UI-only scaffold exception.
