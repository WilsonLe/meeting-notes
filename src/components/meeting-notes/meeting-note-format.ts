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

export function formatParticipants(participants: string[]) {
  if (participants.length === 0) {
    return "No participants"
  }

  return participants.join(", ")
}

export function formatDuration(durationSeconds: number) {
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

export function formatCompactDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "Unknown"
    : compactDateFormatter.format(date)
}

export function formatDateTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "Unknown"
    : dateTimeFormatter.format(date)
}
