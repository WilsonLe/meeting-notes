import { useEffect, useMemo, useState } from "react"
import { DownloadIcon, FileVideoIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { loadMeetingNoteRecording } from "@/lib/local-workspace-repository"
import type { MeetingNote, RawRecording, RecordingSource } from "@/lib/domain"

type RecordingPlayerProps = {
  note: MeetingNote
}

export function RecordingPlayer({ note }: RecordingPlayerProps) {
  const recording = note.rawRecording

  if (!recording) {
    return null
  }

  return <RecordingPlayerContent key={recording.id} recording={recording} />
}

function RecordingPlayerContent({ recording }: { recording: RawRecording }) {
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const sourceLabel = useMemo(
    () => formatRecordingSources(recording.capturedSources),
    [recording.capturedSources]
  )

  useEffect(() => {
    let isCurrent = true
    let objectUrl: string | null = null

    loadMeetingNoteRecording(recording.id)
      .then((storedRecording) => {
        if (!isCurrent) {
          return
        }

        if (!storedRecording) {
          setRecordingError("Saved recording data is missing.")
          return
        }

        objectUrl = URL.createObjectURL(storedRecording.blob)
        setRecordingUrl(objectUrl)
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setRecordingError(getErrorMessage(error))
        }
      })

    return () => {
      isCurrent = false

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [recording.id])

  return (
    <section className="flex w-full flex-col gap-4 border bg-card p-4 text-card-foreground">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center bg-muted text-muted-foreground [&_svg]:size-4">
            <FileVideoIcon aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-heading text-sm font-medium">
              Saved recording
            </h2>
            <p className="text-sm break-all text-muted-foreground">
              {recording.fileName}
            </p>
          </div>
        </div>
        {recordingUrl ? (
          <Button asChild variant="outline" size="sm">
            <a href={recordingUrl} download={recording.fileName}>
              <DownloadIcon data-icon="inline-start" />
              Download WebM
            </a>
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" disabled>
            Preparing download...
          </Button>
        )}
      </div>

      <dl className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
        <RecordingMetric
          label="Duration"
          value={formatDuration(recording.durationSeconds)}
        />
        <RecordingMetric
          label="Size"
          value={formatBytes(recording.sizeBytes)}
        />
        <RecordingMetric label="Sources" value={sourceLabel} />
      </dl>

      {recordingError ? (
        <p
          role="alert"
          className="border bg-background/70 p-3 text-sm text-destructive"
        >
          {recordingError}
        </p>
      ) : recordingUrl ? (
        <video
          controls
          playsInline
          src={recordingUrl}
          className="aspect-video w-full border bg-black"
        >
          <track kind="captions" />
        </video>
      ) : (
        <p className="border bg-background/70 p-3 text-sm text-muted-foreground">
          Loading saved recording...
        </p>
      )}
    </section>
  )
}

function RecordingMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border bg-background/70 p-3">
      <dt className="font-medium text-foreground">{label}</dt>
      <dd className="mt-1 break-words">{value}</dd>
    </div>
  )
}

function formatRecordingSources(sources: RecordingSource[]) {
  if (sources.length === 0) {
    return "Unknown"
  }

  return sources.map(formatRecordingSource).join(", ")
}

function formatRecordingSource(source: RecordingSource) {
  switch (source) {
    case "browser-tab":
      return "Browser tab"
    case "desktop":
      return "Desktop"
    case "window":
      return "Window"
    case "display":
      return "Display"
    case "tab-audio":
      return "Tab audio"
    case "system-audio":
      return "System audio"
    case "microphone":
      return "Microphone"
  }
}

function formatDuration(durationSeconds: number) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return "0 sec"
  }

  const minutes = Math.floor(durationSeconds / 60)
  const seconds = durationSeconds % 60

  if (minutes === 0) {
    return `${seconds} sec`
  }

  return `${minutes} min ${seconds.toString().padStart(2, "0")} sec`
}

function formatBytes(sizeBytes: number) {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return "0 B"
  }

  const units = ["B", "KB", "MB", "GB"]
  let size = sizeBytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return "Could not load saved recording."
}
