"use client"

import { MediaProvider } from "@/browser"
import { ModalProvider } from "@/dialogs"
import { PlayerProvider } from "@/media-player"
import { ProjectProvider } from "@/project-settings/project-provider"
import { TimelineProvider } from "@/timeline/services"
import { createBrowserInspector } from "@statelyai/inspect"
import { ReactNode } from "react"

interface ProvidersProps {
  children: ReactNode
}

export const browserInspector = createBrowserInspector({
  autoStart: false,
})

export function Providers({ children }: ProvidersProps) {
  return (
    <MediaProvider>
      <ProjectProvider>
        <PlayerProvider>
          <ModalProvider>
            <TimelineProvider>{children}</TimelineProvider>
          </ModalProvider>
        </PlayerProvider>
      </ProjectProvider>
    </MediaProvider>
  )
}
