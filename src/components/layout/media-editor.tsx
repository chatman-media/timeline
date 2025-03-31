import { Editing } from "../editing/editing"
import { Browser } from "../browser/browser"
import { ActiveVideo } from "../player/media-player"
import { Timeline } from "../timeline"
import { ThemeToggle } from "./theme-toggle"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

export function MediaEditor() {
  return (
    <div className="flex h-screen flex-col p-0 m-0">
      <ResizablePanelGroup
        direction="vertical"
        className="min-h-screen"
      >
        {/* Верхняя половина экрана */}
        <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={30} minSize={30} maxSize={60}>
              <div className="h-full bg-muted/50 p-0 overflow-hidden">
                <div className="flex-1 relative h-full">
                  <ThemeToggle />
                  <Browser />
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={70}>
              <div className="h-full bg-muted/50 border-l border-border">
                <ActiveVideo />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        
        {/* Разделитель между верхней и нижней половиной */}
        <ResizableHandle withHandle />
        
        {/* Нижняя половина экрана */}
        <ResizablePanel defaultSize={50}>
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={30} minSize={10} maxSize={50}>
              <div className="h-full bg-muted/50 border-t border-border">
                <Editing />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={70}>
              <div className="h-full bg-muted/50 border-l border-t border-border">
                <Timeline />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
