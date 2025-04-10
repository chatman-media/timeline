import { Browser } from "@/components/browser/browser"
import { ActiveVideo } from "@/components/player/media-player"
import { Timeline } from "@/components/timeline"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

interface ClassicLayoutProps {}

export function ClassicMediaEditor({}: ClassicLayoutProps) {
  return (
    <ResizablePanelGroup
      direction="vertical"
      className="min-h-0 flex-grow"
      autoSaveId="main-layout"
    >
      <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
        <ResizablePanelGroup direction="horizontal" autoSaveId="top-layout">
          <ResizablePanel defaultSize={25} minSize={20} maxSize={50}>
            <div className="flex-1 relative h-full border-border">
              <Browser />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={45} minSize={30} maxSize={65}>
            <div className="h-full border-border">
              <ActiveVideo />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel defaultSize={50}>
        <div className="h-full border-border">
          <Timeline />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
