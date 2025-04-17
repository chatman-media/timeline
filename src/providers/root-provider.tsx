"use client"

import { ReactNode } from "react"

import { MediaProvider, ModalProvider, PlayerProvider, ProjectProvider, TimelineProvider } from "."

interface RootProviderProps {
  children: ReactNode
}

export function RootProvider({ children }: RootProviderProps) {

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
