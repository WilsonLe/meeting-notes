import { useMemo, useState } from "react"
import {
  BotIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  ClockIcon,
  DatabaseIcon,
  DownloadIcon,
  FileTextIcon,
  HardDriveIcon,
  HomeIcon,
  MicIcon,
  MonitorIcon,
  PlayIcon,
  PlugZapIcon,
  RotateCcwIcon,
  SearchIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SquareIcon,
  TimerIcon,
  UploadIcon,
  VideoIcon,
  Volume2Icon,
  WorkflowIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Toaster } from "@/components/ui/sonner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  mockBackupOptions,
  mockMeetingNotes,
  mockProcessingSettings,
  mockProviderSettings,
  mockRecordingRequirements,
} from "@/fixtures"
import {
  CHUNKED_TRANSCRIPTION_POLICY,
  DASHBOARD_FILTERS,
  type DashboardFilter,
  type MeetingNote,
  type RecordingRequirement,
} from "@/lib/domain"
import { cn } from "@/lib/utils"

type ScreenId = "dashboard" | "record" | "detail" | "settings"

type NavItem = {
  id: ScreenId
  label: string
  icon: typeof HomeIcon
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: HomeIcon },
  { id: "record", label: "Record", icon: VideoIcon },
  { id: "detail", label: "Meeting Detail", icon: FileTextIcon },
  { id: "settings", label: "Settings", icon: SettingsIcon },
]

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>("dashboard")
  const [selectedNoteId, setSelectedNoteId] = useState(mockMeetingNotes[0].id)
  const [dashboardFilter, setDashboardFilter] = useState<DashboardFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [importExportOpen, setImportExportOpen] = useState(false)

  const selectedNote =
    mockMeetingNotes.find((note) => note.id === selectedNoteId) ??
    mockMeetingNotes[0]

  const visibleNotes = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return mockMeetingNotes.filter((note) => {
      const matchesFilter =
        dashboardFilter === "all" || note.state === dashboardFilter
      const searchableText = [
        note.title,
        note.state,
        note.participants.join(" "),
        note.summary?.overview ?? "",
      ]
        .join(" ")
        .toLowerCase()
      const matchesQuery =
        normalizedQuery.length === 0 || searchableText.includes(normalizedQuery)

      return matchesFilter && matchesQuery
    })
  }, [dashboardFilter, searchQuery])

  const openNote = (note: MeetingNote) => {
    setSelectedNoteId(note.id)
    setActiveScreen("detail")
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="app-atmosphere min-h-svh">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
          <ShellHeader
            activeScreen={activeScreen}
            onNavigate={setActiveScreen}
            onOpenImportExport={() => setImportExportOpen(true)}
          />

          <main className="min-w-0">
            {activeScreen === "dashboard" && (
              <DashboardScreen
                filter={dashboardFilter}
                notes={visibleNotes}
                query={searchQuery}
                totalNotes={mockMeetingNotes.length}
                onFilterChange={setDashboardFilter}
                onOpenImportExport={() => setImportExportOpen(true)}
                onQueryChange={setSearchQuery}
                onRecord={() => setActiveScreen("record")}
                onSelectNote={openNote}
                onSettings={() => setActiveScreen("settings")}
              />
            )}
            {activeScreen === "record" && (
              <RecordScreen onSettings={() => setActiveScreen("settings")} />
            )}
            {activeScreen === "detail" && (
              <MeetingDetailScreen
                note={selectedNote}
                onSettings={() => setActiveScreen("settings")}
              />
            )}
            {activeScreen === "settings" && <SettingsScreen />}
          </main>
        </div>
      </div>

      <ImportExportDialog
        open={importExportOpen}
        onOpenChange={setImportExportOpen}
      />
      <Toaster />
    </div>
  )
}

function ShellHeader({
  activeScreen,
  onNavigate,
  onOpenImportExport,
}: {
  activeScreen: ScreenId
  onNavigate: (screen: ScreenId) => void
  onOpenImportExport: () => void
}) {
  return (
    <header className="card-hairline rounded-3xl border bg-card/90 p-3 backdrop-blur md:p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <MicIcon className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              Pure browser meeting notes
            </p>
            <h1 className="truncate text-2xl font-semibold tracking-tight md:text-3xl">
              Local recordings, portable backups
            </h1>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
          <nav aria-label="Primary navigation" className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant={activeScreen === item.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => onNavigate(item.id)}
                >
                  <Icon data-icon="inline-start" />
                  {item.label}
                </Button>
              )
            })}
          </nav>
          <Button variant="secondary" size="sm" onClick={onOpenImportExport}>
            <DatabaseIcon data-icon="inline-start" />
            Import / Export
          </Button>
        </div>
      </div>
    </header>
  )
}

function DashboardScreen({
  filter,
  notes,
  query,
  totalNotes,
  onFilterChange,
  onOpenImportExport,
  onQueryChange,
  onRecord,
  onSelectNote,
  onSettings,
}: {
  filter: DashboardFilter
  notes: MeetingNote[]
  query: string
  totalNotes: number
  onFilterChange: (filter: DashboardFilter) => void
  onOpenImportExport: () => void
  onQueryChange: (query: string) => void
  onRecord: () => void
  onSelectNote: (note: MeetingNote) => void
  onSettings: () => void
}) {
  const readyCount = mockMeetingNotes.filter(
    (note) => note.state === "ready"
  ).length
  const processingCount = mockMeetingNotes.filter(
    (note) => note.state === "processing"
  ).length
  const recordedWithoutProvider = mockMeetingNotes.filter(
    (note) => note.state === "recorded" && !note.providerConfigured
  ).length

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="flex min-w-0 flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            icon={FileTextIcon}
            label="Meeting Notes"
            value={String(totalNotes)}
            detail="Canonical record for recording, transcript, summary, and processing runs."
          />
          <MetricCard
            icon={CircleCheckIcon}
            label="Ready"
            value={String(readyCount)}
            detail="Summaries generated from chunked transcripts."
          />
          <MetricCard
            icon={WorkflowIcon}
            label="Processing"
            value={String(processingCount)}
            detail="Concurrency 2, retry failed chunks twice, resume next launch."
          />
        </div>

        <Card className="card-hairline">
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Dashboard</CardTitle>
                <CardDescription>
                  Filter by state, then search across visible notes only.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={onRecord}>
                  <VideoIcon data-icon="inline-start" />
                  Record meeting
                </Button>
                <Button variant="outline" onClick={onOpenImportExport}>
                  <DownloadIcon data-icon="inline-start" />
                  Backup
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <ToggleGroup
                type="single"
                value={filter}
                variant="outline"
                spacing={1}
                className="flex-wrap"
                onValueChange={(value) => {
                  if (value) {
                    onFilterChange(value as DashboardFilter)
                  }
                }}
              >
                {DASHBOARD_FILTERS.map((item) => (
                  <ToggleGroupItem key={item.id} value={item.id}>
                    {item.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <Field className="xl:max-w-sm">
                <FieldLabel htmlFor="dashboard-search" className="sr-only">
                  Search visible notes
                </FieldLabel>
                <div className="relative">
                  <SearchIcon
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="dashboard-search"
                    value={query}
                    onChange={(event) => onQueryChange(event.target.value)}
                    placeholder="Search visible notes"
                    className="pl-9"
                  />
                </div>
              </Field>
            </div>
          </CardHeader>
          <CardContent>
            {notes.length > 0 ? (
              <div className="grid gap-3">
                {notes.map((note) => (
                  <NoteListItem
                    key={note.id}
                    note={note}
                    onSelect={() => onSelectNote(note)}
                  />
                ))}
              </div>
            ) : (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <SearchIcon aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>No notes match this view</EmptyTitle>
                  <EmptyDescription>
                    Clear search or switch filters to see more local notes.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </section>

      <aside className="flex flex-col gap-4">
        <Alert>
          <ShieldCheckIcon aria-hidden="true" />
          <AlertTitle>Local-only by design</AlertTitle>
          <AlertDescription>
            No backend. Browser controls persistence; portability comes from
            export/import backups.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Provider readiness</CardTitle>
            <CardDescription>
              Recording works without provider. Recorded notes show a CTA until
              OpenAI-compatible settings verify.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 rounded-2xl border bg-muted/35 p-3">
              <div>
                <p className="text-sm font-medium">Recorded without provider</p>
                <p className="text-sm text-muted-foreground">
                  {recordedWithoutProvider} note needs transcript processing
                </p>
              </div>
              <Badge variant="secondary">CTA</Badge>
            </div>
            <Button variant="outline" onClick={onSettings}>
              <SettingsIcon data-icon="inline-start" />
              Configure provider
            </Button>
          </CardContent>
        </Card>

        <ProcessingPolicyCard compact />
      </aside>
    </div>
  )
}

function MetricCard({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail: string
  icon: typeof FileTextIcon
  label: string
  value: string
}) {
  return (
    <Card className="card-hairline overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardDescription>{label}</CardDescription>
          <div className="flex size-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
            <Icon className="size-4" aria-hidden="true" />
          </div>
        </div>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

function NoteListItem({
  note,
  onSelect,
}: {
  note: MeetingNote
  onSelect: () => void
}) {
  const run = note.processingRuns.at(-1)
  const progress = run
    ? Math.round((run.completedChunks / run.chunkCount) * 100)
    : 0

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group rounded-2xl border bg-card p-4 text-left transition hover:bg-muted/45 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-semibold tracking-tight">
              {note.title}
            </h3>
            <StateBadge state={note.state} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(note.updatedAt)} ·{" "}
            {formatDuration(note.durationSeconds)} ·{" "}
            {note.participants.join(", ")}
          </p>
        </div>
        <Badge variant="outline">{note.transcriptChunks.length} chunks</Badge>
      </div>

      {note.state === "processing" && run && (
        <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Transcription progress
            </span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} aria-label="Transcription progress" />
        </div>
      )}

      {note.summary?.overview && (
        <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">
          {note.summary.overview}
        </p>
      )}
    </button>
  )
}

function RecordScreen({ onSettings }: { onSettings: () => void }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <section className="flex min-w-0 flex-col gap-6">
        <Card className="card-hairline overflow-hidden">
          <CardHeader className="gap-4">
            <Badge variant="secondary">Prototype shell</Badge>
            <div>
              <CardTitle className="text-3xl">
                Record browser tab + meeting voice
              </CardTitle>
              <CardDescription>
                Full MediaRecorder engine lands later. First PR shows required
                preflight states and save behavior.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {mockRecordingRequirements.map((requirement) => (
              <RequirementCard key={requirement.id} requirement={requirement} />
            ))}
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3 border-t bg-muted/35 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Timer starts only after tab video, tab audio, and microphone pass.
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() =>
                  toast.info(
                    "Prototype only: recorder engine is outside first PR scope."
                  )
                }
              >
                <PlayIcon data-icon="inline-start" />
                Start recording check
              </Button>
              <Button variant="outline">
                <SquareIcon data-icon="inline-start" />
                Save draft
              </Button>
            </div>
          </CardFooter>
        </Card>

        <Alert>
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>Provider optional for recording</AlertTitle>
          <AlertDescription>
            Users can record without provider settings. Saved notes land in
            recorded state and show a CTA to configure and Verify Provider.
          </AlertDescription>
        </Alert>
      </section>

      <aside className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Browser support</CardTitle>
            <CardDescription>
              Desktop Chrome/Edge first. Unsupported browsers fail clearly
              before capture starts.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <CapabilityRow
              icon={MonitorIcon}
              label="Tab video"
              value="Required"
            />
            <CapabilityRow
              icon={Volume2Icon}
              label="Tab audio"
              value="Required"
            />
            <CapabilityRow icon={MicIcon} label="Microphone" value="Required" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>After save</CardTitle>
            <CardDescription>
              Meeting Note stores Raw Recording first, then Transcript, Summary,
              and Processing Runs as they become available.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button variant="outline" onClick={onSettings}>
              <SettingsIcon data-icon="inline-start" />
              Configure AI provider
            </Button>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}

function RequirementCard({
  requirement,
}: {
  requirement: RecordingRequirement
}) {
  const isPassed = requirement.status === "passed"
  const isMissing = requirement.status === "missing"

  return (
    <Card className="bg-muted/25">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-background text-primary">
            {requirement.id === "browser-tab" && (
              <MonitorIcon className="size-4" aria-hidden="true" />
            )}
            {requirement.id === "tab-audio" && (
              <Volume2Icon className="size-4" aria-hidden="true" />
            )}
            {requirement.id === "microphone" && (
              <MicIcon className="size-4" aria-hidden="true" />
            )}
          </div>
          <Badge
            variant={
              isMissing ? "destructive" : isPassed ? "default" : "outline"
            }
          >
            {requirement.status}
          </Badge>
        </div>
        <CardTitle className="text-base">{requirement.label}</CardTitle>
        <CardDescription>{requirement.description}</CardDescription>
      </CardHeader>
    </Card>
  )
}

function MeetingDetailScreen({
  note,
  onSettings,
}: {
  note: MeetingNote
  onSettings: () => void
}) {
  const run = note.processingRuns.at(-1)

  return (
    <div className="flex flex-col gap-6">
      <Card className="card-hairline">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StateBadge state={note.state} />
                {!note.providerConfigured && (
                  <Badge variant="outline">Provider needed</Badge>
                )}
              </div>
              <CardTitle className="mt-3 text-3xl">{note.title}</CardTitle>
              <CardDescription>
                {formatDate(note.createdAt)} ·{" "}
                {formatDuration(note.durationSeconds)} ·{" "}
                {note.participants.join(", ")}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline">
                <DownloadIcon data-icon="inline-start" />
                Export note
              </Button>
              {!note.providerConfigured && (
                <Button onClick={onSettings}>
                  <SettingsIcon data-icon="inline-start" />
                  Configure provider
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!note.providerConfigured && (
            <Alert>
              <CircleAlertIcon aria-hidden="true" />
              <AlertTitle>Recorded state, no verified provider</AlertTitle>
              <AlertDescription>
                Recording is saved locally. Configure an OpenAI-compatible base
                URL, API key, then Verify Provider to start transcription.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="summary" className="gap-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="recording">Raw Recording</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="runs">Processing Runs</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>
                Human-readable output generated from transcript chunks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {note.summary ? (
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
                  <div className="flex flex-col gap-4">
                    <p className="text-base leading-7">
                      {note.summary.overview}
                    </p>
                    <SummaryList
                      title="Decisions"
                      items={note.summary.decisions}
                    />
                    <SummaryList
                      title="Action Items"
                      items={note.summary.actionItems}
                    />
                  </div>
                  <SummaryList title="Risks" items={note.summary.risks} quiet />
                </div>
              ) : (
                <Empty className="border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <BotIcon aria-hidden="true" />
                    </EmptyMedia>
                    <EmptyTitle>No summary yet</EmptyTitle>
                    <EmptyDescription>
                      Summary appears after transcript chunks finish processing.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recording">
          <Card>
            <CardHeader>
              <CardTitle>Raw Recording</CardTitle>
              <CardDescription>
                Local browser recording blob attached to this Meeting Note.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {note.rawRecording ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Fact label="File" value={note.rawRecording.fileName} />
                  <Fact label="Type" value={note.rawRecording.mimeType} />
                  <Fact
                    label="Duration"
                    value={formatDuration(note.rawRecording.durationSeconds)}
                  />
                  <Fact
                    label="Size"
                    value={formatBytes(note.rawRecording.sizeBytes)}
                  />
                </div>
              ) : (
                <Empty className="border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <HardDriveIcon aria-hidden="true" />
                    </EmptyMedia>
                    <EmptyTitle>No raw recording</EmptyTitle>
                    <EmptyDescription>
                      Failed preflight means no timer and no raw recording blob.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transcript">
          <Card>
            <CardHeader>
              <CardTitle>Transcript chunks</CardTitle>
              <CardDescription>
                5-minute chunks, 10-second overlap, retry failed chunks twice.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {note.transcriptChunks.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {note.transcriptChunks.map((chunk) => (
                    <div
                      key={chunk.id}
                      className="rounded-2xl border bg-muted/25 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-medium">
                          Chunk {chunk.index}:{" "}
                          {formatTimestamp(chunk.startSecond)}-
                          {formatTimestamp(chunk.endSecond)}
                        </div>
                        <Badge
                          variant={
                            chunk.status === "failed"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {chunk.status} · retries {chunk.retryCount}
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {chunk.text || "Transcription in progress..."}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty className="border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FileTextIcon aria-hidden="true" />
                    </EmptyMedia>
                    <EmptyTitle>No transcript chunks</EmptyTitle>
                    <EmptyDescription>
                      Chunks appear after provider verification starts
                      processing.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="runs">
          <Card>
            <CardHeader>
              <CardTitle>Processing Runs</CardTitle>
              <CardDescription>
                Resume-safe log of transcription and summary attempts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {note.processingRuns.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Chunks</TableHead>
                      <TableHead>Summary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {note.processingRuns.map((processingRun) => (
                      <TableRow key={processingRun.id}>
                        <TableCell>
                          <Badge
                            variant={
                              processingRun.status === "failed"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {processingRun.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{processingRun.model}</TableCell>
                        <TableCell>
                          {processingRun.completedChunks}/
                          {processingRun.chunkCount}
                        </TableCell>
                        <TableCell className="min-w-72 whitespace-normal">
                          {processingRun.summary}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Empty className="border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <WorkflowIcon aria-hidden="true" />
                    </EmptyMedia>
                    <EmptyTitle>No processing runs</EmptyTitle>
                    <EmptyDescription>
                      Run history starts when transcription begins.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
            {run && (
              <CardFooter className="border-t bg-muted/35">
                <p className="text-sm text-muted-foreground">
                  Latest run started {formatDate(run.startedAt)} with{" "}
                  {run.model}.
                </p>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SettingsScreen() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="flex min-w-0 flex-col gap-6">
        <Card className="card-hairline">
          <CardHeader>
            <CardTitle>AI Provider</CardTitle>
            <CardDescription>
              User-configured OpenAI-compatible base URL and API key. Verify
              Provider calls the models endpoint and expects valid models.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="provider-base-url">Base URL</FieldLabel>
                <Input
                  id="provider-base-url"
                  defaultValue={mockProviderSettings.baseUrl}
                />
                <FieldDescription>
                  Example: https://api.openai.com/v1 or a compatible local
                  proxy.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="provider-api-key">API key</FieldLabel>
                <Input
                  id="provider-api-key"
                  type="password"
                  placeholder="Local credential saved"
                />
                <FieldDescription>
                  Stored by browser-controlled local persistence in later PRs.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="provider-model">
                  Default transcription model
                </FieldLabel>
                <Select defaultValue={mockProviderSettings.selectedModel}>
                  <SelectTrigger id="provider-model" className="w-full">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {mockProviderSettings.availableModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="summary-instructions">
                  Summary instructions
                </FieldLabel>
                <Textarea
                  id="summary-instructions"
                  defaultValue="Return concise overview, decisions, action items, and risks."
                />
                <FieldDescription>
                  Stored locally with provider settings in later PRs.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3 border-t bg-muted/35 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Verified{" "}
              {formatDate(
                mockProviderSettings.verifiedAt ?? new Date().toISOString()
              )}
              ; {mockProviderSettings.availableModels.length} models found.
            </p>
            <Button
              onClick={() =>
                toast.success("Provider models endpoint returned valid models.")
              }
            >
              <PlugZapIcon data-icon="inline-start" />
              Verify Provider
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Processing</CardTitle>
            <CardDescription>
              Chunked transcription requirements for reliable local resume.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="chunk-size">Chunk size</FieldLabel>
              <Input id="chunk-size" value="5 minutes" readOnly />
              <FieldDescription>
                Every chunk overlaps previous audio by 10 seconds.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="chunk-concurrency">Concurrency</FieldLabel>
              <Select defaultValue={String(mockProcessingSettings.concurrency)}>
                <SelectTrigger id="chunk-concurrency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {[1, 2, 3, 4].map((value) => (
                      <SelectItem key={value} value={String(value)}>
                        {value} worker{value > 1 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                Default 2; configurable from 1-4.
              </FieldDescription>
            </Field>
            <Field orientation="horizontal">
              <Switch id="resume-processing" defaultChecked />
              <FieldContent>
                <FieldLabel htmlFor="resume-processing">
                  Resume incomplete processing next launch
                </FieldLabel>
                <FieldDescription>
                  Required for interrupted browsers or provider throttling.
                </FieldDescription>
              </FieldContent>
            </Field>
            <Field orientation="horizontal">
              <Switch id="retry-chunks" defaultChecked />
              <FieldContent>
                <FieldLabel htmlFor="retry-chunks">
                  Retry failed chunks twice
                </FieldLabel>
                <FieldDescription>
                  Exponential backoff before marking a chunk failed.
                </FieldDescription>
              </FieldContent>
            </Field>
          </CardContent>
        </Card>
      </section>

      <aside className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Backup defaults</CardTitle>
            <CardDescription>
              Backups include credentials and raw recordings unless user
              excludes either checkbox.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BackupCheckboxes idPrefix="settings-backup" />
          </CardContent>
        </Card>
        <ProcessingPolicyCard />
      </aside>
    </div>
  )
}

function ImportExportDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import / Export backup</DialogTitle>
          <DialogDescription>
            Portable JSON backup for browser-controlled local data. SQLite files
            are not part of the portability story.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export</CardTitle>
              <CardDescription>
                Defaults include credentials and raw recordings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BackupCheckboxes idPrefix="export-backup" />
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                <DownloadIcon data-icon="inline-start" />
                Export backup
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Import</CardTitle>
              <CardDescription>
                Restore notes, settings, transcripts, summaries, and runs into
                this browser.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="backup-file">Backup file</FieldLabel>
                  <Input id="backup-file" type="file" />
                  <FieldDescription>
                    Prototype only; import engine lands after persistence layer.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <UploadIcon data-icon="inline-start" />
                Import backup
              </Button>
            </CardFooter>
          </Card>
        </div>

        <Separator />

        <DialogFooter showCloseButton>
          <Button
            variant="secondary"
            onClick={() => toast.info("Backup prototype only.")}
          >
            Preview backup manifest
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BackupCheckboxes({ idPrefix }: { idPrefix: string }) {
  const credentialsId = `${idPrefix}-include-credentials`
  const rawRecordingsId = `${idPrefix}-include-raw-recordings`

  return (
    <FieldSet>
      <FieldLegend>Export contents</FieldLegend>
      <FieldGroup data-slot="checkbox-group">
        <Field orientation="horizontal">
          <Checkbox
            id={credentialsId}
            defaultChecked={mockBackupOptions.includeCredentials}
          />
          <FieldContent>
            <FieldLabel htmlFor={credentialsId}>
              Include provider credentials
            </FieldLabel>
            <FieldDescription>
              Checked by default so restored browsers can continue processing.
            </FieldDescription>
          </FieldContent>
        </Field>
        <Field orientation="horizontal">
          <Checkbox
            id={rawRecordingsId}
            defaultChecked={mockBackupOptions.includeRawRecordings}
          />
          <FieldContent>
            <FieldLabel htmlFor={rawRecordingsId}>
              Include raw recordings
            </FieldLabel>
            <FieldDescription>
              Checked by default; clear this to create a smaller backup.
            </FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>
    </FieldSet>
  )
}

function ProcessingPolicyCard({ compact = false }: { compact?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chunk policy</CardTitle>
        <CardDescription>
          Required transcript processing contract for later engine PRs.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <CapabilityRow
          icon={TimerIcon}
          label="Chunk length"
          value={`${CHUNKED_TRANSCRIPTION_POLICY.chunkDurationSeconds / 60} min`}
        />
        <CapabilityRow
          icon={RotateCcwIcon}
          label="Overlap"
          value={`${CHUNKED_TRANSCRIPTION_POLICY.chunkOverlapSeconds} sec`}
        />
        <CapabilityRow
          icon={WorkflowIcon}
          label="Concurrency"
          value={`${CHUNKED_TRANSCRIPTION_POLICY.concurrency} default, 1-4 configurable`}
        />
        {!compact && (
          <CapabilityRow
            icon={ClockIcon}
            label="Resume"
            value="Incomplete processing resumes next launch"
          />
        )}
      </CardContent>
    </Card>
  )
}

function CapabilityRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MonitorIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border bg-muted/25 p-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-primary">
        <Icon className="size-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{value}</p>
      </div>
    </div>
  )
}

function SummaryList({
  items,
  quiet = false,
  title,
}: {
  items: string[]
  quiet?: boolean
  title: string
}) {
  return (
    <div className={cn("rounded-2xl border p-4", quiet && "bg-muted/25")}>
      <h3 className="font-semibold">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">None captured.</p>
      )}
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-muted/25 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-medium break-words">{value}</p>
    </div>
  )
}

function StateBadge({ state }: { state: MeetingNote["state"] }) {
  if (state === "ready") {
    return <Badge>Ready</Badge>
  }

  if (state === "processing") {
    return <Badge variant="secondary">Processing</Badge>
  }

  if (state === "failed") {
    return <Badge variant="destructive">Failed</Badge>
  }

  if (state === "archived") {
    return <Badge variant="outline">Archived</Badge>
  }

  if (state === "recorded") {
    return <Badge variant="secondary">Recorded</Badge>
  }

  return <Badge variant="outline">Draft</Badge>
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}

function formatDuration(totalSeconds: number) {
  if (totalSeconds === 0) {
    return "0m"
  }

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  return `${minutes}m`
}

function formatTimestamp(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

function formatBytes(bytes: number) {
  const megabytes = bytes / 1_000_000
  return `${megabytes.toFixed(0)} MB`
}

export default App
