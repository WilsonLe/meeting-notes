# Browser SPA Prototype Architecture

## Layers

- `src/lib/domain`: durable domain types and constants shared by UI and persistence.
- `src/lib/local-workspace-repository.ts`: IndexedDB repository boundary for local workspaces, selected workspace metadata, draft notes, and raw recording blobs.
- `src/fixtures`: mock notes and settings for static examples/tests. Fixtures model realistic states without real user data or secrets.
- `src/components/ui`: shadcn-generated primitives. Prefer semantic tokens and component variants over custom color utilities.
- `src/App.tsx`: lightweight path routing, shell composition, workspace switching, and repository orchestration.

## Navigation

The app uses minimal browser history handling instead of a router dependency. `/` renders the Meeting Notes list, and `/<meeting-id>/edit` renders the minimal capture page for a persisted draft note.

## Storage Boundary

Meeting persistence enters through repository functions and keeps browser storage APIs out of screen components. IndexedDB stores workspaces, notes, recordings, schema/database metadata, and migration records; future saved-shape changes must add forward-only migrations before data is read as the latest shape.

## Future Seams

- Expand the repository with backup import/export serializers.
- Add provider settings persistence and real models endpoint verification.
- Add transcript chunk scheduler and resumable processing state.
- Add forward-only migrations before changing saved workspace, note, or recording shapes.
