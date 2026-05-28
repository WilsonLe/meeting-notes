import type { MeetingNote, RecordingSource } from "@/lib/domain"

const DATABASE_NAME = "meeting-notes-local"
const DATABASE_VERSION = 1
const RECORD_SCHEMA_VERSION = 1
const DEFAULT_WORKSPACE_ID = "workspace-default"
const SELECTED_WORKSPACE_META_KEY = "selectedWorkspaceId"

type StoreName =
  | "meta"
  | "migrations"
  | "backups"
  | "workspaces"
  | "meetingNotes"
  | "recordings"

type MetaRecord<T = unknown> = {
  key: string
  value: T
  updatedAt: string
  schemaVersion: number
}

export type LocalWorkspace = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  schemaVersion: number
}

type MeetingNoteRecord = MeetingNote & {
  schemaVersion: number
}

type RecordingRecord = {
  id: string
  meetingId: string
  workspaceId: string
  blob: Blob
  mimeType: string
  sizeBytes: number
  durationSeconds: number
  chunkCount: number
  capturedAt: string
  schemaVersion: number
}

export type LocalWorkspaceState = {
  workspaces: LocalWorkspace[]
  selectedWorkspaceId: string
  notes: MeetingNote[]
}

export type SaveMeetingNoteRecordingInput = {
  blob: Blob
  durationSeconds: number
  mimeType: string
  chunkCount: number
  capturedSources: RecordingSource[]
}

export type StoredMeetingNoteRecording = {
  id: string
  meetingId: string
  blob: Blob
  mimeType: string
  sizeBytes: number
  durationSeconds: number
  capturedAt: string
}

export async function loadLocalWorkspaceState(): Promise<LocalWorkspaceState> {
  return withDatabase(async (database) => {
    const workspaces = await getAllRecords<LocalWorkspace>(
      database,
      "workspaces"
    )
    const selectedWorkspaceId = await getValidSelectedWorkspaceId(
      database,
      workspaces
    )
    const notes = await listMeetingNotesForWorkspace(
      database,
      selectedWorkspaceId
    )

    return {
      workspaces: sortWorkspaces(workspaces),
      selectedWorkspaceId,
      notes,
    }
  })
}

export async function selectLocalWorkspace(workspaceId: string): Promise<void> {
  return withDatabase(async (database) => {
    const workspace = await getRecord<LocalWorkspace>(
      database,
      "workspaces",
      workspaceId
    )

    if (!workspace) {
      throw new Error("Workspace not found")
    }

    await setMetaValue(database, SELECTED_WORKSPACE_META_KEY, workspace.id)
  })
}

export async function createLocalWorkspace(
  name: string
): Promise<LocalWorkspace> {
  return withDatabase(async (database) => {
    const now = new Date().toISOString()
    const workspace: LocalWorkspace = {
      id: createId("workspace"),
      name: name.trim() || "Local workspace",
      createdAt: now,
      updatedAt: now,
      schemaVersion: RECORD_SCHEMA_VERSION,
    }

    await putRecord(database, "workspaces", workspace)
    await setMetaValue(database, SELECTED_WORKSPACE_META_KEY, workspace.id)

    return workspace
  })
}

export async function createMeetingNoteDraft(
  workspaceId: string
): Promise<MeetingNote> {
  return withDatabase(async (database) => {
    const workspace = await getRecord<LocalWorkspace>(
      database,
      "workspaces",
      workspaceId
    )

    if (!workspace) {
      throw new Error("Workspace not found")
    }

    const now = new Date().toISOString()
    const note: MeetingNoteRecord = {
      id: createId("meeting"),
      workspaceId,
      title: "Untitled meeting note",
      state: "draft",
      createdAt: now,
      updatedAt: now,
      participants: [],
      durationSeconds: 0,
      transcriptChunks: [],
      processingRuns: [],
      providerConfigured: false,
      schemaVersion: RECORD_SCHEMA_VERSION,
    }

    await putRecord(database, "meetingNotes", note)

    return toMeetingNote(note)
  })
}

export async function saveMeetingNoteRecording(
  meetingId: string,
  input: SaveMeetingNoteRecordingInput
): Promise<MeetingNote> {
  return withDatabase(async (database) => {
    const note = await getRecord<MeetingNoteRecord>(
      database,
      "meetingNotes",
      meetingId
    )

    if (!note) {
      throw new Error("Meeting note not found")
    }

    const now = new Date().toISOString()
    const recordingId = createId("recording")
    const recording: RecordingRecord = {
      id: recordingId,
      meetingId: note.id,
      workspaceId: note.workspaceId,
      blob: input.blob,
      mimeType: input.mimeType || input.blob.type || "video/webm",
      sizeBytes: input.blob.size,
      durationSeconds: input.durationSeconds,
      chunkCount: input.chunkCount,
      capturedAt: now,
      schemaVersion: RECORD_SCHEMA_VERSION,
    }
    const updatedNote: MeetingNoteRecord = {
      ...note,
      state: "recorded",
      updatedAt: now,
      durationSeconds: input.durationSeconds,
      rawRecording: {
        id: recordingId,
        fileName: createRecordingFileName(note.id, now),
        mimeType: recording.mimeType,
        durationSeconds: input.durationSeconds,
        sizeBytes: input.blob.size,
        capturedSources: input.capturedSources,
      },
    }

    const transaction = database.transaction(
      ["recordings", "meetingNotes"],
      "readwrite"
    )
    const recordingsStore = transaction.objectStore("recordings")
    const previousRecordingId = note.rawRecording?.id

    if (previousRecordingId && previousRecordingId !== recording.id) {
      recordingsStore.delete(previousRecordingId)
    }

    recordingsStore.put(recording)
    transaction.objectStore("meetingNotes").put(updatedNote)
    await waitForTransaction(transaction)

    return toMeetingNote(updatedNote)
  })
}

export async function loadMeetingNoteRecording(
  recordingId: string
): Promise<StoredMeetingNoteRecording | null> {
  return withDatabase(async (database) => {
    const recording = await getRecord<RecordingRecord>(
      database,
      "recordings",
      recordingId
    )

    if (!recording) {
      return null
    }

    return {
      id: recording.id,
      meetingId: recording.meetingId,
      blob: recording.blob,
      mimeType: recording.mimeType,
      sizeBytes: recording.sizeBytes,
      durationSeconds: recording.durationSeconds,
      capturedAt: recording.capturedAt,
    }
  })
}

async function withDatabase<T>(
  callback: (database: IDBDatabase) => Promise<T>
): Promise<T> {
  const database = await openDatabase()

  try {
    await ensureDefaultWorkspace(database)
    return await callback(database)
  } finally {
    database.close()
  }
}

function openDatabase(): Promise<IDBDatabase> {
  if (!globalThis.indexedDB) {
    return Promise.reject(
      new Error("IndexedDB is not available in this browser")
    )
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result
      const transaction = request.transaction
      const now = new Date().toISOString()

      if (!database.objectStoreNames.contains("meta")) {
        database.createObjectStore("meta", { keyPath: "key" })
      }

      if (!database.objectStoreNames.contains("migrations")) {
        database.createObjectStore("migrations", { keyPath: "version" })
      }

      if (!database.objectStoreNames.contains("backups")) {
        database.createObjectStore("backups", { keyPath: "id" })
      }

      if (!database.objectStoreNames.contains("workspaces")) {
        database.createObjectStore("workspaces", { keyPath: "id" })
      }

      if (!database.objectStoreNames.contains("meetingNotes")) {
        const meetingNotesStore = database.createObjectStore("meetingNotes", {
          keyPath: "id",
        })
        meetingNotesStore.createIndex("workspaceId", "workspaceId", {
          unique: false,
        })
      }

      if (!database.objectStoreNames.contains("recordings")) {
        const recordingsStore = database.createObjectStore("recordings", {
          keyPath: "id",
        })
        recordingsStore.createIndex("meetingId", "meetingId", {
          unique: false,
        })
        recordingsStore.createIndex("workspaceId", "workspaceId", {
          unique: false,
        })
      }

      if (transaction) {
        transaction.objectStore("migrations").put({
          version: DATABASE_VERSION,
          appliedAt: now,
          description: "Initial IndexedDB schema for local workspaces",
          schemaVersion: RECORD_SCHEMA_VERSION,
        })
        transaction.objectStore("meta").put({
          key: "schemaVersion",
          value: RECORD_SCHEMA_VERSION,
          updatedAt: now,
          schemaVersion: RECORD_SCHEMA_VERSION,
        } satisfies MetaRecord<number>)
        transaction.objectStore("meta").put({
          key: "databaseVersion",
          value: DATABASE_VERSION,
          updatedAt: now,
          schemaVersion: RECORD_SCHEMA_VERSION,
        } satisfies MetaRecord<number>)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => {
      reject(request.error ?? new Error("Unable to open local workspace store"))
    }
    request.onblocked = () => {
      reject(new Error("Local workspace store upgrade is blocked"))
    }
  })
}

async function ensureDefaultWorkspace(database: IDBDatabase) {
  const defaultWorkspace = await getRecord<LocalWorkspace>(
    database,
    "workspaces",
    DEFAULT_WORKSPACE_ID
  )

  if (!defaultWorkspace) {
    const now = new Date().toISOString()
    await putRecord(database, "workspaces", {
      id: DEFAULT_WORKSPACE_ID,
      name: "Default workspace",
      createdAt: now,
      updatedAt: now,
      schemaVersion: RECORD_SCHEMA_VERSION,
    } satisfies LocalWorkspace)
  }

  const selectedWorkspaceId = await getMetaValue<string>(
    database,
    SELECTED_WORKSPACE_META_KEY
  )

  if (!selectedWorkspaceId) {
    await setMetaValue(
      database,
      SELECTED_WORKSPACE_META_KEY,
      DEFAULT_WORKSPACE_ID
    )
  }
}

async function getValidSelectedWorkspaceId(
  database: IDBDatabase,
  workspaces: LocalWorkspace[]
) {
  const selectedWorkspaceId = await getMetaValue<string>(
    database,
    SELECTED_WORKSPACE_META_KEY
  )
  const workspaceIds = new Set(workspaces.map((workspace) => workspace.id))

  if (selectedWorkspaceId && workspaceIds.has(selectedWorkspaceId)) {
    return selectedWorkspaceId
  }

  await setMetaValue(
    database,
    SELECTED_WORKSPACE_META_KEY,
    DEFAULT_WORKSPACE_ID
  )
  return DEFAULT_WORKSPACE_ID
}

async function listMeetingNotesForWorkspace(
  database: IDBDatabase,
  workspaceId: string
): Promise<MeetingNote[]> {
  const transaction = database.transaction("meetingNotes", "readonly")
  const store = transaction.objectStore("meetingNotes")
  const index = store.index("workspaceId")
  const request = index.getAll(IDBKeyRange.only(workspaceId)) as IDBRequest<
    MeetingNoteRecord[]
  >
  const records = await requestToPromise(request)

  await waitForTransaction(transaction)

  return records
    .map(toMeetingNote)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
}

function toMeetingNote(record: MeetingNoteRecord): MeetingNote {
  const { schemaVersion, ...note } = record
  void schemaVersion

  return note
}

async function getMetaValue<T>(
  database: IDBDatabase,
  key: string
): Promise<T | null> {
  const record = await getRecord<MetaRecord<T>>(database, "meta", key)
  return record?.value ?? null
}

async function setMetaValue<T>(
  database: IDBDatabase,
  key: string,
  value: T
): Promise<void> {
  await putRecord(database, "meta", {
    key,
    value,
    updatedAt: new Date().toISOString(),
    schemaVersion: RECORD_SCHEMA_VERSION,
  } satisfies MetaRecord<T>)
}

async function getRecord<T>(
  database: IDBDatabase,
  storeName: StoreName,
  key: IDBValidKey
): Promise<T | undefined> {
  const transaction = database.transaction(storeName, "readonly")
  const request = transaction.objectStore(storeName).get(key) as IDBRequest<
    T | undefined
  >
  const record = await requestToPromise(request)

  await waitForTransaction(transaction)

  return record
}

async function getAllRecords<T>(
  database: IDBDatabase,
  storeName: StoreName
): Promise<T[]> {
  const transaction = database.transaction(storeName, "readonly")
  const request = transaction.objectStore(storeName).getAll() as IDBRequest<T[]>
  const records = await requestToPromise(request)

  await waitForTransaction(transaction)

  return records
}

async function putRecord<T>(
  database: IDBDatabase,
  storeName: StoreName,
  record: T
): Promise<void> {
  const transaction = database.transaction(storeName, "readwrite")
  transaction.objectStore(storeName).put(record)
  await waitForTransaction(transaction)
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => {
      reject(request.error ?? new Error("IndexedDB request failed"))
    }
  })
}

function waitForTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => {
      reject(transaction.error ?? new Error("IndexedDB transaction aborted"))
    }
    transaction.onerror = () => {
      reject(transaction.error ?? new Error("IndexedDB transaction failed"))
    }
  })
}

function sortWorkspaces(workspaces: LocalWorkspace[]) {
  return [...workspaces].sort((first, second) =>
    first.createdAt.localeCompare(second.createdAt)
  )
}

function createRecordingFileName(noteId: string, capturedAt: string) {
  return `${noteId}-${capturedAt.replaceAll(":", "-")}.webm`
}

function createId(prefix: string) {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  return `${prefix}-${randomId}`
}
