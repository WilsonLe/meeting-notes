import { describe, expect, it } from "vitest"

import {
  applyMeetingNoteFilters,
  coerceMeetingNoteFilterValue,
  countActiveMeetingNoteFilterClauses,
  searchMeetingNotes,
  type MeetingNote,
  type MeetingNoteFilterClause,
  type MeetingNoteFilterModel,
} from "./index"

type ClauseInput = Omit<MeetingNoteFilterClause, "id">

const baseNote: MeetingNote = {
  id: "base-note",
  title: "Base sync",
  state: "draft",
  createdAt: "2026-01-01T09:00:00.000Z",
  updatedAt: "2026-01-01T10:00:00.000Z",
  participants: [],
  durationSeconds: 0,
  transcriptChunks: [],
  processingRuns: [],
  providerConfigured: false,
}

function createNote(overrides: Partial<MeetingNote>): MeetingNote {
  return { ...baseNote, ...overrides }
}

const notes = [
  createNote({
    id: "alpha",
    title: "Roadmap sync",
    state: "ready",
    createdAt: "2026-01-01T12:00:00.000Z",
    participants: ["Ana"],
    durationSeconds: 3600,
    providerConfigured: true,
    summary: {
      overview: "Roadmap decisions",
      decisions: ["Ship filters"],
      actionItems: ["Write tests"],
      risks: [],
    },
  }),
  createNote({
    id: "beta",
    title: "Design critique",
    state: "processing",
    createdAt: "2026-01-02T12:00:00.000Z",
    participants: ["Bo"],
    durationSeconds: 900,
    summary: {
      overview: "Visual language review",
      decisions: [],
      actionItems: [],
      risks: ["Scope creep"],
    },
  }),
  createNote({
    id: "gamma",
    title: "Retro",
    state: "ready",
    createdAt: "2026-01-03T12:00:00.000Z",
    participants: ["Cy"],
    durationSeconds: 300,
  }),
]

function filterModel(groups: ClauseInput[][]): MeetingNoteFilterModel {
  return {
    groups: groups.map((clauses, groupIndex) => ({
      id: `group-${groupIndex}`,
      clauses: clauses.map((clause, clauseIndex) => ({
        id: `clause-${groupIndex}-${clauseIndex}`,
        ...clause,
      })),
    })),
  }
}

describe("meeting note filters", () => {
  it("applies top-level OR groups with AND clauses", () => {
    const result = applyMeetingNoteFilters(
      notes,
      filterModel([
        [
          { field: "state", op: "equal", value: "ready" },
          { field: "durationSeconds", op: "greaterThan", value: 1000 },
        ],
        [{ field: "participants", op: "in", value: ["Bo"] }],
      ])
    )

    expect(result.map((note) => note.id)).toEqual(["alpha", "beta"])
  })

  it("searches title, participants, status, and summary text", () => {
    expect(searchMeetingNotes(notes, "roadmap").map((note) => note.id)).toEqual([
      "alpha",
    ])
    expect(searchMeetingNotes(notes, "bo").map((note) => note.id)).toEqual([
      "beta",
    ])
  })

  it("keeps empty and invalid numeric clauses inactive", () => {
    const model = filterModel([
      [
        { field: "durationSeconds", op: "greaterThan", value: "" },
        { field: "actionItems", op: "equal", value: "not-a-number" },
      ],
    ])

    expect(coerceMeetingNoteFilterValue("durationSeconds", "equal", "")).toBe(
      ""
    )
    expect(
      coerceMeetingNoteFilterValue("durationSeconds", "equal", "not-a-number")
    ).toBe("")
    expect(countActiveMeetingNoteFilterClauses(model)).toBe(0)
    expect(applyMeetingNoteFilters(notes, model)).toEqual(notes)
  })

  it("compares full timestamp values", () => {
    const result = applyMeetingNoteFilters(
      notes,
      filterModel([
        [
          {
            field: "createdAt",
            op: "greaterThanOrEqual",
            value: "2026-01-02T00:00:00.000Z",
          },
        ],
      ])
    )

    expect(result.map((note) => note.id)).toEqual(["beta", "gamma"])
  })

  it("treats exists and not exists boolean values explicitly", () => {
    expect(
      applyMeetingNoteFilters(
        notes,
        filterModel([[{ field: "summary", op: "exists", value: true }]])
      ).map((note) => note.id)
    ).toEqual(["alpha", "beta"])
    expect(
      applyMeetingNoteFilters(
        notes,
        filterModel([[{ field: "summary", op: "exists", value: false }]])
      ).map((note) => note.id)
    ).toEqual(["gamma"])
    expect(
      applyMeetingNoteFilters(
        notes,
        filterModel([[{ field: "summary", op: "notExists", value: true }]])
      ).map((note) => note.id)
    ).toEqual(["gamma"])
    expect(
      applyMeetingNoteFilters(
        notes,
        filterModel([[{ field: "summary", op: "notExists", value: false }]])
      ).map((note) => note.id)
    ).toEqual(["alpha", "beta"])
  })

  it("supports in and not in operators for predefined options", () => {
    expect(
      applyMeetingNoteFilters(
        notes,
        filterModel([[{ field: "state", op: "in", value: ["ready"] }]])
      ).map((note) => note.id)
    ).toEqual(["alpha", "gamma"])
    expect(
      applyMeetingNoteFilters(
        notes,
        filterModel([[{ field: "state", op: "notIn", value: ["ready"] }]])
      ).map((note) => note.id)
    ).toEqual(["beta"])
  })
})
