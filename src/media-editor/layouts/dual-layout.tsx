import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Browser } from "@/media-editor/browser/components/browser"
import { MediaPlayer } from "@/media-editor/media-player/components"
import { Options } from "@/media-editor/options"
import { TimelineLayout } from "@/media-editor/timeline/components"

export function DualMediaEditor() {
  return (
    <ResizablePanelGroup
      direction="vertical"
      className="min-h-0 flex-grow"
      autoSaveId="dual-main-layout"
    >
      <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
        <ResizablePanelGroup direction="horizontal" autoSaveId="dual-top-layout">
          <ResizablePanel defaultSize={70} minSize={50} maxSize={85}>
            <div className="relative h-full flex-1">
              <MediaPlayer />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={30} minSize={15} maxSize={50}>
            <div className="h-full flex-1">
              <Options />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
        <ResizablePanelGroup direction="vertical" autoSaveId="dual-bottom-layout">
          <ResizablePanel defaultSize={40} minSize={20} maxSize={60}>
            <div className="relative h-full flex-1">
              <Browser />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={60} minSize={40} maxSize={80}>
            <div className="h-full flex-1">
              <TimelineLayout />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
