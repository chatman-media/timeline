import { Cloud, Keyboard, Layout, ListTodo, Save, Send, Settings, Upload } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useRootStore } from "@/hooks/use-root-store"
import { cn } from "@/lib/utils"

import { ThemeToggle } from "../theme-toggle"
import { LayoutPreviews } from "./layouts/layout-previews"
import { SaveStatus } from "./save-status"

interface TopNavBarProps {
  onLayoutChange: (mode: string) => void
  layoutMode: string
  hasExternalDisplay: boolean
}

export function TopNavBar({ onLayoutChange, layoutMode, hasExternalDisplay }: TopNavBarProps) {
  const { saveState, isSaved, markAsSaved } = useRootStore()
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

  const handleSave = () => {
    saveState()
    markAsSaved()
  }

  return (
    <div className="flex items-center justify-between w-full py-[2px] px-1 bg-background border-b border-border relative">
      <div className="flex items-center h-6">
      <ThemeToggle />
      <Button
          className="cursor-pointer p-0 h-6 w-6"
          variant="ghost"
          size="icon"
          title="Быстрые клавиши"
        >
          <Keyboard className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="absolute left-0 right-0 flex justify-center pointer-events-none">
        <div
          className="text-xs font-medium relative group flex items-center gap-2 pointer-events-auto"
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
          <SaveStatus />
        </div>
      </div>
      <div className="flex items-center space-x-0 h-6">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              className="cursor-pointer p-0 h-6 w-6"
              variant="ghost"
              size="icon"
              title="Опубликовать"
            >
              <Send className="h-3.5 w-3.5" />
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
              className="cursor-pointer p-0 h-6 w-6"
              variant="ghost"
              size="icon"
              title="Задачи монтажа"
            >
              <ListTodo className="h-3.5 w-3.5" />
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
              <Layout className="h-3.5 w-3.5" />
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
          className={cn(
            "cursor-pointer p-0 h-6 w-6",
            "variant-ghost",
            "size-icon",
            isSaved
              ? "opacity-50 hover:opacity-50 cursor-not-allowed"
              : "opacity-100 hover:bg-accent",
          )}
          variant="ghost"
          size="icon"
          title={isSaved ? "Все изменения сохранены" : "Сохранить изменения"}
          onClick={handleSave}
          disabled={isSaved}
        >
          <Save className="h-3.5 w-3.5" />
        </Button>
        <Button className="cursor-pointer p-0 h-6 w-6" variant="ghost" size="icon" title="Облако">
          <Cloud className="h-3.5 w-3.5" />
        </Button>
        {/* <Button
          variant="ghost"
          size="icon"
          className="cursor-pointer p-0 h-6 w-6"
          title="Экспорт"
          onClick={() => setIsExportOpen(true)}
        >
          <Upload className="h-3.5 w-3.5" />
        </Button> */}
        <Button
          className="cursor-pointer p-0 h-6 w-6"
          variant="ghost"
          size="icon"
          title="Настройки"
        >
          <Settings className="h-3.5 w-3.5" />
        </Button>
      </div>
      {/* <ExportDialog open={isExportOpen} onOpenChange={setIsExportOpen} /> */}
    </div>
  )
}
