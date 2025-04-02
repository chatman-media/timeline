import { Browser } from "@/components/browser/browser"
import { Editing } from "@/components/editing/editing"
import { ActiveVideo } from "@/components/player/media-player"
import { Timeline } from "@/components/timeline"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

import { Options } from "../options"

interface ClassicLayoutProps {
  mainLayout: number[]
  bottomLayout: number[]
}

export function ClassicMediaEditor({ mainLayout, bottomLayout }: ClassicLayoutProps) {
  return (
    <ResizablePanelGroup
      direction="vertical"
      className="min-h-0 flex-grow"
      autoSaveId="main-layout"
    >
      <ResizablePanel defaultSize={mainLayout[0]} minSize={20} maxSize={80}>
        <ResizablePanelGroup direction="horizontal" autoSaveId="top-layout">
          <ResizablePanel defaultSize={25} minSize={20} maxSize={50}>
            <div className="h-full bg-muted/50 p-0 overflow-hidden">
              <div className="flex-1 relative h-full">
                <Browser />
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={45} minSize={30} maxSize={65}>
            <div className="h-full bg-muted/50 border-l border-border">
              <ActiveVideo />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={30} minSize={15} maxSize={35}>
            <div className="h-full bg-muted/50 border-l border-border">
              <Options />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={mainLayout[1]}>
        <ResizablePanelGroup direction="horizontal" autoSaveId="bottom-layout">
          <ResizablePanel defaultSize={bottomLayout[0]} minSize={10} maxSize={50}>
            <div className="h-full bg-muted/50 border-t border-border">
              <Editing />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={bottomLayout[1]}>
            <div className="h-full bg-muted/50 border-l border-t border-border">
              <Timeline />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
} 