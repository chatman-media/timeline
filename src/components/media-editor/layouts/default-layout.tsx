import { Browser } from "@/components/browser/browser"
import { MediaPlayer } from "@/components/media-player/media-player"
import { Timeline } from "@/components/timeline"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

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
            <div className="flex-1 relative h-full">
              <Browser />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={60} minSize={20} maxSize={90}>
            <div className="flex-1 h-full">
              <MediaPlayer />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel defaultSize={50}>
        <div className="flex-1 h-full">
          <Timeline />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
