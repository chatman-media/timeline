"use client"

import { ReactNode, useEffect } from "react"

import { MediaProvider, ModalProvider, PlayerProvider, ProjectProvider, TimelineProvider } from "."
import { createBrowserInspector } from "@statelyai/inspect"
import { createActor } from "xstate"
import {
  modalMachine,
  timelineMachine,
  playerMachine,
  projectMachine,
  mediaMachine,
} from "@/machines"

interface RootProviderProps {
  children: ReactNode
}

export function RootProvider({ children }: RootProviderProps) {
  useEffect(() => {
    const inspector = createBrowserInspector()

    const actors = [
      createActor(timelineMachine, {
        inspect: inspector.inspect,
        id: "timeline",
      }),
      createActor(modalMachine, {
        inspect: inspector.inspect,
        id: "modal",
      }),
      createActor(playerMachine, {
        inspect: inspector.inspect,
        id: "player",
      }),
      createActor(projectMachine, {
        inspect: inspector.inspect,
        id: "project",
      }),
      createActor(mediaMachine, {
        inspect: inspector.inspect,
        id: "media",
      }),
    ]

    actors.forEach((actor) => actor.start())

    return () => {
      actors.forEach((actor) => actor.stop())
    }
  }, [])

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
