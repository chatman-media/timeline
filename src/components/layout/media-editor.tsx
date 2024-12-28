import { ThemeToggle } from "./theme-toggle"
import { Timeline } from "../timeline"
import { FileBrowser } from "../media/file-browser"
import { ActiveVideo } from "../media-player/active-video"
import { Editing } from "../editing/editing"
import { useState } from "react"

export function MediaEditor() {
  const [viewMode, setViewMode] = useState<"list" | "grid" | "thumbnails">("thumbnails")

  return (
    <div className="flex h-screen flex-col gap-1 p-0 m-0">
      <div className="grid auto-rows-min gap-1 md:grid-cols-[30%_70%]">
        <div className="h-[calc(50vh-2px)] bg-muted/50 p-0">
          <div className="flex-1 relative">
            <ThemeToggle />
            <FileBrowser viewMode={viewMode} />
            {
              /* <div className="absolute top-0 right-2 z-10">
              <ViewToggle
                currentView={viewMode}
                onViewChange={setViewMode}
              />
            </div> */
            }
          </div>
        </div>
        <div className="h-[calc(50vh-2px)] bg-muted/50">
          <ActiveVideo />
        </div>
      </div>
      <div className="media-editor auto-rows-min gap-1 grid grid-cols-[30%_70%]">
        <div className="h-[calc(50vh-2px)] bg-muted/50">
          <Editing />
        </div>
        <div className="h-[calc(50vh-2px)] bg-muted/50">
          <Timeline />
        </div>
      </div>
    </div>
  )
}
