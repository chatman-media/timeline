import { Browser } from "@/components/browser"
import { MediaPlayer } from "@/components/media-player"
import { Options } from "@/components/options"
import { Timeline } from "@/components/timeline"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

interface OptionsLayoutProps {}

export function OptionsMediaEditor({}: OptionsLayoutProps) {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="min-h-0 flex-grow"
      autoSaveId="default-main-layout"
    >
      <ResizablePanel defaultSize={75} minSize={50} maxSize={80}>
        <ResizablePanelGroup direction="vertical" autoSaveId="vertical-left-layout">
          <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
            <div className="flex-1 h-full">
              <ResizablePanelGroup direction="horizontal" autoSaveId="vertical-top-layout">
                <ResizablePanel defaultSize={40} minSize={40} maxSize={80}>
                  <div className="flex-1 relative h-full">
                    <Browser />
                  </div>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={60} minSize={20} maxSize={60}>
                  <div className="flex-1 relative h-full">
                    <MediaPlayer />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={50}>
            <div className="flex-1 relative h-full">
              <Timeline />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel defaultSize={25}>
        <div className="flex-1 h-full">
          <Options />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
