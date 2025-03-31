import { ChevronDown,LayoutGrid, ListTodo, Save, Send, Upload, User } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

import { Browser } from "../browser/browser"
import { Editing } from "../editing/editing"
import { ActiveVideo } from "../player/media-player"
import { Timeline } from "../timeline"
import { ThemeToggle } from "./theme-toggle"

// Функция для получения сохраненных размеров панелей
function getSavedLayout(id: string): number[] | null {
  if (typeof window === 'undefined') return null
  
  try {
    const savedLayout = localStorage.getItem(`rpl-panel-group:${id}`)
    return savedLayout ? JSON.parse(savedLayout) : null
  } catch (e) {
    console.error("Ошибка при чтении сохраненных размеров:", e)
    return null
  }
}

// Компонент верхней панели навигации
function TopNavBar() {
  return (
    <div className="flex items-center justify-between w-full h-6 px-1 bg-background border-none">
      
      <div className="flex-1"></div>
      <div className="flex items-center space-x-0">


      <div className="flex items-center space-x-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="px-3 text-xs flex items-center gap-1 h-5 border-none rounded-md hover:bg-zinc-800 hover:text-white transition-colors" 
              title="Экспорт"
            >
              Экспорт <ChevronDown className="h-3 w-3 p-0 m-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-zinc-900 text-zinc-100 border-zinc-800 rounded-md">
            <DropdownMenuItem className="hover:bg-zinc-800">
              Экспорт видео
              <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-zinc-800">Экспорт выбранных клипов</DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-zinc-800">Экспорт в устройство...</DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-zinc-800">Загрузить на YouTube...</DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-zinc-800">Загрузить на Tiktok...</DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-zinc-800">Загрузить на Vimeo...</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>


        <Button variant="ghost" size="icon" title="Опубликовать">
          <Send className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" title="Список задач">
          <ListTodo className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" title="Расположение">
          <LayoutGrid className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" title="Сохранить">
          <Save className="h-3 w-3" />
        </Button>
        <ThemeToggle />
        <Button variant="ghost" size="icon" title="Профиль пользователя">
          <User className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

export function MediaEditor() {
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Значения по умолчанию
  const defaultSizes = {
    mainLayout: [50, 50],
    topLayout: [30, 70],
    bottomLayout: [30, 70]
  }
  
  // Состояния для размеров панелей
  const [mainLayout, setMainLayout] = useState(defaultSizes.mainLayout)
  const [topLayout, setTopLayout] = useState(defaultSizes.topLayout)
  const [bottomLayout, setBottomLayout] = useState(defaultSizes.bottomLayout)
  
  // Загружаем сохраненные размеры при первом рендере
  useEffect(() => {
    // Загружаем размеры из localStorage
    const savedMainLayout = getSavedLayout("main-layout")
    const savedTopLayout = getSavedLayout("top-layout")
    const savedBottomLayout = getSavedLayout("bottom-layout")
    
    // Применяем сохраненные размеры или используем значения по умолчанию
    if (savedMainLayout) setMainLayout(savedMainLayout)
    if (savedTopLayout) setTopLayout(savedTopLayout)
    if (savedBottomLayout) setBottomLayout(savedBottomLayout)
    
    // Помечаем, что размеры загружены
    setIsLoaded(true)
  }, [])
  
  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center">Загрузка...</div>
  }
  
  return (
    <div className="flex h-screen flex-col p-0 m-0">
      <TopNavBar />
      <ResizablePanelGroup
        direction="vertical"
        className="min-h-0 flex-grow"
        autoSaveId="main-layout"
      >
        {/* Верхняя половина экрана */}
        <ResizablePanel defaultSize={mainLayout[0]} minSize={20} maxSize={80}>
          <ResizablePanelGroup direction="horizontal" autoSaveId="top-layout">
            <ResizablePanel defaultSize={topLayout[0]} minSize={30} maxSize={60}>
              <div className="h-full bg-muted/50 p-0 overflow-hidden">
                <div className="flex-1 relative h-full">
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
