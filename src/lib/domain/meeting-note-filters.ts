import type { MeetingNote, MeetingNoteState } from "./meeting-note"

export const MEETING_NOTE_STATES = [
  "draft",
  "recorded",
  "processing",
  "ready",
  "failed",
  "archived",
] as const satisfies MeetingNoteState[]

export const MEETING_NOTE_STATE_LABELS: Record<MeetingNoteState, string> = {
  draft: "Draft",
  recorded: "Recorded",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
  archived: "Archived",
}

export type MeetingNoteFilterField =
  | "title"
  | "state"
  | "createdAt"
  | "updatedAt"
  | "participants"
  | "durationSeconds"
  | "actionItems"
  | "summary"
  | "providerConfigured"

export type MeetingNoteFilterFieldKind =
  | "string"
  | "number"
  | "timestamp"
  | "select"
  | "boolean"

export type MeetingNoteFilterOperator =
  | "equal"
  | "notEqual"
  | "greaterThan"
  | "lessThan"
  | "greaterThanOrEqual"
  | "lessThanOrEqual"
  | "in"
  | "notIn"
  | "exists"
  | "notExists"

export type MeetingNoteFilterScalar = string | number | boolean
export type MeetingNoteFilterValue =
  | MeetingNoteFilterScalar
  | MeetingNoteFilterScalar[]

export type MeetingNoteFilterClause = {
  id: string
  field: MeetingNoteFilterField
  op: MeetingNoteFilterOperator
  value: MeetingNoteFilterValue
}

export type MeetingNoteFilterGroup = {
  id: string
  clauses: MeetingNoteFilterClause[]
}

export type MeetingNoteFilterModel = {
  groups: MeetingNoteFilterGroup[]
}

export type MeetingNoteFilterOption = {
  value: string
  label: string
}

export type MeetingNoteFilterFieldMetadata = {
  id: MeetingNoteFilterField
  label: string
  kind: MeetingNoteFilterFieldKind
  description: string
  options?: MeetingNoteFilterOption[]
}

export type MeetingNoteFilterOperatorMetadata = {
  id: MeetingNoteFilterOperator
  label: string
}

export const MEETING_NOTE_FILTER_FIELDS = [
  {
    id: "title",
    label: "Title",
    kind: "string",
    description: "Meeting title text",
  },
  {
    id: "state",
    label: "Status",
    kind: "select",
    description: "Current meeting note workflow status",
    options: MEETING_NOTE_STATES.map((state) => ({
      value: state,
      label: MEETING_NOTE_STATE_LABELS[state],
    })),
  },
  {
    id: "createdAt",
    label: "Date / time",
    kind: "timestamp",
    description: "Meeting note creation timestamp",
  },
  {
    id: "updatedAt",
    label: "Updated",
    kind: "timestamp",
    description: "Last local update timestamp",
  },
  {
    id: "participants",
    label: "Participants",
    kind: "string",
    description: "Participant names",
  },
  {
    id: "durationSeconds",
    label: "Duration",
    kind: "number",
    description: "Meeting duration in seconds",
  },
  {
    id: "actionItems",
    label: "Action items",
    kind: "number",
    description: "Count of summary action items",
  },
  {
    id: "summary",
    label: "Summary",
    kind: "string",
    description: "Generated summary overview",
  },
  {
    id: "providerConfigured",
    label: "Provider configured",
    kind: "boolean",
    description: "Whether local provider settings exist for this note",
  },
] as const satisfies MeetingNoteFilterFieldMetadata[]

export const MEETING_NOTE_FILTER_OPERATORS = [
  { id: "equal", label: "equal" },
  { id: "notEqual", label: "not equal" },
  { id: "greaterThan", label: "greater than" },
  { id: "lessThan", label: "less than" },
  { id: "greaterThanOrEqual", label: ">=" },
  { id: "lessThanOrEqual", label: "<=" },
  { id: "in", label: "in" },
  { id: "notIn", label: "not in" },
  { id: "exists", label: "exists" },
  { id: "notExists", label: "not exists" },
] as const satisfies MeetingNoteFilterOperatorMetadata[]

const TEXT_OPERATORS: MeetingNoteFilterOperator[] = [
  "equal",
  "notEqual",
  "in",
  "notIn",
  "exists",
  "notExists",
]

const ORDERED_OPERATORS: MeetingNoteFilterOperator[] = [
  "equal",
  "notEqual",
  "greaterThan",
  "lessThan",
  "greaterThanOrEqual",
  "lessThanOrEqual",
  "in",
  "notIn",
  "exists",
  "notExists",
]

const SELECT_OPERATORS: MeetingNoteFilterOperator[] = [
  "equal",
  "notEqual",
  "in",
  "notIn",
  "exists",
  "notExists",
]

const BOOLEAN_OPERATORS: MeetingNoteFilterOperator[] = [
  "equal",
  "notEqual",
  "exists",
  "notExists",
]

const MULTI_VALUE_OPERATORS = new Set<MeetingNoteFilterOperator>([
  "in",
  "notIn",
])

export function getMeetingNoteFilterField(field: MeetingNoteFilterField) {
  return (
    MEETING_NOTE_FILTER_FIELDS.find((metadata) => metadata.id === field) ??
    MEETING_NOTE_FILTER_FIELDS[0]
  )
}

export function getMeetingNoteFilterOperator(
  operator: MeetingNoteFilterOperator
) {
  return (
    MEETING_NOTE_FILTER_OPERATORS.find(
      (metadata) => metadata.id === operator
    ) ?? MEETING_NOTE_FILTER_OPERATORS[0]
  )
}

export function getMeetingNoteFilterOperators(field: MeetingNoteFilterField) {
  const metadata = getMeetingNoteFilterField(field)
  const allowed =
    metadata.kind === "number" || metadata.kind === "timestamp"
      ? ORDERED_OPERATORS
      : metadata.kind === "select"
        ? SELECT_OPERATORS
        : metadata.kind === "boolean"
          ? BOOLEAN_OPERATORS
          : TEXT_OPERATORS

  return allowed.map(getMeetingNoteFilterOperator)
}

export function isMeetingNoteFilterMultiOperator(
  operator: MeetingNoteFilterOperator
) {
  return MULTI_VALUE_OPERATORS.has(operator)
}

export function getDefaultMeetingNoteFilterValue(
  field: MeetingNoteFilterField,
  operator: MeetingNoteFilterOperator
): MeetingNoteFilterValue {
  const metadata = getMeetingNoteFilterField(field)

  if (operator === "exists" || operator === "notExists") {
    return true
  }

  if (isMeetingNoteFilterMultiOperator(operator)) {
    return []
  }

  if (metadata.kind === "number") {
    return ""
  }

  if (metadata.kind === "boolean") {
    return true
  }

  if (metadata.kind === "select") {
    return metadata.options?.[0]?.value ?? ""
  }

  return ""
}

export function coerceMeetingNoteFilterValue(
  field: MeetingNoteFilterField,
  operator: MeetingNoteFilterOperator,
  value: MeetingNoteFilterValue
): MeetingNoteFilterValue {
  const metadata = getMeetingNoteFilterField(field)

  if (operator === "exists" || operator === "notExists") {
    return coerceBoolean(value)
  }

  if (isMeetingNoteFilterMultiOperator(operator)) {
    const values = Array.isArray(value) ? value : [value]
    return values
      .map((item) => coerceScalar(metadata.kind, item))
      .filter(hasFilterValue)
  }

  return coerceScalar(metadata.kind, value)
}

export function countActiveMeetingNoteFilterClauses(
  model: MeetingNoteFilterModel
) {
  return model.groups.reduce(
    (count, group) =>
      count +
      group.clauses.filter((clause) => isActiveFilterClause(clause)).length,
    0
  )
}

export function applyMeetingNoteFilters(
  notes: MeetingNote[],
  model: MeetingNoteFilterModel
) {
  const activeGroups = model.groups
    .map((group) => group.clauses.filter(isActiveFilterClause))
    .filter((clauses) => clauses.length > 0)

  if (activeGroups.length === 0) {
    return notes
  }

  return notes.filter((note) =>
    activeGroups.some((clauses) =>
      clauses.every((clause) => doesMeetingNoteMatchClause(note, clause))
    )
  )
}

export function searchMeetingNotes(notes: MeetingNote[], query: string) {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return notes
  }

  return notes.filter((note) =>
    getMeetingNoteSearchText(note).includes(normalizedQuery)
  )
}

function isActiveFilterClause(clause: MeetingNoteFilterClause) {
  const value = coerceMeetingNoteFilterValue(
    clause.field,
    clause.op,
    clause.value
  )

  if (clause.op === "exists" || clause.op === "notExists") {
    return typeof value === "boolean"
  }

  if (isMeetingNoteFilterMultiOperator(clause.op)) {
    return Array.isArray(value) && value.some(hasFilterValue)
  }

  return hasFilterValue(value)
}

function doesMeetingNoteMatchClause(
  note: MeetingNote,
  clause: MeetingNoteFilterClause
) {
  const metadata = getMeetingNoteFilterField(clause.field)
  const actual = getMeetingNoteFilterValue(note, clause.field)
  const expected = coerceMeetingNoteFilterValue(
    clause.field,
    clause.op,
    clause.value
  )

  if (clause.op === "exists") {
    return hasFilterValue(actual) === expected
  }

  if (clause.op === "notExists") {
    return !hasFilterValue(actual) === expected
  }

  if (clause.op === "equal") {
    return includesEqualValue(actual, expected, metadata.kind)
  }

  if (clause.op === "notEqual") {
    return !includesEqualValue(actual, expected, metadata.kind)
  }

  if (clause.op === "in") {
    return includesAnyValue(actual, expected, metadata.kind)
  }

  if (clause.op === "notIn") {
    return !includesAnyValue(actual, expected, metadata.kind)
  }

  const actualComparable = toComparable(actual, metadata.kind)
  const expectedComparable = toComparable(expected, metadata.kind)

  if (actualComparable === null || expectedComparable === null) {
    return false
  }

  if (clause.op === "greaterThan") {
    return actualComparable > expectedComparable
  }

  if (clause.op === "lessThan") {
    return actualComparable < expectedComparable
  }

  if (clause.op === "greaterThanOrEqual") {
    return actualComparable >= expectedComparable
  }

  return actualComparable <= expectedComparable
}

function getMeetingNoteFilterValue(
  note: MeetingNote,
  field: MeetingNoteFilterField
): MeetingNoteFilterValue | undefined {
  switch (field) {
    case "title":
      return note.title
    case "state":
      return note.state
    case "createdAt":
      return note.createdAt
    case "updatedAt":
      return note.updatedAt
    case "participants":
      return note.participants
    case "durationSeconds":
      return note.durationSeconds
    case "actionItems":
      return note.summary?.actionItems.length ?? 0
    case "summary":
      return note.summary?.overview
    case "providerConfigured":
      return note.providerConfigured
  }
}

function getMeetingNoteSearchText(note: MeetingNote) {
  return [
    note.title,
    MEETING_NOTE_STATE_LABELS[note.state],
    note.createdAt,
    note.updatedAt,
    note.participants.join(" "),
    String(note.durationSeconds),
    note.summary?.overview,
    note.summary?.decisions.join(" "),
    note.summary?.actionItems.join(" "),
    note.summary?.risks.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

function includesAnyValue(
  actual: MeetingNoteFilterValue | undefined,
  expected: MeetingNoteFilterValue,
  kind: MeetingNoteFilterFieldKind
) {
  const actualValues = Array.isArray(actual) ? actual : [actual]
  const expectedValues = Array.isArray(expected) ? expected : [expected]

  return actualValues.some((actualValue) =>
    expectedValues.some((expectedValue) =>
      areFilterValuesEqual(actualValue, expectedValue, kind)
    )
  )
}

function includesEqualValue(
  actual: MeetingNoteFilterValue | undefined,
  expected: MeetingNoteFilterValue,
  kind: MeetingNoteFilterFieldKind
) {
  if (Array.isArray(actual)) {
    return actual.some((actualValue) =>
      areFilterValuesEqual(actualValue, expected, kind)
    )
  }

  return areFilterValuesEqual(actual, expected, kind)
}

function areFilterValuesEqual(
  actual: MeetingNoteFilterValue | undefined,
  expected: MeetingNoteFilterValue | undefined,
  kind: MeetingNoteFilterFieldKind
) {
  const actualComparable = toComparable(actual, kind)
  const expectedComparable = toComparable(expected, kind)

  if (actualComparable === null || expectedComparable === null) {
    return false
  }

  return actualComparable === expectedComparable
}

function toComparable(
  value: MeetingNoteFilterValue | undefined,
  kind: MeetingNoteFilterFieldKind
) {
  if (Array.isArray(value)) {
    return null
  }

  if (!hasFilterValue(value)) {
    return null
  }

  if (kind === "number") {
    return typeof value === "number" && Number.isFinite(value) ? value : null
  }

  if (kind === "timestamp") {
    if (typeof value !== "string") {
      return null
    }

    const timestamp = Date.parse(value)
    return Number.isNaN(timestamp) ? null : timestamp
  }

  if (kind === "boolean") {
    return typeof value === "boolean" ? String(value) : null
  }

  return String(value).trim().toLowerCase()
}

function coerceScalar(
  kind: MeetingNoteFilterFieldKind,
  value: MeetingNoteFilterValue
): MeetingNoteFilterScalar {
  if (Array.isArray(value)) {
    return ""
  }

  if (kind === "number") {
    if (typeof value === "string" && value.trim().length === 0) {
      return ""
    }

    const numberValue =
      typeof value === "number" ? value : Number.parseFloat(String(value))
    return Number.isFinite(numberValue) ? numberValue : ""
  }

  if (kind === "boolean") {
    return coerceBoolean(value)
  }

  return String(value)
}

function coerceBoolean(value: MeetingNoteFilterValue) {
  if (Array.isArray(value)) {
    return Boolean(value[0])
  }

  if (typeof value === "boolean") {
    return value
  }

  return String(value) === "true"
}

function hasFilterValue(
  value: MeetingNoteFilterValue | undefined
): value is MeetingNoteFilterValue {
  if (value === undefined || value === null) {
    return false
  }

  if (Array.isArray(value)) {
    return value.length > 0
  }

  if (typeof value === "string") {
    return value.trim().length > 0
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
  }

  return true
}
