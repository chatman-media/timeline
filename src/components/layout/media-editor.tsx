import { useState } from "react"

import { Editing } from "../editing/editing"
import { FileBrowser } from "../media/file-browser"
import { ActiveVideo } from "../media-player/active-video"
import { Timeline } from "../timeline"
import { ThemeToggle } from "./theme-toggle"

export function MediaEditor() {
  const [viewMode, setViewMode] = useState<"list" | "grid" | "thumbnails">("thumbnails")

  return (
    <div className="flex h-screen flex-col p-0 m-0">
      <div className="grid auto-rows-min md:grid-cols-[30%_70%]">
        <div className="h-[50vh] bg-muted/50 p-0">
          <div className="flex-1 relative">
            <ThemeToggle />
            <FileBrowser viewMode={viewMode} />
          </div>
        </div>
        <div className="h-[50vh] bg-muted/50 border-l border-border">
          <ActiveVideo />
        </div>
      </div>
      <div className="media-editor auto-rows-min grid grid-cols-[30%_70%]">
        <div className="h-[50vh] bg-muted/50 border-t border-border">
          <Editing />
        </div>
        <div className="h-[50vh] bg-muted/50 border-l border-t border-border">
          <Timeline />
        </div>
      </div>
    </div>
  )
}
