import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Browser } from "@/media-editor/browser/components"
import { MediaPlayer } from "@/media-editor/media-player/components"
import { Options } from "@/media-editor/options"
import { Timeline, TimelineLayout } from "@/media-editor/timeline/components"

import { useBrowserVisibility } from "../browser/providers/browser-visibility-provider"

export function OptionsMediaEditor() {
  const { isBrowserVisible } = useBrowserVisibility()

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
                {isBrowserVisible ? (
                  <>
                    <ResizablePanel defaultSize={40} minSize={10} maxSize={80}>
                      <div className="relative h-full flex-1">
                        <Browser />
                      </div>
                    </ResizablePanel>
                    <ResizableHandle />
                  </>
                ) : null}
                <ResizablePanel
                  defaultSize={isBrowserVisible ? 60 : 100}
                  minSize={20}
                  maxSize={100}
                >
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
              <Timeline />
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
