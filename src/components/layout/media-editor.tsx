import { useEffect, useState } from "react"
import { ClassicMediaEditor } from "./editor/layouts/classic-layout"
import { VerticalMediaEditor } from "./editor/layouts/vertical-layout"
import { DualMediaEditor } from "./editor/layouts/dual-layout"
import { DefaultMediaEditor } from "./editor/layouts/default-layout"
import { TopNavBar } from "./editor/top-nav-bar"
import { getSavedLayout, defaultSizes } from "./editor/utils/layout-utils"

export function MediaEditor() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [layoutMode, setLayoutMode] = useState("default")
  const [hasExternalDisplay, setHasExternalDisplay] = useState(false)
  const [mainLayout, setMainLayout] = useState(defaultSizes.mainLayout)
  const [topLayout, setTopLayout] = useState(defaultSizes.topLayout)
  const [bottomLayout, setBottomLayout] = useState(defaultSizes.bottomLayout)

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
    const savedMainLayout = getSavedLayout("main-layout")
    const savedTopLayout = getSavedLayout("top-layout")
    const savedBottomLayout = getSavedLayout("bottom-layout")
    const savedLayout = localStorage.getItem("editor-layout-mode")

    if (savedMainLayout) setMainLayout(savedMainLayout)
    if (savedTopLayout) setTopLayout(savedTopLayout)
    if (savedBottomLayout) setBottomLayout(savedBottomLayout)
    if (savedLayout && (savedLayout !== "dual" || hasExternalDisplay)) setLayoutMode(savedLayout)

    setIsLoaded(true)
  }, [hasExternalDisplay])

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
      {layoutMode === "classic" && <ClassicMediaEditor mainLayout={mainLayout} bottomLayout={bottomLayout} />}
      {layoutMode === "vertical" && <VerticalMediaEditor />}
      {layoutMode === "dual" && hasExternalDisplay && <DualMediaEditor />}
    </div>
  )
}
