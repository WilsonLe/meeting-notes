---
description: Durable guidance for Meeting Notes SPA stack, scope, architecture boundaries, and validation.
applyTo: "**/*"
---

# Meeting Notes Instructions

- Preserve the pure-browser local-only boundary: no backend, hosted sync, server job runner, or raw SQLite export path.
- Keep first-PR meeting-data work static and in-memory unless issue scope changes: no MediaRecorder capture, provider API calls, meeting-data persistence, real import/export, or background processing. Theme preference localStorage is the UI-only scaffold exception.
- Use Vite, React, TypeScript, Tailwind CSS v4, and shadcn/Radix primitives. Keep generated primitives in `src/components/ui`, domain rules in `src/lib/domain`, and mock data in `src/fixtures`.
- Future persistence must sit behind repository functions, store versioned records/backups, and add forward-only migrations before saved shapes change.
- Validate with `pnpm lint`, `pnpm typecheck`, and `pnpm build`. For scaffold or UI primitive changes, also run `pnpm shadcn info` and preview/browser smoke when practical.
