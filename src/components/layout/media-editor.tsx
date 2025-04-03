import { useEffect, useState } from "react"

import { useRootStore } from "@/hooks/use-root-store"

import { ClassicMediaEditor } from "./editor/layouts/classic-layout"
import { DefaultMediaEditor } from "./editor/layouts/default-layout"
import { DualMediaEditor } from "./editor/layouts/dual-layout"
import { VerticalMediaEditor } from "./editor/layouts/vertical-layout"
import { TopNavBar } from "./editor/top-nav-bar"

export function MediaEditor() {
  const { loadState, saveState, activeVideo, videoRefs } = useRootStore()
  const [isLoaded, setIsLoaded] = useState(false)
  const [layoutMode, setLayoutMode] = useState("default")
  const [hasExternalDisplay, setHasExternalDisplay] = useState(false)

  useEffect(() => {
    const checkExternalDisplay = () => {
      const isWideScreen = window.matchMedia("(min-width: 1920px)").matches
      const screenWidth = window.screen.width
      const screenHeight = window.screen.height
      const pixelRatio = window.devicePixelRatio || 1
      const isProbablyExternal =
        (screenWidth > 1920 && pixelRatio < 2) || screenWidth * pixelRatio > 3000
      setHasExternalDisplay(isWideScreen || isProbablyExternal)
    }

    checkExternalDisplay()

    const mediaQuery = window.matchMedia("(min-width: 1920px)")
    const handleChange = (e: MediaQueryListEvent) => {
      checkExternalDisplay()
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange)
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange)
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange)
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [])

  useEffect(() => {
    const savedLayout = localStorage.getItem("editor-layout-mode")

    if (savedLayout && (savedLayout !== "dual" || hasExternalDisplay)) setLayoutMode(savedLayout)

    setIsLoaded(true)
  }, [hasExternalDisplay])

  useEffect(() => {
    // Загружаем состояние при монтировании
    loadState()

    // Если есть активное видео, убедимся что оно загружено
    if (activeVideo) {
      const videoElement = videoRefs[activeVideo.id]
      if (videoElement) {
        videoElement.load()
      }
    }

    // Сохраняем состояние при закрытии страницы
    const handleBeforeUnload = () => {
      saveState()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [loadState, saveState, activeVideo])

  const changeLayout = (mode: string) => {
    if (mode === "dual" && !hasExternalDisplay) return
    setLayoutMode(mode)
    localStorage.setItem("editor-layout-mode", mode)
  }

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center">Загрузка...</div>
  }

  return (
    <div className="flex h-screen flex-col p-0 m-0">
      <TopNavBar onLayoutChange={changeLayout} layoutMode={layoutMode} hasExternalDisplay={hasExternalDisplay} />
      {layoutMode === "default" && <DefaultMediaEditor />}
      {layoutMode === "classic" && <ClassicMediaEditor />}
      {layoutMode === "vertical" && <VerticalMediaEditor />}
      {layoutMode === "dual" && hasExternalDisplay && <DualMediaEditor />}
    </div>
  )
}
