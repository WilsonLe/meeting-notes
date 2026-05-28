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
    id: "browser-tab",
    label: "Browser tab video",
    description:
      "Capture selected tab surface so the recording has visual context.",
    status: "passed",
  },
  {
    id: "tab-audio",
    label: "Tab audio",
    description: "Required. If tab audio is missing, fail before timer starts.",
    status: "passed",
  },
] satisfies RecordingRequirement[]
