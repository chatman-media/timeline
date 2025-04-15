"use client"

import { ReactNode } from "react"

import { MediaProvider } from "@/providers/media-provider"
import { SelectionProvider } from "@/providers/selection-provider"

import { ProjectProvider } from "./project-provider"
import { TimelineProvider } from "./timeline-provider"
interface RootProviderProps {
  children: ReactNode
}

export function RootProvider({ children }: RootProviderProps) {
  return (
    <MediaProvider>
      <ProjectProvider>
        <SelectionProvider>
          <TimelineProvider>{children}</TimelineProvider>
        </SelectionProvider>
      </ProjectProvider>
    </MediaProvider>
  )
}
