import { useEffect, useState } from "react"

import { useMedia } from "@/hooks/use-media"
import { useMediaContext } from "@/providers"

import { TopNavBar } from "../layout"
import { CameraRecording } from "../media-recording/camera-recording"
import {
  DefaultMediaEditor,
  DualMediaEditor,
  LayoutMode,
  OptionsMediaEditor,
  VerticalMediaEditor,
} from "./layouts"

export function MediaEditor() {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("default")
  const [hasExternalDisplay, setHasExternalDisplay] = useState(false)
  const { setAllMediaFiles } = useMediaContext()

  const { media, isLoading } = useMedia()
  useEffect(() => {
    if (media.length > 0) {
      setAllMediaFiles(media)
      console.log("[MediaEditor] Media:", media)
    }
  }, [media])

  useEffect(() => {
    const checkExternalDisplay = () => {
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

  const changeLayout = (mode: LayoutMode) => {
    if (mode === "dual" && !hasExternalDisplay) return
    setLayoutMode(mode)
  }

  return (
    <div className="flex h-screen flex-col p-0 m-0">
      <TopNavBar
        onLayoutChange={changeLayout}
        layoutMode={layoutMode as LayoutMode}
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
