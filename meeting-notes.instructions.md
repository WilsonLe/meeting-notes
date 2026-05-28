---
description: Durable guidance for Meeting Notes SPA stack, scope, architecture boundaries, and validation.
applyTo: "**/*"
---

# Meeting Notes Instructions

- Preserve the pure-browser local-only boundary: no backend, hosted sync, server job runner, or raw SQLite export path.
- Current issue scope includes browser-local IndexedDB workspaces, draft Meeting Note persistence, display/microphone MediaRecorder capture, and local saved-recording playback/download. Keep provider API calls, real import/export, hosted sync, and background processing out of scope unless a later issue explicitly adds them.
- Use Vite, React, TypeScript, Tailwind CSS v4, and shadcn/Radix primitives. Keep generated primitives in `src/components/ui`, domain rules in `src/lib/domain`, and mock data in `src/fixtures`.
- When adding generated shadcn sidebar code, remove cookie/local persistence for sidebar state; collapse state must remain in memory.
- Persistence must sit behind repository functions such as `src/lib/local-workspace-repository.ts`, store versioned records/backups, and add forward-only migrations before saved shapes change.
- Validate with `pnpm lint`, `pnpm typecheck`, and `pnpm build`. For scaffold or UI primitive changes, also run `pnpm shadcn info` and preview/browser smoke when practical.
