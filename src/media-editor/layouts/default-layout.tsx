import { Browser } from "@/browser/components/browser"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { MediaPlayer } from "@/media-player/components/media-player"
import { TimelineLayout } from "@/timeline/components"

export function DefaultMediaEditor() {
  return (
    <ResizablePanelGroup
      direction="vertical"
      className="min-h-0 flex-grow"
      autoSaveId="default-layout"
    >
      <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
        <ResizablePanelGroup direction="horizontal" autoSaveId="top-layout">
          <ResizablePanel defaultSize={40} minSize={10} maxSize={80}>
            <div className="relative h-full flex-1">
              <Browser />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={60} minSize={20} maxSize={90}>
            <div className="h-full flex-1">
              <MediaPlayer />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel defaultSize={50}>
        <div className="h-full flex-1">
          <TimelineLayout />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
