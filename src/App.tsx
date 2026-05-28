import { FileTextIcon, MicIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { MeetingNotesView } from "@/components/meeting-notes/meeting-notes-view"
import type { MeetingNote } from "@/lib/domain"

const emptyMeetingNotes: MeetingNote[] = []

type AppProps = {
  notes?: MeetingNote[]
}

function App({ notes = emptyMeetingNotes }: AppProps) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <MicIcon aria-hidden="true" />
            </div>
            <div className="grid min-w-0 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-heading font-medium">
                Meeting Notes
              </span>
              <span className="truncate text-xs text-sidebar-foreground/70">
                Browser-local shell
              </span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    type="button"
                    isActive
                    tooltip="Meeting Notes"
                  >
                    <FileTextIcon aria-hidden="true" />
                    <span>Meeting Notes</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <Badge variant="outline" className="justify-center">
            Local only
          </Badge>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="app-atmosphere min-h-svh">
        <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Meeting Notes</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <MeetingNotesView notes={notes} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App
