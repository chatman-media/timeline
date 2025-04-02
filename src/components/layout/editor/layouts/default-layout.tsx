import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Browser } from "@/components/browser/browser"
import { ActiveVideo } from "@/components/player/media-player"
import { Timeline } from "@/components/timeline"
import { Options } from "../options"
import { Editing } from "@/components/editing/editing"

export function DefaultMediaEditor() {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="min-h-0 flex-grow"
      autoSaveId="default-main-layout"
    >
      <ResizablePanel defaultSize={75} minSize={50} maxSize={80}>
        <ResizablePanelGroup direction="vertical" autoSaveId="vertical-left-layout">
          <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
            <div className="h-full bg-muted/50 p-0 overflow-hidden">
              <ResizablePanelGroup direction="horizontal" autoSaveId="vertical-top-layout">
                <ResizablePanel defaultSize={40} minSize={40} maxSize={80}>
                  <div className="flex-1 relative h-full">
                    <Browser />
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={60} minSize={20} maxSize={60}>
                  <div className="h-full border-l border-border">
                    <ActiveVideo />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50}>
            <div className="h-full bg-muted/50 border-t border-border">
              <ResizablePanelGroup direction="horizontal" autoSaveId="vertical-timeline-layout">
                <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
                  <div className="h-full">
                    <Editing />
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={75}>
                  <div className="h-full border-l border-border">
                    <Timeline />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={25}>
        <div className="h-full bg-muted/50 border-l border-border">
          <Options />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
} 