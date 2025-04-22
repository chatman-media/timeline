import { Browser } from "@/browser/components"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { MediaPlayer } from "@/media-player/components"
import { Options } from "@/options"
import { TimelineLayout } from "@/timeline/components"

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
            <div className="h-full flex-1">
              <ResizablePanelGroup direction="horizontal" autoSaveId="vertical-top-layout">
                <ResizablePanel defaultSize={40} minSize={40} maxSize={80}>
                  <div className="relative h-full flex-1">
                    <Browser />
                  </div>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={60} minSize={20} maxSize={60}>
                  <div className="relative h-full flex-1">
                    <MediaPlayer />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={50}>
            <div className="relative h-full flex-1">
              <TimelineLayout />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel defaultSize={25}>
        <div className="h-full flex-1">
          <Options />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
