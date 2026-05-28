import type {
  BackupOptions,
  ProcessingSettings,
  ProviderSettings,
  RecordingRequirement,
} from "@/lib/domain"
import { CHUNKED_TRANSCRIPTION_POLICY } from "@/lib/domain"

export const mockProviderSettings = {
  baseUrl: "https://api.openai.com/v1",
  apiKeyLabel: "local credential saved",
  selectedModel: "gpt-4o-mini-transcribe",
  verificationStatus: "verified",
  availableModels: ["gpt-4o-mini-transcribe", "gpt-4o-transcribe", "whisper-1"],
  verifiedAt: "2026-05-27T16:05:00.000Z",
} satisfies ProviderSettings

export const mockProcessingSettings = {
  ...CHUNKED_TRANSCRIPTION_POLICY,
} satisfies ProcessingSettings

export const mockBackupOptions = {
  includeCredentials: true,
  includeRawRecordings: true,
} satisfies BackupOptions

export const mockRecordingRequirements = [
  {
    id: "display",
    label: "Display video",
    description:
      "Capture the selected browser tab, window, or desktop surface.",
    status: "passed",
  },
  {
    id: "system-audio",
    label: "System or tab audio",
    description: "Capture shared display audio when the browser provides it.",
    status: "unknown",
  },
  {
    id: "microphone",
    label: "Microphone",
    description: "Capture microphone audio when permission is granted.",
    status: "unknown",
  },
] satisfies RecordingRequirement[]
