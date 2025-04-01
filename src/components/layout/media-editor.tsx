import {
  ChevronDown,
  Cloud,
  Keyboard,
  Layout,
  ListTodo,
  Play,
  Save,
  Send,
  Settings,
  Sliders,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

import { Browser } from "../browser/browser"
import { Editing } from "../editing/editing"
import { ActiveVideo } from "../player/media-player"
import { Timeline } from "../timeline"
import { ThemeToggle } from "./theme-toggle"

// Компонент для генерации случайных дорожек
function TrackLines() {
  const [tracks, setTracks] = useState<{ width: number; left: number }[]>([])

  useEffect(() => {
    // Генерируем случайные длины дорожек при создании компонента
    const randomTracks = [
      {
        width: 0.8,
        left: 0.1,
      },
      {
        width: 0.5,
        left: 0.2,
      },
      {
        width: 0.8,
        left: 0.15,
      },
    ]
    setTracks(randomTracks)
  }, [])

  return (
    <div className="flex flex-col items-start pt-[1px]">
      {tracks.map((track, index) => (
        <div
          key={index}
          className="h-[4px] bg-primary/70 rounded-sm mb-[1px]"
          style={{
            width: `${track.width * 100}%`,
            marginLeft: `${track.left * 100}%`,
          }}
        />
      ))}
    </div>
  )
}

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
    if (e.key === "Enter") {
      setIsEditing(false)
    }
  }

  return (
    <div className="flex items-center justify-between w-full h-6 px-1 bg-background border-b border-border">
      <div className="flex-1"></div>
      <div
        className="text-xs font-medium relative group flex items-center gap-1"
        onMouseEnter={() => !isEditing && setIsEditing(true)}
        onMouseLeave={() =>
          !document.activeElement?.id?.includes("project-name") && setIsEditing(false)
        }
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
          <span className="group-hover:border-b group-hover:border-dashed group-hover:border-gray-400 pb-0.5">
            {projectName}
          </span>
        )}
      </div>
      <div className="flex items-center space-x-0 flex-1 justify-end">
        <Popover>
          <PopoverTrigger asChild>
            <Button className="cursor-pointer" variant="ghost" size="icon" title="Опубликовать">
              <Send className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" sideOffset={0}>
            <div className="">
              <h4 className="text-sm font-semibold">Задачи Публикации</h4>
              <div className="h-10"></div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button className="cursor-pointer" variant="ghost" size="icon" title="Список задач">
              <ListTodo className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" sideOffset={0}>
            <div className="">
              <h4 className="text-sm font-semibold">Задачи Проекта</h4>
              <div className="h-10"></div>
            </div>
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button className="cursor-pointer" variant="ghost" size="icon" title="Макет">
              <Layout className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-1" sideOffset={0}>
            <div className="flex justify-around gap-2">
              <div className="flex flex-col items-center cursor-pointer hover:bg-muted p-2 pb-1">
                <div className="w-16 h-12 border-2 border-gray-700 bg-muted flex flex-col mb-1">
                  <div
                    className="h-6 w-full flex"
                    style={{ borderBottom: "2px solid rgb(55, 65, 81)" }}
                  >
                    <div
                      className="w-[30%] h-full"
                      style={{ borderRight: "2px solid rgb(55, 65, 81)" }}
                    ></div>
                    <div
                      className="w-[50%] h-full flex items-center justify-center"
                      style={{ borderRight: "2px solid rgb(55, 65, 81)" }}
                    >
                      <Play className="w-3 h-3 text-primary" />
                    </div>
                    <div className="w-[20%] h-full"></div>
                  </div>
                  <div className="h-6 w-full flex">
                    <div
                      className="w-[30%] h-full"
                      style={{ borderRight: "2px solid rgb(55, 65, 81)" }}
                    ></div>
                    <div className="w-[70%] h-full relative px-1 py-1">
                      <TrackLines />
                    </div>
                  </div>
                </div>
                <span className="text-[9px]">Классический</span>
              </div>

              <div className="flex flex-col items-center cursor-pointer hover:bg-muted p-2 pb-1">
                <div className="w-16 h-12 border-2 border-gray-700 bg-muted flex flex-row mb-1">
                  <div className="w-[67%] h-full flex flex-col">
                    <div
                      className="h-[50%] w-full flex"
                      style={{ borderBottom: "2px solid rgb(55, 65, 81)" }}
                    >
                      <div className="w-[70%] h-full"></div>
                      <div
                        className="w-[30%] h-full"
                        style={{ borderLeft: "2px solid rgb(55, 65, 81)" }}
                      ></div>
                    </div>
                    <div className="h-[50%] w-full flex">
                      <div
                        className="w-[30%] h-full"
                        style={{ borderRight: "2px solid rgb(55, 65, 81)" }}
                      ></div>
                      <div className="w-[70%] h-full relative px-1 py-1">
                        <TrackLines />
                      </div>
                    </div>
                  </div>
                  <div
                    className="w-[33%] h-full flex items-center justify-center"
                    style={{ borderLeft: "2px solid rgb(55, 65, 81)" }}
                  >
                    <Play className="w-3 h-3 text-primary" />
                  </div>
                </div>
                <span className="text-[9px]">Вертикальное</span>
              </div>

              <div className="flex flex-col items-center cursor-pointer hover:bg-muted p-2 pb-1">
                <div className="w-16 h-12 border border-border bg-muted flex items-center justify-center mb-1">
                  <div className="flex gap-1">
                    <div className="w-3 h-4 bg-primary"></div>
                    <div className="w-3 h-4 bg-primary"></div>
                  </div>
                </div>
                <span className="text-[9px]">Двойной</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Button className="cursor-pointer" variant="ghost" size="icon" title="Сохранить">
          <Save className="h-3 w-3" />
        </Button>
        <Button className="cursor-pointer" variant="ghost" size="icon" title="Быстрые клавиши">
          <Keyboard className="h-3 w-3" />
        </Button>
        <Button className="cursor-pointer" variant="ghost" size="icon" title="Профиль пользователя">
          <Cloud className="h-3 w-3" />
        </Button>
        <ThemeToggle />
        <Button className="cursor-pointer" variant="ghost" size="icon" title="Настройки">
          <Settings className="h-3 w-3" />
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

// Компонент для опций редактирования
function Options() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-2 py-1 border-b border-border">
        <h3 className="text-xs font-medium">Опции</h3>
        <Button variant="ghost" size="icon" className="h-5 w-5">
          <Sliders className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex-1 p-2 overflow-y-auto"></div>
    </div>
  )
}

export function MediaEditor() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [layoutMode, setLayoutMode] = useState("classic") // classic, vertical, dual

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
    const savedLayout = localStorage.getItem("editor-layout-mode")

    // Применяем сохраненные размеры или используем значения по умолчанию
    if (savedMainLayout) setMainLayout(savedMainLayout)
    if (savedTopLayout) setTopLayout(savedTopLayout)
    if (savedBottomLayout) setBottomLayout(savedBottomLayout)
    if (savedLayout) setLayoutMode(savedLayout)

    // Помечаем, что размеры загружены
    setIsLoaded(true)
  }, [])

  // Функция для изменения макета
  const changeLayout = (mode: string) => {
    setLayoutMode(mode)
    localStorage.setItem("editor-layout-mode", mode)
  }

  // Модифицированный TopNavBar с функцией смены макета
  const CustomTopNavBar = () => {
    const [projectName, setProjectName] = useState("Без названия #1")
    const [isEditing, setIsEditing] = useState(false)

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setProjectName(e.target.value)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        setIsEditing(false)
      }
    }

    return (
      <div className="flex items-center justify-between w-full h-6 px-1 bg-background border-b border-border">
        <div className="flex-1"></div>
        <div
          className="text-xs font-medium relative group flex items-center gap-1"
          onMouseEnter={() => !isEditing && setIsEditing(true)}
          onMouseLeave={() =>
            !document.activeElement?.id?.includes("project-name") && setIsEditing(false)
          }
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
            <span className="group-hover:border-b group-hover:border-dashed group-hover:border-gray-400 pb-0.5">
              {projectName}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-0 flex-1 justify-end">
          <Popover>
            <PopoverTrigger asChild>
              <Button className="cursor-pointer" variant="ghost" size="icon" title="Опубликовать">
                <Send className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" sideOffset={0}>
              <div className="">
                <h4 className="text-sm font-semibold">Задачи Публикации</h4>
                <div className="h-10"></div>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button className="cursor-pointer" variant="ghost" size="icon" title="Список задач">
                <ListTodo className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" sideOffset={0}>
              <div className="">
                <h4 className="text-sm font-semibold">Задачи Проекта</h4>
                <div className="h-10"></div>
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button className="cursor-pointer" variant="ghost" size="icon" title="Макет">
                <Layout className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-1" sideOffset={0}>
              <div className="flex justify-around gap-2">
                <div
                  className={`flex flex-col items-center cursor-pointer ${layoutMode === "classic" ? "bg-muted" : "hover:bg-muted"} p-2 pb-1`}
                  onClick={() => changeLayout("classic")}
                >
                  <div className="w-16 h-12 border-2 border-gray-700 bg-muted flex flex-col mb-1">
                    <div
                      className="h-6 w-full flex"
                      style={{ borderBottom: "2px solid rgb(55, 65, 81)" }}
                    >
                      <div
                        className="w-[30%] h-full"
                        style={{ borderRight: "2px solid rgb(55, 65, 81)" }}
                      ></div>
                      <div
                        className="w-[50%] h-full flex items-center justify-center"
                        style={{ borderRight: "2px solid rgb(55, 65, 81)" }}
                      >
                        <Play className="w-3 h-3 text-primary" />
                      </div>
                      <div className="w-[20%] h-full"></div>
                    </div>
                    <div className="h-6 w-full flex">
                      <div
                        className="w-[30%] h-full"
                        style={{ borderRight: "2px solid rgb(55, 65, 81)" }}
                      ></div>
                      <div className="w-[70%] h-full relative px-1 py-1">
                        <TrackLines />
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px]">Классический</span>
                </div>

                <div
                  className={`flex flex-col items-center cursor-pointer ${layoutMode === "vertical" ? "bg-muted" : "hover:bg-muted"} p-2 pb-1`}
                  onClick={() => changeLayout("vertical")}
                >
                  <div className="w-16 h-12 border-2 border-gray-700 bg-muted flex flex-row mb-1">
                    <div className="w-[67%] h-full flex flex-col">
                      <div
                        className="h-[50%] w-full flex"
                        style={{ borderBottom: "2px solid rgb(55, 65, 81)" }}
                      >
                        <div className="w-[70%] h-full"></div>
                        <div
                          className="w-[30%] h-full"
                          style={{ borderLeft: "2px solid rgb(55, 65, 81)" }}
                        ></div>
                      </div>
                      <div className="h-[50%] w-full flex">
                        <div
                          className="w-[30%] h-full"
                          style={{ borderRight: "2px solid rgb(55, 65, 81)" }}
                        ></div>
                        <div className="w-[70%] h-full relative px-1 py-1">
                          <TrackLines />
                        </div>
                      </div>
                    </div>
                    <div
                      className="w-[33%] h-full flex items-center justify-center"
                      style={{ borderLeft: "2px solid rgb(55, 65, 81)" }}
                    >
                      <Play className="w-3 h-3 text-primary" />
                    </div>
                  </div>
                  <span className="text-[9px]">Вертикальное</span>
                </div>

                <div
                  className={`flex flex-col items-center cursor-pointer ${layoutMode === "dual" ? "bg-muted" : "hover:bg-muted"} p-2 pb-1`}
                  onClick={() => changeLayout("dual")}
                >
                  <div className="w-16 h-12 border border-border bg-muted flex items-center justify-center mb-1">
                    <div className="flex gap-1">
                      <div className="w-3 h-4 bg-primary"></div>
                      <div className="w-3 h-4 bg-primary"></div>
                    </div>
                  </div>
                  <span className="text-[9px]">Двойной</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button className="cursor-pointer" variant="ghost" size="icon" title="Сохранить">
            <Save className="h-3 w-3" />
          </Button>
          <Button className="cursor-pointer" variant="ghost" size="icon" title="Быстрые клавиши">
            <Keyboard className="h-3 w-3" />
          </Button>
          <Button
            className="cursor-pointer"
            variant="ghost"
            size="icon"
            title="Профиль пользователя"
          >
            <Cloud className="h-3 w-3" />
          </Button>
          <ThemeToggle />
          <Button className="cursor-pointer" variant="ghost" size="icon" title="Настройки">
            <Settings className="h-3 w-3" />
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

  // Компонент для двойного макета
  function DualMediaEditor() {
    return (
      <ResizablePanelGroup
        direction="vertical"
        className="min-h-0 flex-grow"
        autoSaveId="dual-main-layout"
      >
        {/* Верхнее окно с видео и контролем */}
        <ResizablePanel defaultSize={60} minSize={30} maxSize={70}>
          <ResizablePanelGroup direction="horizontal" autoSaveId="dual-top-layout">
            <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
              <div className="h-full bg-muted/50 p-0 overflow-hidden">
                <div className="flex-1 relative h-full">
                  <Options />
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

        {/* Разделитель */}
        <ResizableHandle withHandle />

        {/* Нижнее окно с браузером и дорожками */}
        <ResizablePanel defaultSize={40} minSize={30} maxSize={70}>
          <ResizablePanelGroup direction="vertical" autoSaveId="dual-bottom-layout">
            <ResizablePanel defaultSize={40} minSize={20} maxSize={60}>
              <div className="h-full bg-muted/50 border-t border-border">
                <Browser />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={60}>
              <div className="h-full bg-muted/50 border-t border-border">
                <Timeline />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  // Основной макет (Классический)
  function ClassicMediaEditor() {
    return (
      <ResizablePanelGroup
        direction="vertical"
        className="min-h-0 flex-grow"
        autoSaveId="main-layout"
      >
        {/* Верхняя половина экрана */}
        <ResizablePanel defaultSize={mainLayout[0]} minSize={20} maxSize={80}>
          <ResizablePanelGroup direction="horizontal" autoSaveId="top-layout">
            <ResizablePanel defaultSize={25} minSize={20} maxSize={50}>
              <div className="h-full bg-muted/50 p-0 overflow-hidden">
                <div className="flex-1 relative h-full">
                  <Browser />
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={45} minSize={30} maxSize={65}>
              <div className="h-full bg-muted/50 border-l border-border">
                <ActiveVideo />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} minSize={15} maxSize={35}>
              <div className="h-full bg-muted/50 border-l border-border">
                <Options />
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
    )
  }

  // Вертикальный макет
  function VerticalMediaEditor() {
    return (
      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-0 flex-grow"
        autoSaveId="vertical-main-layout"
      >
        <ResizablePanel defaultSize={67} minSize={50} maxSize={80}>
          <ResizablePanelGroup direction="vertical" autoSaveId="vertical-left-layout">
            <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
              <div className="h-full bg-muted/50 p-0 overflow-hidden">
                <ResizablePanelGroup direction="horizontal" autoSaveId="vertical-top-layout">
                  <ResizablePanel defaultSize={40} minSize={40} maxSize={80}>
                    <div className="flex-1 relative h-full">
                      <Browser />
                    </div>
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={60} minSize={20} maxSize={60}>
                    <div className="h-full border-l border-border">
                      <Options />
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50}>
              <div className="h-full bg-muted/50 border-t border-border">
                <ResizablePanelGroup direction="horizontal" autoSaveId="vertical-timeline-layout">
                  <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
                    <div className="h-full">
                      <Editing />
                    </div>
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={75}>
                    <div className="h-full border-l border-border">
                      <Timeline />
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={33}>
          <div className="h-full bg-muted/50 border-l border-border">
            <ActiveVideo />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center">Загрузка...</div>
  }

  return (
    <div className="flex h-screen flex-col p-0 m-0">
      <CustomTopNavBar />
      {layoutMode === "classic" && <ClassicMediaEditor />}
      {layoutMode === "vertical" && <VerticalMediaEditor />}
      {layoutMode === "dual" && <DualMediaEditor />}
    </div>
  )
}
