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
} from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { ThemeToggle } from "../theme-toggle"
import { TrackLines } from "./track-lines"

interface TopNavBarProps {
  onLayoutChange: (mode: string) => void;
  layoutMode: string;
  hasExternalDisplay: boolean;
}

export function TopNavBar({
  onLayoutChange,
  layoutMode,
  hasExternalDisplay,
}: TopNavBarProps) {
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
          !document.activeElement?.id?.includes("project-name") &&
          setIsEditing(false)
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
            <Button
              className="cursor-pointer"
              variant="ghost"
              size="icon"
              title="Опубликовать"
            >
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
            <Button
              className="cursor-pointer"
              variant="ghost"
              size="icon"
              title="Список задач"
            >
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
            <Button
              className="cursor-pointer"
              variant="ghost"
              size="icon"
              title="Макет"
            >
              <Layout className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-2" sideOffset={0}>
            <div className="flex flex-col gap-2">
              <div className="flex justify-around gap-2">
                <div
                  className={`flex flex-col items-center cursor-pointer ${
                    layoutMode === "default" ? "bg-muted" : "hover:bg-muted"
                  } p-2 pb-1`}
                  onClick={() => onLayoutChange("default")}
                >
                  <div className="w-40 h-24 border-2 border-gray-700 bg-muted flex flex-row mb-1">
                    <div className="w-[75%] h-full flex flex-col">
                      <div className="h-[60%] w-full flex border-b-2 border-gray-700">
                        <div className="w-[30%] border-r-2 border-gray-700 p-1">
                          <div className="h-1 w-full bg-primary/70 rounded-sm mb-1"></div>
                          <div className="h-1 w-full bg-primary/70 rounded-sm"></div>
                        </div>
                        <div className="w-[70%] flex items-center justify-center border-gray-700">
                          <div className="w-[90%] h-[90%] border-2 border-gray-700 bg-muted flex items-center justify-center">
                            <Play className="h-3 w-3 text-primary" />
                          </div>
                        </div>
                      </div>
                      <div className="h-[40%] w-full flex">
                        <div className="w-[30%] border-r-2 border-gray-700 p-1">
                          <div className="h-1 w-full bg-primary/70 rounded-sm mb-1"></div>
                          <div className="h-1 w-full bg-primary/70 rounded-sm"></div>
                        </div>
                        <div className="w-[70%] relative px-2 py-1">
                          <div className="h-2 w-full bg-primary/70 rounded-sm mb-1"></div>
                          <div className="h-2 w-[75%] bg-primary/70 rounded-sm"></div>
                        </div>
                      </div>
                    </div>
                    <div className="w-[25%] h-full border-l-2 border-gray-700 p-1">
                      <div className="h-1 w-full bg-primary/70 rounded-sm mb-2"></div>
                      <div className="h-1 w-full bg-primary/70 rounded-sm mb-1"></div>
                      <div className="h-1 w-full bg-primary/70 rounded-sm mb-1"></div>
                      <div className="h-1 w-full bg-primary/70 rounded-sm mb-1"></div>
                      <div className="h-1 w-full bg-primary/70 rounded-sm"></div>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium">По умолчанию</span>
                </div>

                <div
                  className={`flex flex-col items-center cursor-pointer ${
                    layoutMode === "classic" ? "bg-muted" : "hover:bg-muted"
                  } p-2 pb-1`}
                  onClick={() => onLayoutChange("classic")}
                >
                  <div className="w-40 h-24 border-2 border-gray-700 bg-muted flex flex-col mb-1">
                    <div className="h-[50%] w-full flex border-b-2 border-gray-700">
                      <div className="w-[30%] border-r-2 border-gray-700 p-1">
                        <div className="h-2 w-full mb-1 flex items-center gap-1">
                          <div className="h-2 w-[25%] rounded-full bg-primary/70"></div>
                          <div className="h-2 w-[75%] rounded-full bg-primary/70"></div>
                          <div className="h-2 w-3 rounded-full bg-primary/70"></div>
                          <div className="h-2 w-3 rounded-full bg-primary/70"></div>
                          <div className="h-2 w-3 rounded-full bg-primary/70"></div>
                        </div>
                      </div>
                      <div className="w-[50%] flex items-center justify-center border-r-2 border-gray-700">
                        <Play className="w-4 h-4 text-primary" />
                      </div>
                      <div className="w-[20%] p-1">
                        <div className="h-2 w-full bg-primary/70 rounded-sm mb-1"></div>
                        <div className="h-2 w-full bg-primary/70 rounded-sm"></div>
                      </div>
                    </div>
                    <div className="h-[50%] w-full flex">
                      <div className="w-[30%] border-r-2 border-gray-700 p-1">
                        <div className="h-2 w-full bg-primary/70 rounded-sm mb-1"></div>
                        <div className="h-2 w-full bg-primary/70 rounded-sm"></div>
                      </div>
                      <div className="w-[70%] relative px-2 py-1">
                        <TrackLines />
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium">Классический</span>
                </div>
              </div>

              <div className="flex justify-around gap-2">
                <div
                  className={`flex flex-col items-center cursor-pointer ${
                    layoutMode === "vertical" ? "bg-muted" : "hover:bg-muted"
                  } p-2 pb-1`}
                  onClick={() => onLayoutChange("vertical")}
                >
                  <div className="w-40 h-24 border-2 border-gray-700 bg-muted flex flex-row mb-1">
                    <div className="w-[67%] h-full flex flex-col">
                      <div className="h-[50%] w-full flex border-b-2 border-gray-700">
                        <div className="w-[70%] p-1">
                          <div className="h-2 w-full bg-primary/70 rounded-sm mb-1"></div>
                          <div className="h-2 w-full bg-primary/70 rounded-sm"></div>
                        </div>
                        <div className="w-[30%] border-l-2 border-gray-700 p-1">
                          <div className="h-2 w-full bg-primary/70 rounded-sm mb-1"></div>
                          <div className="h-2 w-full bg-primary/70 rounded-sm"></div>
                        </div>
                      </div>
                      <div className="h-[50%] w-full flex">
                        <div className="w-[30%] border-r-2 border-gray-700 p-1">
                          <div className="h-2 w-full bg-primary/70 rounded-sm mb-1"></div>
                          <div className="h-2 w-full bg-primary/70 rounded-sm"></div>
                        </div>
                        <div className="w-[70%] relative px-2 py-1">
                          <TrackLines />
                        </div>
                      </div>
                    </div>
                    <div className="w-[33%] border-l-2 border-gray-700 flex items-center justify-center">
                      <Play className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <span className="text-[10px] font-medium">Вертикальное</span>
                </div>

                <div
                  className={`flex flex-col items-center ${
                    hasExternalDisplay
                      ? "cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  } ${
                    layoutMode === "dual"
                      ? "bg-muted"
                      : hasExternalDisplay
                        ? "hover:bg-muted"
                        : ""
                  } p-2 pb-1`}
                  onClick={() => hasExternalDisplay && onLayoutChange("dual")}
                  title={
                    hasExternalDisplay
                      ? "Двойной вид"
                      : "Требуется внешний монитор"
                  }
                >
                  <div className="w-40 h-24 bg-background flex items-center justify-center mb-1 relative">
                    <div className="absolute right-4 translate-y-2 w-24 h-14 border-2 border-gray-700 bg-muted">
                      <div className="w-full h-1/2 border-b-2 border-gray-700 flex items-center justify-center">
                        <div className="h-2 w-[80%] bg-primary/70 rounded-sm"></div>
                      </div>
                      <div className="w-full h-1/2 flex items-center justify-center">
                        <div className="h-2 w-[60%] bg-primary/70 rounded-sm"></div>
                      </div>
                    </div>
                    <div className="absolute left-4 -translate-y-2 w-24 h-14 border-2 border-gray-700 bg-muted z-10">
                      <div className="flex h-full">
                        <div className="w-[70%] border-r-2 border-gray-700 flex items-center justify-center">
                          <Play className="w-3 h-3 text-primary" />
                        </div>
                        <div className="w-[30%] p-1">
                          <div className="h-1.5 w-full bg-primary/70 rounded-sm mb-1"></div>
                          <div className="h-1.5 w-[80%] bg-primary/70 rounded-sm"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium">Двойной</span>
                  {!hasExternalDisplay && (
                    <span className="text-[9px] text-muted-foreground">
                      Нужен внешний монитор
                    </span>
                  )}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Button
          className="cursor-pointer"
          variant="ghost"
          size="icon"
          title="Сохранить"
        >
          <Save className="h-3 w-3" />
        </Button>
        <Button
          className="cursor-pointer"
          variant="ghost"
          size="icon"
          title="Быстрые клавиши"
        >
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
        <Button
          className="cursor-pointer"
          variant="ghost"
          size="icon"
          title="Настройки"
        >
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
                Экспорт{" "}
                <ChevronDown className="h-3 w-3 p-0 m-0 cursor-pointer" />
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
