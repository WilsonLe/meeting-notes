import { CircleDashedIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { MEETING_NOTE_STATE_LABELS, type MeetingNoteState } from "@/lib/domain"
import { cn } from "@/lib/utils"

export function StatusBadge({ state }: { state: MeetingNoteState }) {
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
