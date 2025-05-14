import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Browser } from "@/media-editor/browser/components/browser"
import { MediaPlayer } from "@/media-editor/media-player/components"
import { Options } from "@/media-editor/options"
import { Timeline, TimelineLayout } from "@/media-editor/timeline/components"

import { useBrowserVisibility } from "../browser/providers/browser-visibility-provider"

export function DualMediaEditor() {
  const { isBrowserVisible } = useBrowserVisibility()

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
          {isBrowserVisible ? (
            <>
              <ResizablePanel defaultSize={40} minSize={20} maxSize={60}>
                <div className="relative h-full flex-1">
                  <Browser />
                </div>
              </ResizablePanel>
              <ResizableHandle />
            </>
          ) : null}
          <ResizablePanel defaultSize={isBrowserVisible ? 60 : 100} minSize={40} maxSize={100}>
            <div className="h-full flex-1">
          <Timeline />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
