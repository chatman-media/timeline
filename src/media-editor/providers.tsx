"use client"

import { createBrowserInspector } from "@statelyai/inspect"
import { ReactNode } from "react"

import { BrowserVisibilityProvider } from "@/media-editor/browser/providers/browser-visibility-provider"
import { MediaProvider } from "@/media-editor/browser/providers/media-provider"
import { UserSettingsProvider } from "@/media-editor/browser/providers/user-settings-provider"
import { ModalProvider } from "@/media-editor/dialogs"
import { PlayerProvider } from "@/media-editor/media-player"
import { DisplayTimeProvider } from "@/media-editor/media-player/contexts"
import { ProjectProvider } from "@/media-editor/project-settings/project-provider"
import { TimelineProvider } from "@/media-editor/timeline/services"

interface ProvidersProps {
  children: ReactNode
}

export const browserInspector = createBrowserInspector({
  autoStart: false,
})

// Создаем композитный провайдер для уменьшения вложенности
const composeProviders = (...providers: React.ComponentType<{ children: ReactNode }>[]) => {
  return ({ children }: { children: ReactNode }) => {
    return providers.reduceRight((child, Provider) => <Provider>{child}</Provider>, children)
  }
}

// Создаем единый провайдер из всех контекстов
const AppProvider = composeProviders(
  MediaProvider,
  ProjectProvider,
  UserSettingsProvider,
  BrowserVisibilityProvider,
  DisplayTimeProvider,
  PlayerProvider,
  ModalProvider,
  TimelineProvider,
)

export function Providers({ children }: ProvidersProps) {
  return <AppProvider>{children}</AppProvider>
}
