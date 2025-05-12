import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Browser } from "@/media-editor/browser/components/browser"
import { useBrowserVisibility } from "@/media-editor/browser/providers/browser-visibility-provider"
import { MediaPlayer } from "@/media-editor/media-player/components"

import { TimelinePanel } from "../timeline/components/timeline-panel"

export function DefaultMediaEditor() {
  const { isBrowserVisible } = useBrowserVisibility()

  return (
    <ResizablePanelGroup
      direction="vertical"
      className="min-h-0 flex-grow"
      autoSaveId="default-layout"
    >
      <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
        {isBrowserVisible ? (
          // Если браузер видим, показываем обычный макет с двумя панелями
          <ResizablePanelGroup direction="horizontal" autoSaveId="top-layout">
            <ResizablePanel
              defaultSize={40}
              minSize={10}
              maxSize={80}
              style={{
                transition: "width 0.3s ease-in-out",
                overflow: "hidden",
              }}
            >
              <div className="relative h-full flex-1">
                <Browser />
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel
              defaultSize={60}
              minSize={20}
              maxSize={100}
              style={{
                transition: "width 0.3s ease-in-out",
              }}
            >
              <div className="h-full flex-1">
                <MediaPlayer />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          // Если браузер скрыт, показываем только медиаплеер на всю ширину
          <div className="relative h-full w-full">
            <Browser />
            <div className="h-full w-full">
              <MediaPlayer />
            </div>
          </div>
        )}
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel defaultSize={50}>
        <div className="h-full flex-1">
          <TimelinePanel />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
