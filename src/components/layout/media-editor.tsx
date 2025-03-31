import { Editing } from "../editing/editing"
import { Browser } from "../browser/browser"
import { ActiveVideo } from "../player/media-player"
import { Timeline } from "../timeline"
import { ThemeToggle } from "./theme-toggle"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { useEffect, useState } from "react"

// Функция для получения сохраненных размеров панелей
function getSavedLayout(id: string): number[] | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const savedLayout = localStorage.getItem(`rpl-panel-group:${id}`);
    return savedLayout ? JSON.parse(savedLayout) : null;
  } catch (e) {
    console.error("Ошибка при чтении сохраненных размеров:", e);
    return null;
  }
}

export function MediaEditor() {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Значения по умолчанию
  const defaultSizes = {
    mainLayout: [50, 50],
    topLayout: [30, 70],
    bottomLayout: [30, 70]
  };
  
  // Состояния для размеров панелей
  const [mainLayout, setMainLayout] = useState(defaultSizes.mainLayout);
  const [topLayout, setTopLayout] = useState(defaultSizes.topLayout);
  const [bottomLayout, setBottomLayout] = useState(defaultSizes.bottomLayout);
  
  // Загружаем сохраненные размеры при первом рендере
  useEffect(() => {
    // Загружаем размеры из localStorage
    const savedMainLayout = getSavedLayout("main-layout");
    const savedTopLayout = getSavedLayout("top-layout");
    const savedBottomLayout = getSavedLayout("bottom-layout");
    
    // Применяем сохраненные размеры или используем значения по умолчанию
    if (savedMainLayout) setMainLayout(savedMainLayout);
    if (savedTopLayout) setTopLayout(savedTopLayout);
    if (savedBottomLayout) setBottomLayout(savedBottomLayout);
    
    // Помечаем, что размеры загружены
    setIsLoaded(true);
  }, []);
  
  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center">Загрузка...</div>;
  }
  
  return (
    <div className="flex h-screen flex-col p-0 m-0">
      <ResizablePanelGroup
        direction="vertical"
        className="min-h-screen"
        autoSaveId="main-layout"
      >
        {/* Верхняя половина экрана */}
        <ResizablePanel defaultSize={mainLayout[0]} minSize={20} maxSize={80}>
          <ResizablePanelGroup direction="horizontal" autoSaveId="top-layout">
            <ResizablePanel defaultSize={topLayout[0]} minSize={30} maxSize={60}>
              <div className="h-full bg-muted/50 p-0 overflow-hidden">
                <div className="flex-1 relative h-full">
                  <ThemeToggle />
                  <Browser />
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={topLayout[1]}>
              <div className="h-full bg-muted/50 border-l border-border">
                <ActiveVideo />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        
        {/* Разделитель между верхней и нижней половиной */}
        <ResizableHandle withHandle />
        
        {/* Нижняя половина экрана */}
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
    </div>
  )
}
