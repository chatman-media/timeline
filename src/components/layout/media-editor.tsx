import { useEffect, useState } from "react"

import { useStore } from "@/hooks/use-store"

import { DefaultMediaEditor } from "./editor/layouts/default-layout"
import { DualMediaEditor } from "./editor/layouts/dual-layout"
import { LayoutMode } from "./editor/layouts/layout-previews"
import { OptionsMediaEditor } from "./editor/layouts/options-layout"
import { VerticalMediaEditor } from "./editor/layouts/vertical-layout"
import { TopNavBar } from "./editor/top-nav-bar"

export function MediaEditor() {
  const { layoutMode, setLayoutMode } = useStore()
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
    </div>
  )
}
