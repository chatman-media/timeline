import { useEffect, useState } from "react"

import { STORAGE_KEYS } from "@/media-editor/browser/machines/user-settings-machine"
import { useUserSettings } from "@/media-editor/browser/providers/user-settings-provider"
import { CameraRecording } from "@/media-editor/dialogs/components/camera-recording"
import { TopNavBar } from "@/media-editor/project-settings/components"

import {
  DefaultMediaEditor,
  DualMediaEditor,
  LayoutMode,
  OptionsMediaEditor,
  VerticalMediaEditor,
} from "./layouts"

export function MediaEditor() {
  const { layoutMode: contextLayoutMode, handleLayoutChange } = useUserSettings()
  const [hasExternalDisplay, setHasExternalDisplay] = useState(false)
  const [layoutMode, setLayoutMode] = useState(contextLayoutMode)

  // Логируем значение layoutMode при каждом рендере
  console.log("MediaEditor rendering with layoutMode:", layoutMode)
  console.log("MediaEditor rendering with contextLayoutMode:", contextLayoutMode)

  // Синхронизируем layoutMode с localStorage при монтировании компонента
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedLayout = localStorage.getItem(STORAGE_KEYS.LAYOUT)
      console.log("MediaEditor: localStorage layout on mount:", storedLayout)

      if (storedLayout && ["default", "options", "vertical", "dual"].includes(storedLayout)) {
        console.log("MediaEditor: Using layout from localStorage:", storedLayout)
        setLayoutMode(storedLayout as LayoutMode)
      }
    }
  }, [])

  useEffect(() => {
    const checkExternalDisplay = (): void => {
      const isWideScreen = window.matchMedia("(min-width: 1920px)").matches
      const screenWidth = window.screen.width
      const pixelRatio = window.devicePixelRatio || 1
      const isProbablyExternal =
        (screenWidth > 1920 && pixelRatio < 2) || screenWidth * pixelRatio > 3000
      setHasExternalDisplay(isWideScreen || isProbablyExternal)
    }

    checkExternalDisplay()

    const mediaQuery = window.matchMedia("(min-width: 1920px)")
    mediaQuery.addEventListener("change", checkExternalDisplay)

    return () => {
      mediaQuery.removeEventListener("change", checkExternalDisplay)
    }
  }, [])

  useEffect(() => {
    console.log("MediaEditor: layoutMode changed to", layoutMode)

    if (typeof window !== "undefined") {
      const storedLayout = localStorage.getItem(STORAGE_KEYS.LAYOUT)
      if (storedLayout !== layoutMode) {
        localStorage.setItem(STORAGE_KEYS.LAYOUT, layoutMode)
        console.log("MediaEditor: Updated localStorage with new layout:", layoutMode)
      }
    }
  }, [layoutMode])

  const changeLayout = (mode: LayoutMode): void => {
    // Разрешаем переключение на любой макет, кроме dual, если нет внешнего дисплея
    if (mode === "dual" && !hasExternalDisplay) {
      console.log("Dual layout недоступен без внешнего дисплея")
      return
    }

    console.log("MediaEditor.changeLayout called with mode:", mode)

    // Сохраняем напрямую в localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.LAYOUT, mode)
      console.log("Layout saved directly to localStorage:", mode)
    }

    // Обновляем локальное состояние
    setLayoutMode(mode)

    // Вызываем handleLayoutChange для обновления состояния в машине
    handleLayoutChange(mode)
  }

  return (
    <div className="m-0 flex h-screen flex-col p-0">
      <TopNavBar
        onLayoutChange={changeLayout}
        layoutMode={layoutMode}
        hasExternalDisplay={hasExternalDisplay}
      />
      {layoutMode === "default" && <DefaultMediaEditor />}
      {layoutMode === "options" && <OptionsMediaEditor />}
      {layoutMode === "vertical" && <VerticalMediaEditor />}
      {layoutMode === "dual" && hasExternalDisplay && <DualMediaEditor />}
      <CameraRecording />
    </div>
  )
}
