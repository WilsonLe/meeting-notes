# ADR 0002: Chunked Transcription Processing

## Status

Accepted

## Context

Browser recordings can be long and raw files can be large. Provider calls may fail, throttle, or be interrupted by tab close. Processing must be resumable without a backend worker.

## Decision

Transcription is chunked into 5-minute audio windows with 10-second overlap. Default concurrency is 2 and can be configured from 1 to 4. Failed chunks retry twice with backoff. Incomplete processing resumes on the next app launch.

Meeting Note remains the canonical aggregate. It contains Raw Recording, Transcript chunks, Summary, and Processing Runs. Processing Runs record model, status, chunk counts, retries, and failure summary.

## Consequences

- Transcript text can be merged in deterministic chunk order.
- Overlap reduces boundary word loss but later implementation must de-duplicate repeated words.
- Retry/backoff and resume require persisted per-chunk state.
- UI can show useful progress before full summary is ready.
