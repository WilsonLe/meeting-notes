import { useEffect, useRef, useState } from "react"
import { MonitorUpIcon, ShieldCheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { RecordingPlayer } from "@/components/meeting-notes/recording-player"
import { formatDateTime } from "@/components/meeting-notes/meeting-note-format"
import { StatusBadge } from "@/components/meeting-notes/meeting-note-ui"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { saveMeetingNoteRecording } from "@/lib/local-workspace-repository"
import type { MeetingNote, RecordingSource } from "@/lib/domain"

type CaptureState = "idle" | "requesting" | "recording" | "saving"

type MeetingNoteEditViewProps = {
  note: MeetingNote | null
  onRecordingSaved: (note: MeetingNote) => void
}

type CaptureResources = {
  stream: MediaStream
  sourceStreams: MediaStream[]
  audioContext: AudioContext | null
  audioSources: MediaStreamAudioSourceNode[]
  audioDestination: MediaStreamAudioDestinationNode | null
}

type PreparedCapture = CaptureResources & {
  capturedSources: RecordingSource[]
  warningMessage: string | null
}

type MicrophoneCaptureResult = {
  stream: MediaStream | null
  warningMessage: string | null
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
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null)
  const previewVideoRef = useRef<HTMLVideoElement | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const captureResourcesRef = useRef<CaptureResources | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const capturedSourcesRef = useRef<RecordingSource[]>([])
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

      cleanupCaptureResources(captureResourcesRef.current)
      captureResourcesRef.current = null
    }
  }, [])

  useEffect(() => {
    if (previewVideoRef.current) {
      previewVideoRef.current.srcObject = previewStream
    }
  }, [previewStream])

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
      captureResourcesRef.current
    ) {
      return
    }

    if (!note) {
      setMessage("Meeting note not found in selected workspace.")
      return
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      setMessage("Browser does not support display capture.")
      return
    }

    if (typeof MediaRecorder === "undefined") {
      setMessage("Browser does not support MediaRecorder.")
      return
    }

    isCaptureRequestingRef.current = true
    setCaptureState("requesting")
    setMessage(null)
    setPreviewStream(null)
    let captureResources: CaptureResources | null = null

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })
      const preparedCapture = await prepareCapture(displayStream)
      const validationMessage = validateDisplayCaptureStream(
        preparedCapture.stream
      )

      captureResources = preparedCapture

      if (!isMountedRef.current) {
        cleanupCaptureResources(preparedCapture)
        return
      }

      if (validationMessage) {
        cleanupCaptureResources(preparedCapture)
        setCaptureState("idle")
        setMessage(validationMessage)
        return
      }

      const mimeType = getSupportedMimeType()
      const recorder = new MediaRecorder(
        preparedCapture.stream,
        mimeType ? { mimeType } : undefined
      )

      chunksRef.current = []
      capturedSourcesRef.current = preparedCapture.capturedSources
      startedAtRef.current = getCurrentTimestamp()
      recorderRef.current = recorder
      captureResourcesRef.current = preparedCapture

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      recorder.onstop = () => {
        void finishCapture(note)
      }
      recorder.onerror = () => {
        cleanupCaptureResources(captureResourcesRef.current)
        recorderRef.current = null
        captureResourcesRef.current = null
        chunksRef.current = []
        capturedSourcesRef.current = []
        startedAtRef.current = 0

        if (isMountedRef.current) {
          setPreviewStream(null)
          setCaptureState("idle")
          setMessage("Capture failed before recording could be saved.")
        }
      }

      for (const track of preparedCapture.stream.getVideoTracks()) {
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
      setPreviewStream(preparedCapture.stream)
      setCaptureState("recording")
      setMessage(preparedCapture.warningMessage)
    } catch (error) {
      cleanupCaptureResources(captureResources)
      recorderRef.current = null
      captureResourcesRef.current = null
      chunksRef.current = []
      capturedSourcesRef.current = []
      startedAtRef.current = 0

      if (isMountedRef.current) {
        setPreviewStream(null)
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
    const captureResources = captureResourcesRef.current
    const mimeType = recorder?.mimeType || chunks[0]?.type || "video/webm"
    const durationSeconds = Math.max(
      1,
      Math.round((getCurrentTimestamp() - startedAtRef.current) / 1000)
    )
    const blob = new Blob(chunks, { type: mimeType })
    const capturedSources = capturedSourcesRef.current

    cleanupCaptureResources(captureResources)
    recorderRef.current = null
    captureResourcesRef.current = null
    chunksRef.current = []
    capturedSourcesRef.current = []
    startedAtRef.current = 0
    setPreviewStream(null)

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
        capturedSources,
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
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <Card className="overflow-hidden border-border/80 bg-card/95 shadow-sm shadow-foreground/5">
        <CardHeader className="gap-4 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {note && <StatusBadge state={note.state} />}
                <Badge variant="outline">
                  <ShieldCheckIcon aria-hidden="true" />
                  Stored in this browser
                </Badge>
              </div>
              <CardTitle>
                <h1 className="font-heading text-2xl tracking-tight sm:text-3xl">
                  {note?.title ?? "Capture unavailable"}
                </h1>
              </CardTitle>
              <CardDescription className="mt-2 max-w-2xl text-base">
                {note
                  ? `Created ${formatDateTime(note.createdAt)}. Choose a tab, window, or screen when the browser picker opens.`
                  : "Meeting note not found in selected workspace."}
              </CardDescription>
            </div>

            <Button
              type="button"
              size="lg"
              disabled={!note || isRequesting || isSaving}
              onClick={handleCaptureClick}
              className="w-full sm:w-fit"
            >
              <MonitorUpIcon data-icon="inline-start" />
              {isSaving
                ? "Saving..."
                : isRequesting
                  ? "Opening picker..."
                  : isRecording
                    ? "Stop Capture"
                    : "Capture"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-5 p-5 pt-0 sm:p-6 sm:pt-0">
          {previewStream && (
            <div className="flex w-full flex-col gap-2">
              <p className="text-sm font-medium">Live capture preview</p>
              <video
                ref={previewVideoRef}
                autoPlay
                muted
                playsInline
                className="aspect-video w-full rounded-2xl border bg-black shadow-sm"
              />
            </div>
          )}
          {(message || !note) && (
            <p className="rounded-2xl border bg-background/70 p-3 text-sm text-muted-foreground">
              {message ?? "Meeting note not found in selected workspace."}
            </p>
          )}
          {note && <RecordingPlayer note={note} />}
        </CardContent>
      </Card>
    </section>
  )
}

function getCurrentTimestamp() {
  return Date.now()
}

async function prepareCapture(
  displayStream: MediaStream
): Promise<PreparedCapture> {
  const microphoneCapture = await requestMicrophoneCapture()

  try {
    const displayAudioTracks = displayStream.getAudioTracks()
    const microphoneAudioTracks =
      microphoneCapture.stream?.getAudioTracks() ?? []
    const recordingResources = await createRecordingResources(
      displayStream,
      microphoneCapture.stream
    )
    const displaySource = getDisplayRecordingSource(displayStream)
    const capturedSources = uniqueRecordingSources([
      displaySource,
      ...getDisplayAudioSources(displaySource, displayAudioTracks.length),
      ...(microphoneAudioTracks.length > 0 ? ["microphone" as const] : []),
    ])
    const warnings = [
      displayAudioTracks.length === 0
        ? "System or tab audio was not shared; continuing without it."
        : null,
      microphoneCapture.warningMessage,
    ].filter((warning): warning is string => Boolean(warning))

    return {
      ...recordingResources,
      sourceStreams: [displayStream, microphoneCapture.stream].filter(
        (stream): stream is MediaStream => Boolean(stream)
      ),
      capturedSources,
      warningMessage: warnings.length > 0 ? warnings.join(" ") : null,
    }
  } catch (error) {
    stopStream(displayStream)
    stopStream(microphoneCapture.stream)
    throw error
  }
}

async function createRecordingResources(
  displayStream: MediaStream,
  microphoneStream: MediaStream | null
): Promise<Omit<CaptureResources, "sourceStreams">> {
  const audioTracks = [
    ...displayStream.getAudioTracks(),
    ...(microphoneStream?.getAudioTracks() ?? []),
  ]

  if (audioTracks.length === 0) {
    return {
      stream: new MediaStream(displayStream.getVideoTracks()),
      audioContext: null,
      audioSources: [],
      audioDestination: null,
    }
  }

  const audioContext = new AudioContext()
  const audioDestination = audioContext.createMediaStreamDestination()
  const audioSources = audioTracks.map((track) => {
    const source = audioContext.createMediaStreamSource(
      new MediaStream([track])
    )

    source.connect(audioDestination)

    return source
  })

  if (audioContext.state === "suspended") {
    await audioContext.resume()
  }

  return {
    stream: new MediaStream([
      ...displayStream.getVideoTracks(),
      ...audioDestination.stream.getAudioTracks(),
    ]),
    audioContext,
    audioSources,
    audioDestination,
  }
}

async function requestMicrophoneCapture(): Promise<MicrophoneCaptureResult> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return {
      stream: null,
      warningMessage:
        "Microphone capture is not supported; continuing without mic audio.",
    }
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    if (stream.getAudioTracks().length === 0) {
      stopStream(stream)
      return {
        stream: null,
        warningMessage:
          "Microphone did not provide audio; continuing without mic audio.",
      }
    }

    return { stream, warningMessage: null }
  } catch {
    return {
      stream: null,
      warningMessage: "Microphone unavailable; continuing without mic audio.",
    }
  }
}

function validateDisplayCaptureStream(stream: MediaStream) {
  if (stream.getVideoTracks().length === 0) {
    return "Select a browser tab, window, or screen with video enabled."
  }

  return null
}

function getDisplayRecordingSource(stream: MediaStream): RecordingSource {
  const settings = stream.getVideoTracks()[0]?.getSettings() as
    | (MediaTrackSettings & { displaySurface?: string })
    | undefined

  switch (settings?.displaySurface) {
    case "browser":
      return "browser-tab"
    case "window":
      return "window"
    case "monitor":
      return "desktop"
    default:
      return "display"
  }
}

function getDisplayAudioSources(
  displaySource: RecordingSource,
  audioTrackCount: number
): RecordingSource[] {
  if (audioTrackCount === 0) {
    return []
  }

  return [displaySource === "browser-tab" ? "tab-audio" : "system-audio"]
}

function uniqueRecordingSources(sources: RecordingSource[]) {
  return Array.from(new Set(sources))
}

function getSupportedMimeType() {
  return preferredMimeTypes.find((mimeType) =>
    MediaRecorder.isTypeSupported(mimeType)
  )
}

function cleanupCaptureResources(resources: CaptureResources | null) {
  stopStream(resources?.stream ?? null)

  for (const source of resources?.audioSources ?? []) {
    source.disconnect()
  }

  resources?.audioDestination?.disconnect()

  if (resources?.audioContext && resources.audioContext.state !== "closed") {
    void resources.audioContext.close().catch(() => undefined)
  }

  for (const stream of resources?.sourceStreams ?? []) {
    stopStream(stream)
  }
}

function stopStream(stream: MediaStream | null) {
  for (const track of stream?.getTracks() ?? []) {
    track.stop()
  }
}

function getCaptureErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "Capture permission was denied."
    }

    if (error.name === "NotSupportedError") {
      return "Display capture is not supported in this browser context."
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return "Capture failed."
}
