---
description: "Troubleshooting guidance for Meeting Notes browser capture, microphone capture, and saved recording access."
applyTo: "src/components/meeting-notes/**,src/lib/local-workspace-repository.ts,e2e/**"
---

# Capture Recording Troubleshooting

- Symptom: clicking `Capture` never produces a usable saved file when browser permission prompts do not appear, screen capture rejects, or saved blobs have no playback/download UI.
- Root cause pattern: `getDisplayMedia` must be called from the click flow, desktop/window surfaces must not be rejected when product expects them, microphone capture must use separate best-effort `getUserMedia`, and IndexedDB blobs need explicit retrieval UI.
- Fix pattern: request display capture first, accept tab/window/desktop video, continue when display audio is absent, request microphone separately without failing capture on denial, save `capturedSources`, and expose saved blob playback/download through the repository boundary.
- Verification: use Playwright with mocked `getDisplayMedia`, `getUserMedia`, and real `MediaRecorder` to create a note, start capture, stop capture, verify `Capture saved locally.`, and confirm saved recording playback/download appears.
