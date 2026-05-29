import {
  ArrowLeftIcon,
  CalendarClockIcon,
  CheckIcon,
  Clock3Icon,
  FileTextIcon,
  ListChecksIcon,
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
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
      <div className="flex w-full flex-col gap-4">
        <Button
          type="button"
          variant="ghost"
          className="w-fit"
          onClick={onBack}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Back
        </Button>
        <Empty className="min-h-64 items-start justify-start border bg-card p-5 text-left">
          <EmptyHeader className="items-start text-left">
            <EmptyTitle>Note not found</EmptyTitle>
            <EmptyDescription>
              Select another workspace or return to notes.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  const actionItems = note.summary?.actionItems ?? []
  const decisions = note.summary?.decisions ?? []
  const risks = note.summary?.risks ?? []
  const hasDetailContent = Boolean(
    note.rawRecording ||
    note.summary?.overview ||
    actionItems.length > 0 ||
    decisions.length > 0 ||
    risks.length > 0
  )

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {note.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge state={note.state} />
            {note.participants.length > 0 && (
              <Badge variant="outline">
                <UsersIcon aria-hidden="true" />
                {formatParticipants(note.participants)}
              </Badge>
            )}
            {note.durationSeconds > 0 && (
              <Badge variant="outline">
                <Clock3Icon aria-hidden="true" />
                {formatDuration(note.durationSeconds)}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="ghost" onClick={onBack}>
            <ArrowLeftIcon data-icon="inline-start" />
            Back
          </Button>
          {note.state === "draft" && (
            <Button type="button" onClick={() => onResumeCapture(note)}>
              <PlayCircleIcon data-icon="inline-start" />
              Resume capture
            </Button>
          )}
        </div>
      </div>

      <div
        className={
          hasDetailContent
            ? "grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"
            : "grid max-w-sm gap-5"
        }
      >
        {hasDetailContent && (
          <div className="flex min-w-0 flex-col gap-4">
            <RecordingPlayer note={note} />

            {note.summary?.overview && (
              <DetailSection title="Summary" icon={SparklesIcon}>
                <p className="text-sm leading-6 text-muted-foreground">
                  {note.summary.overview}
                </p>
              </DetailSection>
            )}

            {actionItems.length > 0 && (
              <DetailListSection
                title="Action items"
                icon={CheckIcon}
                items={actionItems}
              />
            )}

            {decisions.length > 0 && (
              <DetailListSection
                title="Decisions"
                icon={ListChecksIcon}
                items={decisions}
              />
            )}

            {risks.length > 0 && (
              <DetailListSection
                title="Risks"
                icon={FileTextIcon}
                items={risks}
              />
            )}
          </div>
        )}

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
            </dl>
          </DetailSection>
        </aside>
      </div>
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
    <section className="border-t pt-4">
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
  items,
}: {
  title: string
  icon: typeof FileTextIcon
  items: string[]
}) {
  return (
    <DetailSection title={title} icon={icon}>
      <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-6 text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
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
