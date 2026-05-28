import { useMemo, useState, type ReactNode } from "react"
import {
  CalendarClockIcon,
  CheckIcon,
  CircleDashedIcon,
  Clock3Icon,
  FileTextIcon,
  FilterIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
  UsersIcon,
  XIcon,
} from "lucide-react"

import { RecordingPlayer } from "@/components/meeting-notes/recording-player"
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  applyMeetingNoteFilters,
  coerceMeetingNoteFilterValue,
  countActiveMeetingNoteFilterClauses,
  getDefaultMeetingNoteFilterValue,
  getMeetingNoteFilterField,
  getMeetingNoteFilterOperators,
  isMeetingNoteFilterMultiOperator,
  MEETING_NOTE_FILTER_FIELDS,
  MEETING_NOTE_STATE_LABELS,
  searchMeetingNotes,
  type MeetingNote,
  type MeetingNoteFilterClause,
  type MeetingNoteFilterField,
  type MeetingNoteFilterFieldKind,
  type MeetingNoteFilterGroup,
  type MeetingNoteFilterModel,
  type MeetingNoteFilterOperator,
  type MeetingNoteFilterScalar,
  type MeetingNoteFilterValue,
  type MeetingNoteState,
} from "@/lib/domain"
import { cn } from "@/lib/utils"

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

const compactDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

let filterIdCounter = 0

function createFilterId(prefix: string) {
  filterIdCounter += 1
  return `${prefix}-${filterIdCounter}`
}

function createFilterClause(
  field: MeetingNoteFilterField = "title",
  op: MeetingNoteFilterOperator = "equal"
): MeetingNoteFilterClause {
  return {
    id: createFilterId("clause"),
    field,
    op,
    value: getDefaultMeetingNoteFilterValue(field, op),
  }
}

function createFilterGroup(): MeetingNoteFilterGroup {
  return {
    id: createFilterId("group"),
    clauses: [createFilterClause()],
  }
}

const emptyFilterModel = (): MeetingNoteFilterModel => ({
  groups: [createFilterGroup()],
})

type MeetingNotesViewProps = {
  notes: MeetingNote[]
  isCreatingNote?: boolean
  onCreateNote: () => void
  onResumeCapture: (note: MeetingNote) => void
}

export function MeetingNotesView({
  notes,
  isCreatingNote = false,
  onCreateNote,
  onResumeCapture,
}: MeetingNotesViewProps) {
  const [query, setQuery] = useState("")
  const [filterModel, setFilterModel] = useState(emptyFilterModel)
  const [selectedNote, setSelectedNote] = useState<MeetingNote | null>(null)

  const filteredNotes = useMemo(() => {
    return searchMeetingNotes(
      applyMeetingNoteFilters(notes, filterModel),
      query
    )
  }, [filterModel, notes, query])

  const activeFilterCount = countActiveMeetingNoteFilterClauses(filterModel)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Meeting Notes
        </h1>
        <Button
          type="button"
          disabled={isCreatingNote}
          onClick={onCreateNote}
          className="rounded-none"
        >
          <PlusIcon data-icon="inline-start" />
          {isCreatingNote ? "Creating..." : "Create"}
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Field className="max-w-xl min-w-0 flex-1">
          <FieldLabel htmlFor="meeting-notes-search" className="sr-only">
            Search meeting notes
          </FieldLabel>
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="meeting-notes-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, status, participants, summary..."
              className="rounded-none pl-9"
            />
          </div>
        </Field>
        <FilterBuilderPopover
          model={filterModel}
          activeFilterCount={activeFilterCount}
          onChange={setFilterModel}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-56">Title</TableHead>
            <TableHead>Date / time</TableHead>
            <TableHead>Participants</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action items</TableHead>
            <TableHead className="min-w-72">Summary</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => (
              <MeetingNoteRow
                key={note.id}
                note={note}
                onSelect={() => setSelectedNote(note)}
                onResumeCapture={() => onResumeCapture(note)}
              />
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-32 text-center text-sm text-muted-foreground"
              >
                No meeting notes yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <MeetingNoteDetailSheet
        note={selectedNote}
        open={selectedNote !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedNote(null)
          }
        }}
      />
    </div>
  )
}

function MeetingNoteRow({
  note,
  onSelect,
  onResumeCapture,
}: {
  note: MeetingNote
  onSelect: () => void
  onResumeCapture: () => void
}) {
  const isDraft = note.state === "draft"

  return (
    <TableRow>
      <TableCell className="max-w-72 whitespace-normal">
        <Button
          variant="link"
          className="h-auto justify-start p-0 text-left font-medium whitespace-normal"
          onClick={isDraft ? onResumeCapture : onSelect}
          aria-label={
            isDraft
              ? `Resume capture for ${note.title}`
              : `Open details for ${note.title}`
          }
        >
          <span className="flex flex-col items-start gap-1">
            <span>{note.title}</span>
            {isDraft && (
              <span className="text-xs font-normal text-muted-foreground">
                Resume capture
              </span>
            )}
          </span>
        </Button>
      </TableCell>
      <TableCell>{formatCompactDate(note.createdAt)}</TableCell>
      <TableCell className="max-w-64 whitespace-normal">
        {formatParticipants(note.participants)}
      </TableCell>
      <TableCell>{formatDuration(note.durationSeconds)}</TableCell>
      <TableCell>
        <StatusBadge state={note.state} />
      </TableCell>
      <TableCell>{note.summary?.actionItems.length ?? 0}</TableCell>
      <TableCell className="max-w-96 whitespace-normal text-muted-foreground">
        {note.summary?.overview ?? "No generated summary yet"}
      </TableCell>
    </TableRow>
  )
}

function FilterBuilderPopover({
  model,
  activeFilterCount,
  onChange,
}: {
  model: MeetingNoteFilterModel
  activeFilterCount: number
  onChange: (model: MeetingNoteFilterModel) => void
}) {
  const updateGroup = (
    groupId: string,
    update: (group: MeetingNoteFilterGroup) => MeetingNoteFilterGroup
  ) => {
    onChange({
      groups: model.groups.map((group) =>
        group.id === groupId ? update(group) : group
      ),
    })
  }

  const addGroup = () => {
    onChange({ groups: [...model.groups, createFilterGroup()] })
  }

  const removeGroup = (groupId: string) => {
    const groups = model.groups.filter((group) => group.id !== groupId)
    onChange({ groups: groups.length > 0 ? groups : [createFilterGroup()] })
  }

  const addClause = (groupId: string) => {
    updateGroup(groupId, (group) => ({
      ...group,
      clauses: [...group.clauses, createFilterClause()],
    }))
  }

  const removeClause = (groupId: string, clauseId: string) => {
    updateGroup(groupId, (group) => {
      const clauses = group.clauses.filter((clause) => clause.id !== clauseId)
      return {
        ...group,
        clauses: clauses.length > 0 ? clauses : [createFilterClause()],
      }
    })
  }

  const updateClause = (
    groupId: string,
    clauseId: string,
    update: (clause: MeetingNoteFilterClause) => MeetingNoteFilterClause
  ) => {
    updateGroup(groupId, (group) => ({
      ...group,
      clauses: group.clauses.map((clause) =>
        clause.id === clauseId ? update(clause) : clause
      ),
    }))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="rounded-none">
          <FilterIcon data-icon="inline-start" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary">{activeFilterCount}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="max-h-[calc(100vh-7rem)] w-[min(58rem,calc(100vw-2rem))] overflow-y-auto p-0"
      >
        <PopoverHeader className="p-4 pb-0">
          <PopoverTitle>Filter builder</PopoverTitle>
          <PopoverDescription>
            Groups are joined with OR. Clauses inside each group are joined with
            AND.
          </PopoverDescription>
        </PopoverHeader>

        <div className="flex flex-col gap-4 p-4">
          {model.groups.map((group, groupIndex) => (
            <FilterGroupEditor
              key={group.id}
              group={group}
              groupIndex={groupIndex}
              canRemoveGroup={model.groups.length > 1}
              onAddClause={() => addClause(group.id)}
              onRemoveGroup={() => removeGroup(group.id)}
              onRemoveClause={(clauseId) => removeClause(group.id, clauseId)}
              onUpdateClause={(clauseId, update) =>
                updateClause(group.id, clauseId, update)
              }
            />
          ))}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" onClick={addGroup}>
              <PlusIcon data-icon="inline-start" />
              Add OR group
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onChange(emptyFilterModel())}
            >
              Clear filters
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function FilterGroupEditor({
  group,
  groupIndex,
  canRemoveGroup,
  onAddClause,
  onRemoveGroup,
  onRemoveClause,
  onUpdateClause,
}: {
  group: MeetingNoteFilterGroup
  groupIndex: number
  canRemoveGroup: boolean
  onAddClause: () => void
  onRemoveGroup: () => void
  onRemoveClause: (clauseId: string) => void
  onUpdateClause: (
    clauseId: string,
    update: (clause: MeetingNoteFilterClause) => MeetingNoteFilterClause
  ) => void
}) {
  return (
    <Card className="shadow-none">
      <CardHeader className="gap-3 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="font-heading text-base">
              OR group {groupIndex + 1}
            </CardTitle>
            <CardDescription>
              Every clause in this group must match.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddClause}
            >
              <PlusIcon data-icon="inline-start" />
              Add AND clause
            </Button>
            {canRemoveGroup && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onRemoveGroup}
                aria-label={`Remove OR group ${groupIndex + 1}`}
              >
                <XIcon />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-3 pt-0">
        {group.clauses.map((clause, clauseIndex) => (
          <FilterClauseEditor
            key={clause.id}
            clause={clause}
            clauseIndex={clauseIndex}
            onRemove={() => onRemoveClause(clause.id)}
            onChange={(nextClause) =>
              onUpdateClause(clause.id, () => nextClause)
            }
          />
        ))}
      </CardContent>
    </Card>
  )
}

function FilterClauseEditor({
  clause,
  clauseIndex,
  onRemove,
  onChange,
}: {
  clause: MeetingNoteFilterClause
  clauseIndex: number
  onRemove: () => void
  onChange: (clause: MeetingNoteFilterClause) => void
}) {
  const field = getMeetingNoteFilterField(clause.field)
  const operators = getMeetingNoteFilterOperators(clause.field)
  const fieldControlId = `${clause.id}-field`
  const operatorControlId = `${clause.id}-operator`
  const valueControlId = `${clause.id}-value`

  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="grid gap-3 lg:grid-cols-[minmax(10rem,0.9fr)_minmax(10rem,0.8fr)_minmax(14rem,1.4fr)_auto] lg:items-end">
        <Field>
          <FieldLabel htmlFor={fieldControlId}>Field</FieldLabel>
          <Select
            value={clause.field}
            onValueChange={(value) => {
              const nextField = value as MeetingNoteFilterField
              const nextOperator =
                getMeetingNoteFilterOperators(nextField)[0].id
              onChange({
                ...clause,
                field: nextField,
                op: nextOperator,
                value: getDefaultMeetingNoteFilterValue(
                  nextField,
                  nextOperator
                ),
              })
            }}
          >
            <SelectTrigger id={fieldControlId} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {MEETING_NOTE_FILTER_FIELDS.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor={operatorControlId}>Operator</FieldLabel>
          <Select
            value={clause.op}
            onValueChange={(value) => {
              const nextOperator = value as MeetingNoteFilterOperator
              onChange({
                ...clause,
                op: nextOperator,
                value: getDefaultMeetingNoteFilterValue(
                  clause.field,
                  nextOperator
                ),
              })
            }}
          >
            <SelectTrigger id={operatorControlId} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {operators.map((operator) => (
                  <SelectItem key={operator.id} value={operator.id}>
                    {operator.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor={valueControlId}>Value</FieldLabel>
          <FilterValueInput
            id={valueControlId}
            clause={clause}
            onValueChange={(value) =>
              onChange({
                ...clause,
                value: coerceMeetingNoteFilterValue(
                  clause.field,
                  clause.op,
                  value
                ),
              })
            }
          />
        </Field>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label={`Remove clause ${clauseIndex + 1} for ${field.label}`}
        >
          <XIcon />
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{field.description}</p>
    </div>
  )
}

function FilterValueInput({
  id,
  clause,
  onValueChange,
}: {
  id: string
  clause: MeetingNoteFilterClause
  onValueChange: (value: MeetingNoteFilterValue) => void
}) {
  const field = getMeetingNoteFilterField(clause.field)

  if (clause.op === "exists" || clause.op === "notExists") {
    const optionLabels = getExistsBooleanOptionLabels(clause.op)

    return (
      <Select
        value={String(clause.value === true)}
        onValueChange={(value) => onValueChange(value === "true")}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="true">{optionLabels.trueLabel}</SelectItem>
            <SelectItem value="false">{optionLabels.falseLabel}</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }

  if (isMeetingNoteFilterMultiOperator(clause.op)) {
    if (field.kind === "select" && field.options) {
      return (
        <PredefinedMultiSelect
          id={id}
          options={field.options}
          value={toStringArray(clause.value)}
          onChange={onValueChange}
        />
      )
    }

    return (
      <TokenValueInput
        id={id}
        kind={field.kind}
        value={clause.value}
        onChange={onValueChange}
      />
    )
  }

  if (field.kind === "select" && field.options) {
    return (
      <Select
        value={String(clause.value)}
        onValueChange={(value) => onValueChange(value)}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {field.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }

  if (field.kind === "boolean") {
    return (
      <Select
        value={String(clause.value === true)}
        onValueChange={(value) => onValueChange(value === "true")}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="true">true</SelectItem>
            <SelectItem value="false">false</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }

  if (field.kind === "number") {
    return (
      <Input
        id={id}
        type="number"
        value={
          typeof clause.value === "number" || typeof clause.value === "string"
            ? String(clause.value)
            : ""
        }
        onChange={(event) => onValueChange(event.target.value)}
      />
    )
  }

  if (field.kind === "timestamp") {
    return (
      <Input
        id={id}
        type="datetime-local"
        value={toDatetimeLocalValue(clause.value)}
        onChange={(event) =>
          onValueChange(fromDatetimeLocalValue(event.target.value))
        }
      />
    )
  }

  return (
    <Input
      id={id}
      value={typeof clause.value === "string" ? clause.value : ""}
      onChange={(event) => onValueChange(event.target.value)}
      placeholder="Type text"
    />
  )
}

function getExistsBooleanOptionLabels(operator: MeetingNoteFilterOperator) {
  if (operator === "exists") {
    return {
      trueLabel: "true - field exists",
      falseLabel: "false - field is missing",
    }
  }

  return {
    trueLabel: "true - field is missing",
    falseLabel: "false - field exists",
  }
}

function PredefinedMultiSelect({
  id,
  options,
  value,
  onChange,
}: {
  id: string
  options: Array<{ value: string; label: string }>
  value: string[]
  onChange: (value: MeetingNoteFilterValue) => void
}) {
  const selectedLabels = options
    .filter((option) => value.includes(option.value))
    .map((option) => option.label)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className="w-full justify-between"
        >
          <span className="truncate">
            {selectedLabels.length > 0
              ? selectedLabels.join(", ")
              : "Select values"}
          </span>
          <CheckIcon data-icon="inline-end" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          {options.map((option) => {
            const checked = value.includes(option.value)
            return (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={checked}
                onCheckedChange={(nextChecked) => {
                  onChange(
                    nextChecked
                      ? [...value, option.value]
                      : value.filter((item) => item !== option.value)
                  )
                }}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function TokenValueInput({
  id,
  kind,
  value,
  onChange,
}: {
  id: string
  kind: MeetingNoteFilterFieldKind
  value: MeetingNoteFilterValue
  onChange: (value: MeetingNoteFilterValue) => void
}) {
  const values = Array.isArray(value) ? value : []
  const [draft, setDraft] = useState("")

  const addDraftValue = () => {
    const nextValue = parseDraftValue(draft, kind)

    if (nextValue === null) {
      return
    }

    onChange([...values, nextValue])
    setDraft("")
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          id={id}
          type={
            kind === "number"
              ? "number"
              : kind === "timestamp"
                ? "datetime-local"
                : "text"
          }
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              addDraftValue()
            }
          }}
          placeholder="Enter value, then press Enter"
        />
        <Button
          type="button"
          variant="outline"
          onClick={addDraftValue}
          aria-label="Add value to filter"
        >
          Add
        </Button>
      </div>

      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((item, index) => (
            <Badge key={`${String(item)}-${index}`} variant="secondary">
              {formatFilterToken(item, kind)}
              <button
                type="button"
                aria-label={`Remove ${String(item)}`}
                onClick={() =>
                  onChange(values.filter((_, itemIndex) => itemIndex !== index))
                }
              >
                <XIcon aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

function MeetingNoteDetailSheet({
  note,
  open,
  onOpenChange,
}: {
  note: MeetingNote | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{note?.title ?? "Meeting note details"}</SheetTitle>
          <SheetDescription>
            {note
              ? `${formatDateTime(note.createdAt)} - ${formatDuration(note.durationSeconds)}`
              : "Select a meeting note title to inspect details."}
          </SheetDescription>
        </SheetHeader>

        {note && (
          <div className="flex flex-col gap-4 px-4 pb-4">
            <div className="flex flex-wrap gap-2">
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

            <RecordingPlayer note={note} />

            <DetailSection title="Summary" icon={SparklesIcon}>
              <p className="text-sm text-muted-foreground">
                {note.summary?.overview ?? "No generated summary yet."}
              </p>
            </DetailSection>

            <DetailSection title="Action Items" icon={CheckIcon}>
              {note.summary?.actionItems.length ? (
                <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-muted-foreground">
                  {note.summary.actionItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No action items recorded.
                </p>
              )}
            </DetailSection>

            <DetailSection title="Timeline" icon={CalendarClockIcon}>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
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
          </div>
        )}
      </SheetContent>
    </Sheet>
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
    <section className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center gap-2 font-heading text-sm font-medium">
        <Icon aria-hidden="true" />
        {title}
      </div>
      {children}
    </section>
  )
}

function DetailTerm({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}

function StatusBadge({ state }: { state: MeetingNoteState }) {
  return (
    <Badge
      className={cn(state === "ready" && "bg-primary text-primary-foreground")}
      variant={getStatusVariant(state)}
    >
      {state === "processing" && <CircleDashedIcon aria-hidden="true" />}
      {MEETING_NOTE_STATE_LABELS[state]}
    </Badge>
  )
}

function getStatusVariant(state: MeetingNoteState) {
  if (state === "failed") {
    return "destructive" as const
  }

  if (state === "ready") {
    return "default" as const
  }

  if (state === "archived") {
    return "outline" as const
  }

  return "secondary" as const
}

function formatParticipants(participants: string[]) {
  if (participants.length === 0) {
    return "No participants"
  }

  return participants.join(", ")
}

function formatDuration(durationSeconds: number) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return "0 min"
  }

  const hours = Math.floor(durationSeconds / 3600)
  const minutes = Math.floor((durationSeconds % 3600) / 60)

  if (hours > 0) {
    return `${hours} hr ${minutes} min`
  }

  return `${minutes} min`
}

function formatCompactDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "Unknown"
    : compactDateFormatter.format(date)
}

function formatDateTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "Unknown"
    : dateTimeFormatter.format(date)
}

function toDatetimeLocalValue(value: MeetingNoteFilterValue) {
  if (typeof value !== "string" || !value) {
    return ""
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const offsetDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000
  )
  return offsetDate.toISOString().slice(0, 16)
}

function fromDatetimeLocalValue(value: string) {
  return value ? new Date(value).toISOString() : ""
}

function toStringArray(value: MeetingNoteFilterValue) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map(String)
}

function parseDraftValue(
  draft: string,
  kind: MeetingNoteFilterFieldKind
): MeetingNoteFilterScalar | null {
  if (!draft.trim()) {
    return null
  }

  if (kind === "number") {
    const numberValue = Number.parseFloat(draft)
    return Number.isFinite(numberValue) ? numberValue : null
  }

  if (kind === "timestamp") {
    return fromDatetimeLocalValue(draft)
  }

  return draft.trim()
}

function formatFilterToken(
  value: MeetingNoteFilterScalar,
  kind: MeetingNoteFilterFieldKind
) {
  if (kind === "timestamp" && typeof value === "string") {
    return formatDateTime(value)
  }

  return String(value)
}
