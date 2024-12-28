import { ThemeToggle } from "./theme-toggle"
import { Timeline } from "../timeline"
import { FileBrowser } from "../media/file-browser"
import { ActiveVideo } from "../media-player/active-video"
import { Editing } from "../editing/editing"

export function MediaEditor() {
  return (
    <div className="flex h-screen flex-col gap-1 p-1 m-0">
      <div className="grid auto-rows-min gap-0 md:grid-cols-[30%_70%]">
        <div className="h-[calc(50vh-4px)] bg-muted/50 max-w-[550px] p-0">
          <ThemeToggle />
          <FileBrowser />
        </div>
        <div className="h-[calc(50vh-4px)] bg-muted/50">
          <ActiveVideo />
        </div>
      </div>
      <div className="media-editor grid grid-cols-[30%_70%] gap-1">
        <div className="h-[calc(50vh-4px)] bg-muted/50 max-w-[550px]">
          <Editing />
        </div>
        <div className="h-[calc(50vh-4px)] bg-muted/50">
          <Timeline />
        </div>
      </div>
    </div>
  )
}
