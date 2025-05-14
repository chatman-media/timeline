import { useMachine } from "@xstate/react"
import { createContext, useContext, useEffect, useMemo } from "react"

import {
  COLOR_SPACES,
  FRAME_RATES,
  projectSettingsMachine,
} from "@/media-editor/project-settings/project-settings-machine"
import { browserInspector } from "@/media-editor/providers"
import type {
  AspectRatio,
  ColorSpace,
  FrameRate,
  ProjectSettings,
  Resolution,
  ResolutionOption,
} from "@/types/project"

// Интерфейс для провайдера настроек проекта
interface ProjectSettingsContextValue {
  // Текущие настройки
  settings: ProjectSettings
  isLoaded: boolean

  // Дополнительные свойства
  availableResolutions: ResolutionOption[]
  customWidth: number
  customHeight: number
  aspectRatioLocked: boolean

  // Константы
  frameRates: typeof FRAME_RATES
  colorSpaces: typeof COLOR_SPACES

  // Методы для обновления настроек
  updateAspectRatio: (aspectRatio: AspectRatio) => void
  updateResolution: (resolution: Resolution) => void
  updateFrameRate: (frameRate: FrameRate) => void
  updateColorSpace: (colorSpace: ColorSpace) => void
  updateSettings: (settings: Partial<ProjectSettings>) => void
  resetSettings: () => void

  // Методы для обновления дополнительных свойств
  updateCustomWidth: (width: number) => void
  updateCustomHeight: (height: number) => void
  updateAspectRatioLocked: (locked: boolean) => void
  updateAvailableResolutions: (resolutions: ResolutionOption[]) => void
}

// Создаем контекст
export const ProjectSettingsContext = createContext<ProjectSettingsContextValue | undefined>(
  undefined,
)

// Провайдер настроек проекта
export function ProjectSettingsProvider({ children }: { children: React.ReactNode }) {
  console.log("[ProjectSettingsProvider] Rendering")

  // Инициализируем машину состояний
  const [state, send] = useMachine(projectSettingsMachine, {
    inspect: browserInspector.inspect,
  })

  // Отправляем событие загрузки настроек при монтировании компонента
  useEffect(() => {
    console.log("[ProjectSettingsProvider] Initializing")
    send({ type: "LOAD_SETTINGS" })
  }, [send])

  // Логируем изменения состояния
  useEffect(() => {
    console.log("[ProjectSettingsProvider] State updated:", state.context)
  }, [state])

  // Создаем значение контекста
  const value = useMemo(
    () => ({
      // Текущие настройки
      settings: state.context.settings,
      isLoaded: state.context.isLoaded,

      // Дополнительные свойства
      availableResolutions: state.context.availableResolutions,
      customWidth: state.context.customWidth,
      customHeight: state.context.customHeight,
      aspectRatioLocked: state.context.aspectRatioLocked,

      // Константы
      frameRates: FRAME_RATES,
      colorSpaces: COLOR_SPACES,

      // Методы для обновления настроек
      updateAspectRatio: (aspectRatio: AspectRatio) => {
        console.log("[ProjectSettingsProvider] Updating aspect ratio:", aspectRatio)
        send({ type: "UPDATE_ASPECT_RATIO", aspectRatio })
      },

      updateResolution: (resolution: Resolution) => {
        console.log("[ProjectSettingsProvider] Updating resolution:", resolution)
        send({ type: "UPDATE_RESOLUTION", resolution })
      },

      updateFrameRate: (frameRate: FrameRate) => {
        console.log("[ProjectSettingsProvider] Updating frame rate:", frameRate)
        send({ type: "UPDATE_FRAME_RATE", frameRate })
      },

      updateColorSpace: (colorSpace: ColorSpace) => {
        console.log("[ProjectSettingsProvider] Updating color space:", colorSpace)
        send({ type: "UPDATE_COLOR_SPACE", colorSpace })
      },

      updateSettings: (settings: Partial<ProjectSettings>) => {
        console.log("[ProjectSettingsProvider] Updating settings:", settings)
        send({ type: "UPDATE_SETTINGS", settings })
      },

      resetSettings: () => {
        console.log("[ProjectSettingsProvider] Resetting settings")
        send({ type: "RESET_SETTINGS" })
      },

      // Методы для обновления дополнительных свойств
      updateCustomWidth: (width: number) => {
        console.log("[ProjectSettingsProvider] Updating custom width:", width)
        send({ type: "UPDATE_CUSTOM_WIDTH", width })
      },

      updateCustomHeight: (height: number) => {
        console.log("[ProjectSettingsProvider] Updating custom height:", height)
        send({ type: "UPDATE_CUSTOM_HEIGHT", height })
      },

      updateAspectRatioLocked: (locked: boolean) => {
        console.log("[ProjectSettingsProvider] Updating aspect ratio locked:", locked)
        send({ type: "UPDATE_ASPECT_RATIO_LOCKED", locked })
      },

      updateAvailableResolutions: (resolutions: ResolutionOption[]) => {
        console.log("[ProjectSettingsProvider] Updating available resolutions:", resolutions)
        send({ type: "UPDATE_AVAILABLE_RESOLUTIONS", resolutions })
      },
    }),
    [state.context, send],
  )

  // Возвращаем провайдер с контекстом
  return <ProjectSettingsContext.Provider value={value}>{children}</ProjectSettingsContext.Provider>
}

// Хук для использования настроек проекта
export function useProjectSettings() {
  const context = useContext(ProjectSettingsContext)

  if (!context) {
    throw new Error("useProjectSettings must be used within a ProjectSettingsProvider")
  }

  return context
}
