import { expect, test, type Page } from "@playwright/test"

type MediaMockOptions = {
  displaySurface: "browser" | "window" | "monitor"
  displayAudio: boolean
  microphone: "available" | "denied"
}

test.describe("capture recording", () => {
  test("accepts desktop capture and saves a downloadable recording without mic permission", async ({
    page,
  }) => {
    await mockCaptureDevices(page, {
      displaySurface: "monitor",
      displayAudio: false,
      microphone: "denied",
    })

    await page.goto("/")
    await page.getByRole("button", { name: "Create" }).click()
    await page.getByRole("button", { name: "Capture" }).click()

    await expect(
      page.getByRole("button", { name: "Stop Capture" })
    ).toBeVisible()
    await expect(page.getByText("Live capture preview")).toBeVisible()
    await expect(
      page.getByText("System or tab audio was not shared", { exact: false })
    ).toBeVisible()
    await expect(
      page.getByText("Microphone unavailable", { exact: false })
    ).toBeVisible()

    await page.waitForTimeout(1_200)
    await page.getByRole("button", { name: "Stop Capture" }).click()

    await expect(page.getByText("Capture saved locally.")).toBeVisible()
    await expect(page.getByText("Saved recording")).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Download WebM" })
    ).toHaveAttribute("download", /\.webm$/)
    await expect(page.locator("video[controls]")).toBeVisible()

    const savedNote = await getSavedRecording(page)
    expect(savedNote?.state).toBe("recorded")
    expect(savedNote?.rawRecording?.capturedSources).toEqual(["desktop"])
    expect(savedNote?.recordingBlobSize).toBeGreaterThan(0)
  })

  test("records tab audio and microphone when both are available", async ({
    page,
  }) => {
    await mockCaptureDevices(page, {
      displaySurface: "browser",
      displayAudio: true,
      microphone: "available",
    })

    await page.goto("/")
    await page.getByRole("button", { name: "Create" }).click()
    await page.getByRole("button", { name: "Capture" }).click()
    await expect(
      page.getByRole("button", { name: "Stop Capture" })
    ).toBeVisible()

    await page.waitForTimeout(1_200)
    await page.getByRole("button", { name: "Stop Capture" }).click()

    await expect(page.getByText("Capture saved locally.")).toBeVisible()
    await expect(
      page.getByText("Browser tab, Tab audio, Microphone")
    ).toBeVisible()

    const savedNote = await getSavedRecording(page)
    expect(savedNote?.rawRecording?.capturedSources).toEqual([
      "browser-tab",
      "tab-audio",
      "microphone",
    ])
    expect(savedNote?.recordingBlobSize).toBeGreaterThan(0)
  })
})

async function mockCaptureDevices(page: Page, options: MediaMockOptions) {
  await page.addInitScript((mediaOptions) => {
    const mediaDevices = navigator.mediaDevices ?? {}

    Object.defineProperty(navigator, "mediaDevices", {
      value: mediaDevices,
      configurable: true,
    })

    const createAudioTrack = () => {
      const AudioContextConstructor =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      const audioContext = new AudioContextConstructor()
      const oscillator = audioContext.createOscillator()
      const destination = audioContext.createMediaStreamDestination()

      oscillator.connect(destination)
      oscillator.start()

      return destination.stream.getAudioTracks()[0]
    }

    const createDisplayStream = () => {
      const canvas = document.createElement("canvas")
      const context = canvas.getContext("2d")
      let frame = 0

      canvas.width = 640
      canvas.height = 360

      const paintFrame = () => {
        if (!context) {
          return
        }

        frame += 1
        context.fillStyle = frame % 2 === 0 ? "#0f172a" : "#172554"
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.fillStyle = "#f8fafc"
        context.font = "28px sans-serif"
        context.fillText(`capture frame ${frame}`, 40, 180)
      }

      paintFrame()
      window.setInterval(paintFrame, 100)

      const stream = canvas.captureStream(15)
      const videoTrack = stream.getVideoTracks()[0]
      const getSettings = videoTrack.getSettings.bind(videoTrack)

      videoTrack.getSettings = () => ({
        ...getSettings(),
        displaySurface: mediaOptions.displaySurface,
      })

      if (mediaOptions.displayAudio) {
        stream.addTrack(createAudioTrack())
      }

      return stream
    }

    mediaDevices.getDisplayMedia = async () => createDisplayStream()
    mediaDevices.getUserMedia = async () => {
      if (mediaOptions.microphone === "denied") {
        throw new DOMException("Permission denied", "NotAllowedError")
      }

      return new MediaStream([createAudioTrack()])
    }
  }, options)
}

async function getSavedRecording(page: Page) {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("meeting-notes-local")

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    try {
      const transaction = database.transaction(
        ["meetingNotes", "recordings"],
        "readonly"
      )
      const notes = await new Promise<Array<Record<string, unknown>>>(
        (resolve, reject) => {
          const request = transaction.objectStore("meetingNotes").getAll()

          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error)
        }
      )
      const recordings = await new Promise<Array<{ id: string; blob: Blob }>>(
        (resolve, reject) => {
          const request = transaction.objectStore("recordings").getAll()

          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error)
        }
      )
      const note = notes[0]
      const rawRecording = note?.rawRecording as { id: string } | undefined
      const recording = recordings.find((item) => item.id === rawRecording?.id)

      return note
        ? {
            ...note,
            recordingBlobSize: recording?.blob.size ?? 0,
          }
        : null
    } finally {
      database.close()
    }
  })
}
