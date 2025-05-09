import { useEffect, useState } from "react"

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
  const { layoutMode, handleLayoutChange } = useUserSettings()
  const [hasExternalDisplay, setHasExternalDisplay] = useState(false)

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

  const changeLayout = (mode: LayoutMode): void => {
    // Разрешаем переключение на любой макет, кроме dual, если нет внешнего дисплея
    if (mode === "dual" && !hasExternalDisplay) {
      console.log("Dual layout недоступен без внешнего дисплея")
      return
    }

    console.log("Changing layout to:", mode)
    handleLayoutChange(mode)

    // Принудительно обновляем компоненты
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("resize"))
      }
    }, 50)
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
