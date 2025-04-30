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

// Создаем композитный провайдер для уменьшения вложенности
const composeProviders = (...providers: React.ComponentType<{ children: ReactNode }>[]) => {
  return ({ children }: { children: ReactNode }) => {
    return providers.reduceRight(
      (child, Provider) => <Provider>{child}</Provider>,
      children
    )
  }
}

// Создаем единый провайдер из всех контекстов
const AppProvider = composeProviders(
  MediaProvider,
  ProjectProvider,
  UserSettingsProvider,
  PlayerProvider,
  ModalProvider,
  TimelineProvider
)

export function Providers({ children }: ProvidersProps) {
  return <AppProvider>{children}</AppProvider>
}
