import {
  ArrowLeftIcon,
  CalendarClockIcon,
  CheckIcon,
  Clock3Icon,
  FileTextIcon,
  ListChecksIcon,
  MicIcon,
  PlayCircleIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react"
import type { ReactNode } from "react"

import { RecordingPlayer } from "@/components/meeting-notes/recording-player"
import {
  formatDateTime,
  formatDuration,
  formatParticipants,
} from "@/components/meeting-notes/meeting-note-format"
import { StatusBadge } from "@/components/meeting-notes/meeting-note-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import type { MeetingNote } from "@/lib/domain"

export function MeetingNoteDetailPage({
  note,
  onBack,
  onResumeCapture,
}: {
  note: MeetingNote | null
  onBack: () => void
  onResumeCapture: (note: MeetingNote) => void
}) {
  if (!note) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <Button
          type="button"
          variant="ghost"
          className="w-fit"
          onClick={onBack}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Back to meetings
        </Button>
        <Empty className="min-h-96 border bg-card">
          <EmptyHeader>
            <EmptyTitle>Meeting note not found</EmptyTitle>
            <EmptyDescription>
              This note is not stored in the selected local workspace.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  const actionItems = note.summary?.actionItems ?? []
  const decisions = note.summary?.decisions ?? []
  const risks = note.summary?.risks ?? []

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <Button type="button" variant="ghost" className="w-fit" onClick={onBack}>
        <ArrowLeftIcon data-icon="inline-start" />
        Back to meetings
      </Button>

      <Card className="overflow-hidden border-border/80 bg-card/95 shadow-sm">
        <CardHeader className="gap-4 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge state={note.state} />
                <Badge variant="outline">
                  <UsersIcon aria-hidden="true" />
                  {formatParticipants(note.participants)}
                </Badge>
                <Badge variant="outline">
                  <Clock3Icon aria-hidden="true" />
                  {formatDuration(note.durationSeconds)}
                </Badge>
              </div>
              <div>
                <CardTitle>
                  <h1 className="font-heading text-2xl tracking-tight sm:text-3xl">
                    {note.title}
                  </h1>
                </CardTitle>
                <CardDescription className="mt-2 max-w-3xl text-base">
                  {note.summary?.overview ??
                    "Capture is saved locally first. Summary details appear here when processing is ready."}
                </CardDescription>
              </div>
            </div>

            {note.state === "draft" && (
              <Button type="button" onClick={() => onResumeCapture(note)}>
                <PlayCircleIcon data-icon="inline-start" />
                Resume capture
              </Button>
            )}
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex min-w-0 flex-col gap-5">
            <RecordingPlayer note={note} />

            <DetailSection title="Summary" icon={SparklesIcon}>
              <p className="text-sm leading-6 text-muted-foreground">
                {note.summary?.overview ?? "No generated summary yet."}
              </p>
            </DetailSection>

            <DetailListSection
              title="Action items"
              icon={CheckIcon}
              emptyText="No action items recorded."
              items={actionItems}
            />

            <DetailListSection
              title="Decisions"
              icon={ListChecksIcon}
              emptyText="No decisions recorded."
              items={decisions}
            />

            <DetailListSection
              title="Risks"
              icon={FileTextIcon}
              emptyText="No risks recorded."
              items={risks}
            />
          </div>

          <aside className="flex flex-col gap-4">
            <DetailSection title="Timeline" icon={CalendarClockIcon}>
              <dl className="grid gap-3 text-sm">
                <DetailTerm
                  label="Created"
                  value={formatDateTime(note.createdAt)}
                />
                <DetailTerm
                  label="Updated"
                  value={formatDateTime(note.updatedAt)}
                />
                <DetailTerm
                  label="Transcript chunks"
                  value={String(note.transcriptChunks.length)}
                />
                <DetailTerm
                  label="Processing runs"
                  value={String(note.processingRuns.length)}
                />
              </dl>
            </DetailSection>

            <DetailSection title="Local recording" icon={MicIcon}>
              <dl className="grid gap-3 text-sm">
                <DetailTerm
                  label="Recording"
                  value={
                    note.rawRecording
                      ? note.rawRecording.fileName
                      : "Not captured"
                  }
                />
                <DetailTerm
                  label="Provider"
                  value={
                    note.providerConfigured ? "Configured" : "Not configured"
                  }
                />
              </dl>
            </DetailSection>
          </aside>
        </CardContent>
      </Card>
    </div>
  )
}

function DetailSection({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: typeof FileTextIcon
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border bg-background/70 p-4 shadow-sm shadow-foreground/5">
      <div className="mb-3 flex items-center gap-2 font-heading text-sm font-medium [&_svg]:size-4 [&_svg]:text-muted-foreground">
        <Icon aria-hidden="true" />
        {title}
      </div>
      {children}
    </section>
  )
}

function DetailListSection({
  title,
  icon,
  emptyText,
  items,
}: {
  title: string
  icon: typeof FileTextIcon
  emptyText: string
  items: string[]
}) {
  return (
    <DetailSection title={title} icon={icon}>
      {items.length > 0 ? (
        <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-6 text-muted-foreground">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      )}
    </DetailSection>
  )
}

function DetailTerm({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  )
}
