# ADR 0001: Pure Browser Local-Only App

## Status

Accepted

## Context

The first product boundary is a single-user meeting notes app. Users need private recordings, transcripts, summaries, and backup portability without introducing hosted infrastructure.

## Decision

Build Meeting Notes as a pure browser SPA with no backend. Browser-controlled local persistence will own app data behind a repository boundary. Portability will use explicit export/import backups instead of raw SQLite files. The backup default includes credentials and raw recordings, with checkboxes to exclude either.

Persisted records and backup payloads must carry schema/version metadata. Later storage work adds forward-only migrations before saved shapes change and keeps IndexedDB/localStorage details out of screens.

The AI provider is user-configured through an OpenAI-compatible base URL and API key. Provider verification calls the models endpoint and expects valid models.

## Consequences

- Privacy story stays simple: data remains local unless user chooses a provider or backup destination.
- Future persistence must handle large raw recordings inside browser storage constraints.
- Storage adapters must expose versioned domain records instead of leaking browser storage APIs into UI code.
- No server can resume jobs; processing state must be persisted locally and resume on launch.
- Backups must be clear about whether credentials and raw recordings are included.
