import { Browser } from "@/components/browser/browser"
import { ActiveVideo } from "@/components/player/media-player"
import { Timeline } from "@/components/timeline"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

import { Options } from "../options"

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
            <div className="flex-1 relative h-full">
              <ActiveVideo />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={30} minSize={15} maxSize={50}>
            <div className="flex-1 h-full">
              <Options />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
        <ResizablePanelGroup direction="vertical" autoSaveId="dual-bottom-layout">
          <ResizablePanel defaultSize={40} minSize={20} maxSize={60}>
            <div className="flex-1 h-full">
              <Browser />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={60} minSize={40} maxSize={80}>
            <div className="flex-1 h-full">
              <Timeline />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
