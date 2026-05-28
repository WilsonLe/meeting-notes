import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { saveMeetingNoteRecording } from "@/lib/local-workspace-repository"
import type { MeetingNote } from "@/lib/domain"

type CaptureState = "idle" | "requesting" | "recording" | "saving"

type MeetingNoteEditViewProps = {
  note: MeetingNote | null
  onRecordingSaved: (note: MeetingNote) => void
}

const preferredMimeTypes = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
]

export function MeetingNoteEditView({
  note,
  onRecordingSaved,
}: MeetingNoteEditViewProps) {
  const [captureState, setCaptureState] = useState<CaptureState>("idle")
  const [message, setMessage] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef(0)
  const isCaptureRequestingRef = useRef(false)
  const isMountedRef = useRef(true)

  const isRequesting = captureState === "requesting"
  const isRecording = captureState === "recording"
  const isSaving = captureState === "saving"

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
      isCaptureRequestingRef.current = false
      const recorder = recorderRef.current

      if (recorder && recorder.state !== "inactive") {
        recorder.ondataavailable = null
        recorder.onerror = null
        recorder.onstop = null
        recorder.stop()
      }

      stopStream(streamRef.current)
    }
  }, [])

  const handleCaptureClick = () => {
    if (isRequesting || isSaving) {
      return
    }

    if (isRecording) {
      stopCapture()
      return
    }

    void startCapture()
  }

  const startCapture = async () => {
    if (
      isCaptureRequestingRef.current ||
      recorderRef.current ||
      streamRef.current
    ) {
      return
    }

    if (!note) {
      setMessage("Meeting note not found in selected workspace.")
      return
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      setMessage("Browser does not support tab capture.")
      return
    }

    if (typeof MediaRecorder === "undefined") {
      setMessage("Browser does not support MediaRecorder.")
      return
    }

    isCaptureRequestingRef.current = true
    setCaptureState("requesting")
    setMessage(null)
    let stream: MediaStream | null = null

    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })

      if (!isMountedRef.current) {
        stopStream(stream)
        return
      }

      const validationMessage = validateTabCaptureStream(stream)

      if (validationMessage) {
        stopStream(stream)
        setCaptureState("idle")
        setMessage(validationMessage)
        return
      }

      const mimeType = getSupportedMimeType()
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      )

      chunksRef.current = []
      startedAtRef.current = getCurrentTimestamp()
      recorderRef.current = recorder
      streamRef.current = stream

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      recorder.onstop = () => {
        void finishCapture(note)
      }
      recorder.onerror = () => {
        stopStream(stream)
        recorderRef.current = null
        streamRef.current = null
        chunksRef.current = []
        startedAtRef.current = 0

        if (isMountedRef.current) {
          setCaptureState("idle")
          setMessage("Capture failed before recording could be saved.")
        }
      }

      for (const track of stream.getTracks()) {
        track.addEventListener("ended", () => {
          if (!isMountedRef.current) {
            return
          }

          if (recorder.state === "recording") {
            setCaptureState("saving")
            recorder.requestData()
            recorder.stop()
          }
        })
      }

      recorder.start(1000)
      setCaptureState("recording")
    } catch (error) {
      stopStream(stream)
      recorderRef.current = null
      streamRef.current = null
      chunksRef.current = []
      startedAtRef.current = 0

      if (isMountedRef.current) {
        setCaptureState("idle")
        setMessage(getCaptureErrorMessage(error))
      }
    } finally {
      isCaptureRequestingRef.current = false
    }
  }

  const stopCapture = () => {
    const recorder = recorderRef.current

    if (!recorder || recorder.state !== "recording") {
      return
    }

    setCaptureState("saving")
    recorder.requestData()
    recorder.stop()
  }

  const finishCapture = async (capturedNote: MeetingNote) => {
    const chunks = chunksRef.current
    const recorder = recorderRef.current
    const stream = streamRef.current
    const mimeType = recorder?.mimeType || chunks[0]?.type || "video/webm"
    const durationSeconds = Math.max(
      1,
      Math.round((getCurrentTimestamp() - startedAtRef.current) / 1000)
    )
    const blob = new Blob(chunks, { type: mimeType })

    stopStream(stream)
    recorderRef.current = null
    streamRef.current = null
    chunksRef.current = []
    startedAtRef.current = 0

    if (blob.size === 0) {
      setCaptureState("idle")
      setMessage("Capture stopped before any WebM data was recorded.")
      return
    }

    setCaptureState("saving")

    try {
      const updatedNote = await saveMeetingNoteRecording(capturedNote.id, {
        blob,
        durationSeconds,
        mimeType,
        chunkCount: chunks.length,
      })
      onRecordingSaved(updatedNote)
      setCaptureState("idle")
      setMessage("Capture saved locally.")
    } catch (error) {
      setCaptureState("idle")
      setMessage(getCaptureErrorMessage(error))
    }
  }

  return (
    <section className="flex min-h-[calc(100svh-8rem)] flex-col items-center justify-center gap-3 p-4">
      <Button
        type="button"
        size="lg"
        disabled={!note || isRequesting || isSaving}
        onClick={handleCaptureClick}
      >
        {isSaving
          ? "Saving..."
          : isRequesting
            ? "Opening picker..."
            : isRecording
              ? "Stop Capture"
              : "Capture"}
      </Button>
      {(message || !note) && (
        <p className="max-w-md text-center text-sm text-muted-foreground">
          {message ?? "Meeting note not found in selected workspace."}
        </p>
      )}
    </section>
  )
}

function getCurrentTimestamp() {
  return Date.now()
}

function validateTabCaptureStream(stream: MediaStream) {
  const videoTrack = stream.getVideoTracks()[0]
  const settings = videoTrack?.getSettings() as MediaTrackSettings & {
    displaySurface?: string
  }

  if (!videoTrack) {
    return "Select a browser tab with video enabled."
  }

  if (settings.displaySurface && settings.displaySurface !== "browser") {
    return "Select a browser tab, not a window or screen."
  }

  if (stream.getAudioTracks().length === 0) {
    return "Select a browser tab with audio enabled."
  }

  return null
}

function getSupportedMimeType() {
  return preferredMimeTypes.find((mimeType) =>
    MediaRecorder.isTypeSupported(mimeType)
  )
}

function stopStream(stream: MediaStream | null) {
  for (const track of stream?.getTracks() ?? []) {
    track.stop()
  }
}

function getCaptureErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "Capture permission was denied."
  }

  if (error instanceof Error) {
    return error.message
  }

  return "Capture failed."
}
