import {
  ChevronDown,
  Cloud,
  Keyboard,
  Layout,
  ListTodo,
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
import { LayoutPreviews } from "./layouts/layout-previews"

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
            <LayoutPreviews
              onLayoutChange={onLayoutChange}
              layoutMode={layoutMode}
              hasExternalDisplay={hasExternalDisplay}
            />
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
