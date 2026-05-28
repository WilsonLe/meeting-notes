export type MeetingNoteState =
  | "draft"
  | "recorded"
  | "processing"
  | "ready"
  | "failed"
  | "archived"

export type DashboardFilter =
  | "all"
  | "ready"
  | "processing"
  | "failed"
  | "archived"

export type ProcessingRunStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "paused"

export type TranscriptChunkStatus =
  | "pending"
  | "transcribing"
  | "complete"
  | "failed"

export type RecordingSource = "browser-tab" | "tab-audio" | "microphone"

export type RequirementStatus = "passed" | "missing" | "unknown"

export type BackupOptionKey = "includeCredentials" | "includeRawRecordings"

export type ProviderVerificationStatus =
  | "not-configured"
  | "verified"
  | "failed"

export interface RawRecording {
  id: string
  fileName: string
  mimeType: string
  durationSeconds: number
  sizeBytes: number
  capturedSources: RecordingSource[]
}

export interface TranscriptChunk {
  id: string
  index: number
  startSecond: number
  endSecond: number
  overlapBeforeSeconds: number
  status: TranscriptChunkStatus
  retryCount: number
  text: string
}

export interface ProcessingRun {
  id: string
  startedAt: string
  completedAt?: string
  status: ProcessingRunStatus
  model: string
  chunkCount: number
  completedChunks: number
  failedChunks: number
  summary: string
}

export interface MeetingSummary {
  overview: string
  decisions: string[]
  actionItems: string[]
  risks: string[]
}

export interface MeetingNote {
  id: string
  title: string
  state: MeetingNoteState
  createdAt: string
  updatedAt: string
  participants: string[]
  durationSeconds: number
  rawRecording?: RawRecording
  transcriptChunks: TranscriptChunk[]
  summary?: MeetingSummary
  processingRuns: ProcessingRun[]
  providerConfigured: boolean
}

export interface ProviderSettings {
  baseUrl: string
  apiKeyLabel: string
  selectedModel: string
  verificationStatus: ProviderVerificationStatus
  availableModels: string[]
  verifiedAt?: string
}

export interface ProcessingSettings {
  chunkDurationSeconds: number
  chunkOverlapSeconds: number
  concurrency: number
  retryLimit: number
  resumeIncompleteOnLaunch: boolean
}

export interface BackupOptions {
  includeCredentials: boolean
  includeRawRecordings: boolean
}

export interface RecordingRequirement {
  id: RecordingSource
  label: string
  description: string
  status: RequirementStatus
}

export const DASHBOARD_FILTERS: Array<{
  id: DashboardFilter
  label: string
}> = [
  { id: "all", label: "All" },
  { id: "ready", label: "Ready" },
  { id: "processing", label: "Processing" },
  { id: "failed", label: "Failed" },
  { id: "archived", label: "Archived" },
]

export const CHUNKED_TRANSCRIPTION_POLICY: ProcessingSettings = {
  chunkDurationSeconds: 5 * 60,
  chunkOverlapSeconds: 10,
  concurrency: 2,
  retryLimit: 2,
  resumeIncompleteOnLaunch: true,
}
