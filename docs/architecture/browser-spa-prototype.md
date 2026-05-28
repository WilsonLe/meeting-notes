# Browser SPA Prototype Architecture

## Layers

- `src/lib/domain`: durable domain types and constants. Keep app rules here before storage or engine code exists.
- `src/fixtures`: mock notes and settings for static screens. Fixtures model realistic states without real user data or secrets.
- `src/components/ui`: shadcn-generated primitives. Prefer semantic tokens and component variants over custom color utilities.
- `src/App.tsx`: first-PR in-memory navigation and screen composition.

## Navigation

The prototype uses React state for screen selection: Dashboard, Record, Meeting Detail, and Settings. Import/Export is a controlled dialog available from shell and dashboard actions. This keeps first PR independent of routing decisions.

## Storage Boundary

No meeting-data storage adapter exists in the first PR. Future meeting persistence should enter through repository functions, keep browser storage APIs out of UI components, write versioned records, and run migrations before processing resume checks. Theme preference localStorage is a UI-only scaffold exception.

## Future Seams

- Replace fixtures with browser persistence repository.
- Replace record screen actions with MediaRecorder capture and preflight checks.
- Replace provider form toast with real models endpoint verification.
- Replace transcript mock progress with chunk scheduler and resumable processing state.
- Replace dialog controls with real backup import/export serializers.
