import {
  ChevronDown,
  Cloud,
  Layout,
  LayoutGrid,
  ListTodo,
  Save,
  Send,
  Upload,
  User,
  Settings,
  Import,
  Share,
  HelpCircle,
  Keyboard,
} from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import { Browser } from "../browser/browser"
import { Editing } from "../editing/editing"
import { ActiveVideo } from "../player/media-player"
import { Timeline } from "../timeline"
import { ThemeToggle } from "./theme-toggle"

// Функция для получения сохраненных размеров панелей
function getSavedLayout(id: string): number[] | null {
  if (typeof window === "undefined") return null

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
  const [projectName, setProjectName] = useState("Без названия #1")
  const [isEditing, setIsEditing] = useState(false)

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectName(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditing(false)
    }
  }

  return (
    <div className="flex items-center justify-between w-full h-6 px-1 bg-background border-b border-border">
      <div className="flex-1"></div>
      <div 
        className="text-xs font-medium relative group flex items-center gap-1"
        onMouseEnter={() => !isEditing && setIsEditing(true)}
        onMouseLeave={() => !document.activeElement?.id?.includes('project-name') && setIsEditing(false)}
      >
        {isEditing ? (
          <input
            id="project-name-input"
            type="text"
            value={projectName}
            onChange={handleNameChange}
            onKeyDown={handleKeyDown}
            onBlur={() => setIsEditing(false)}
            className="text-xs bg-transparent border-b border-gray-400 focus:outline-none focus:border-primary text-center min-w-[70px]"
            autoFocus
          />
        ) : (
          <span className="group-hover:border-b group-hover:border-dashed group-hover:border-gray-400 pb-0.5">{projectName}</span>
        )}
      </div>
      <div className="flex items-center space-x-0 flex-1 justify-end">
        <Button className="cursor-pointer" variant="ghost" size="icon" title="Опубликовать">
          <Send className="h-3 w-3" />
        </Button>
        <Button className="cursor-pointer" variant="ghost" size="icon" title="Список задач">
          <ListTodo className="h-3 w-3" />
        </Button>
        <Button className="cursor-pointer" variant="ghost" size="icon" title="Макет">
          <Layout className="h-3 w-3" />
        </Button>
        <Button className="cursor-pointer" variant="ghost" size="icon" title="Сохранить">
          <Save className="h-3 w-3" />
        </Button>
        <Button className="cursor-pointer" variant="ghost" size="icon" title="Профиль пользователя">
          <Cloud className="h-3 w-3" />
        </Button>
        <ThemeToggle />
        <Button className="cursor-pointer" variant="ghost" size="icon" title="Настройки">
          <Settings className="h-3 w-3" />
        </Button>
        <Button className="cursor-pointer" variant="ghost" size="icon" title="<Быстрые клавиши>">
          <Keyboard className="h-3 w-3" />
        </Button>
        <div className="flex items-center space-x-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="px-3 text-xs flex items-center gap-1 h-5 border-border active:border-border rounded-md hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                title="Экспорт"
              >
                Экспорт <ChevronDown className="h-3 w-3 p-0 m-0 cursor-pointer" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="bg-zinc-900 text-zinc-100 border-zinc-800 rounded-md"
            >
              <DropdownMenuItem className="hover:bg-zinc-800 py-1.3">
                Экспорт видео
                <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-zinc-800 py-1.3">
                Экспорт выбранных клипов
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-zinc-800 py-1.3">
                Экспорт в устройство...
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-zinc-800 py-1.3">
                Загрузить на YouTube...
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-zinc-800 py-1.3">
                Загрузить на Tiktok...
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-zinc-800 py-1.3">
                Загрузить на Vimeo...
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-zinc-800 py-1.3">
                Загрузить на Rutube...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

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
    bottomLayout: [30, 70],
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
    return (
      <div className="flex h-screen items-center justify-center">
        Загрузка...
      </div>
    )
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
            <ResizablePanel
              defaultSize={topLayout[0]}
              minSize={30}
              maxSize={60}
            >
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
          <ResizablePanelGroup
            direction="horizontal"
            autoSaveId="bottom-layout"
          >
            <ResizablePanel
              defaultSize={bottomLayout[0]}
              minSize={10}
              maxSize={50}
            >
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
