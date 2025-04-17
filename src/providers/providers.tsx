"use client"

import { createBrowserInspector } from "@statelyai/inspect"
import { ReactNode } from "react"

import { MediaProvider, ModalProvider, PlayerProvider, ProjectProvider, TimelineProvider } from "."

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
