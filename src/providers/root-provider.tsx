"use client"

import { ReactNode } from "react"

import { MediaProvider, ModalProvider, ProjectProvider, TimelineProvider } from "."

interface RootProviderProps {
  children: ReactNode
}

export function RootProvider({ children }: RootProviderProps) {
  return (
    <MediaProvider>
      <ProjectProvider>
        <ModalProvider>
          <TimelineProvider>{children}</TimelineProvider>
        </ModalProvider>
      </ProjectProvider>
    </MediaProvider>
  )
}
