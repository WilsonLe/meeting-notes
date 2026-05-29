import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react"
import { FileTextIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { MeetingNoteDetailPage } from "@/components/meeting-notes/meeting-note-detail-page"
import { MeetingNoteEditView } from "@/components/meeting-notes/meeting-note-edit-view"
import { MeetingNotesView } from "@/components/meeting-notes/meeting-notes-view"
import {
  createLocalWorkspace,
  createMeetingNoteDraft,
  loadLocalWorkspaceState,
  selectLocalWorkspace,
  type LocalWorkspaceState,
} from "@/lib/local-workspace-repository"
import type { MeetingNote } from "@/lib/domain"

type AppRoute =
  | {
      name: "meetings"
    }
  | {
      name: "detail"
      meetingId: string
    }
  | {
      name: "edit"
      meetingId: string
    }

const initialWorkspaceState: LocalWorkspaceState = {
  workspaces: [],
  selectedWorkspaceId: "",
  notes: [],
}

function App() {
  const [route, setRoute] = useState(parseCurrentRoute)
  const [workspaceState, setWorkspaceState] = useState(initialWorkspaceState)
  const [workspaceError, setWorkspaceError] = useState<string | null>(null)
  const [isLoadingLocalState, setIsLoadingLocalState] = useState(true)
  const [isCreatingNote, setIsCreatingNote] = useState(false)

  const routeNote = useMemo(() => {
    if (route.name === "meetings") {
      return null
    }

    return (
      workspaceState.notes.find((note) => note.id === route.meetingId) ?? null
    )
  }, [route, workspaceState.notes])

  const navigate = useCallback((path: string) => {
    window.history.pushState(null, "", path)
    setRoute(parseRoute(path))
  }, [])

  useEffect(() => {
    let isMounted = true

    loadLocalWorkspaceState()
      .then((nextState) => {
        if (!isMounted) {
          return
        }

        setWorkspaceState(nextState)
        setWorkspaceError(null)
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setWorkspaceError(getErrorMessage(error))
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingLocalState(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const handlePopState = () => setRoute(parseCurrentRoute())

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  const handleCreateMeetingNote = useCallback(async () => {
    if (!workspaceState.selectedWorkspaceId) {
      return
    }

    setIsCreatingNote(true)

    try {
      const note = await createMeetingNoteDraft(
        workspaceState.selectedWorkspaceId
      )
      setWorkspaceState((currentState) => ({
        ...currentState,
        notes: sortNotesByCreatedAt([note, ...currentState.notes]),
      }))
      setWorkspaceError(null)
      navigate(`/${encodeURIComponent(note.id)}/edit`)
    } catch (error) {
      setWorkspaceError(getErrorMessage(error))
    } finally {
      setIsCreatingNote(false)
    }
  }, [navigate, workspaceState.selectedWorkspaceId])

  const handleRecordingSaved = useCallback((updatedNote: MeetingNote) => {
    setWorkspaceState((currentState) => {
      if (currentState.selectedWorkspaceId !== updatedNote.workspaceId) {
        return currentState
      }

      const hasNote = currentState.notes.some(
        (note) => note.id === updatedNote.id
      )
      const notes = hasNote
        ? currentState.notes.map((note) =>
            note.id === updatedNote.id ? updatedNote : note
          )
        : [updatedNote, ...currentState.notes]

      return {
        ...currentState,
        notes: sortNotesByCreatedAt(notes),
      }
    })
  }, [])

  const handleOpenNote = useCallback(
    (note: MeetingNote) => {
      navigate(`/${encodeURIComponent(note.id)}`)
    },
    [navigate]
  )

  const handleResumeCapture = useCallback(
    (note: MeetingNote) => {
      navigate(`/${encodeURIComponent(note.id)}/edit`)
    },
    [navigate]
  )

  const handleBackToMeetings = useCallback(() => {
    navigate("/")
  }, [navigate])

  const handleWorkspaceChange = useCallback(
    async (event: ChangeEvent<HTMLSelectElement>) => {
      const workspaceId = event.target.value

      setIsLoadingLocalState(true)

      try {
        await selectLocalWorkspace(workspaceId)
        const nextState = await loadLocalWorkspaceState()
        setWorkspaceState(nextState)
        setWorkspaceError(null)
        navigate("/")
      } catch (error) {
        setWorkspaceError(getErrorMessage(error))
      } finally {
        setIsLoadingLocalState(false)
      }
    },
    [navigate]
  )

  const handleAddWorkspace = useCallback(async () => {
    const fallbackName = `Workspace ${workspaceState.workspaces.length + 1}`
    const name = window.prompt("Workspace name", fallbackName)

    if (name === null) {
      return
    }

    setIsLoadingLocalState(true)

    try {
      await createLocalWorkspace(name)
      const nextState = await loadLocalWorkspaceState()
      setWorkspaceState(nextState)
      setWorkspaceError(null)
      navigate("/")
    } catch (error) {
      setWorkspaceError(getErrorMessage(error))
    } finally {
      setIsLoadingLocalState(false)
    }
  }, [navigate, workspaceState.workspaces.length])

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-3">
          <span className="flex size-8 items-center justify-center bg-primary text-xs font-semibold text-primary-foreground">
            MN
          </span>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                type="button"
                isActive={route.name === "meetings"}
                tooltip="Meetings"
                onClick={() => navigate("/")}
              >
                <FileTextIcon aria-hidden="true" />
                <span>Meetings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="gap-2 p-3 group-data-[collapsible=icon]:hidden">
          <label
            htmlFor="workspace-select"
            className="text-xs font-medium text-sidebar-foreground/70"
          >
            Workspace
          </label>
          <select
            id="workspace-select"
            value={workspaceState.selectedWorkspaceId}
            disabled={isLoadingLocalState}
            onChange={handleWorkspaceChange}
            className="h-9 w-full border border-sidebar-border bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            {workspaceState.workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoadingLocalState}
            onClick={handleAddWorkspace}
          >
            Add
          </Button>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-h-svh overflow-hidden bg-background/90">
        <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center border-b bg-background/80 px-4 backdrop-blur-xl">
          <SidebarTrigger className="-ml-1" />
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-6">
          {isLoadingLocalState ? (
            <p className="text-sm text-muted-foreground">
              Loading local workspace...
            </p>
          ) : workspaceError ? (
            <p role="alert" className="text-sm text-destructive">
              {workspaceError}
            </p>
          ) : route.name === "edit" ? (
            <MeetingNoteEditView
              note={routeNote}
              onRecordingSaved={handleRecordingSaved}
            />
          ) : route.name === "detail" ? (
            <MeetingNoteDetailPage
              note={routeNote}
              onBack={handleBackToMeetings}
              onResumeCapture={handleResumeCapture}
            />
          ) : (
            <MeetingNotesView
              notes={workspaceState.notes}
              isCreatingNote={isCreatingNote}
              onCreateNote={handleCreateMeetingNote}
              onOpenNote={handleOpenNote}
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function parseCurrentRoute() {
  return parseRoute(window.location.pathname)
}

function parseRoute(pathname: string): AppRoute {
  const editMatch = pathname.match(/^\/([^/]+)\/edit\/?$/)

  if (editMatch) {
    return {
      name: "edit",
      meetingId: decodeURIComponent(editMatch[1]),
    }
  }

  const detailMatch = pathname.match(/^\/([^/]+)\/?$/)

  if (detailMatch) {
    return {
      name: "detail",
      meetingId: decodeURIComponent(detailMatch[1]),
    }
  }

  return { name: "meetings" }
}

function sortNotesByCreatedAt(notes: MeetingNote[]) {
  return [...notes].sort((first, second) =>
    second.createdAt.localeCompare(first.createdAt)
  )
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return "Unexpected local workspace error"
}

export default App
