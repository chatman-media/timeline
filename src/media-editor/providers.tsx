"use client"

import { createBrowserInspector } from "@statelyai/inspect"
import { ReactNode } from "react"

import { MediaProvider } from "@/browser"
import { UserSettingsProvider } from "@/browser/providers/user-settings-provider"
import { ModalProvider } from "@/dialogs"
import { PlayerProvider } from "@/media-player"
import { ProjectProvider } from "@/project-settings/project-provider"
import { TimelineProvider } from "@/timeline/services"

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
        <UserSettingsProvider>
          <PlayerProvider>
            <ModalProvider>
              <TimelineProvider>{children}</TimelineProvider>
            </ModalProvider>
          </PlayerProvider>
        </UserSettingsProvider>
      </ProjectProvider>
    </MediaProvider>
  )
}
