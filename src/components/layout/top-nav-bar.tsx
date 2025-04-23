import { Keyboard, Layout, ListTodo, Save, Send, Settings, Upload, UserCog } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ExportDialog, ProjectSettingsDialog } from "@/dialogs"
import { cn } from "@/lib/utils"
import { LayoutMode, LayoutPreviews } from "@/media-editor"
import { useProject } from "@/project-settings/project-machine"

import { ThemeToggle } from "./theme-toggle"

interface TopNavBarProps {
  onLayoutChange: (mode: LayoutMode) => void
  layoutMode: LayoutMode
  hasExternalDisplay: boolean
}

export function TopNavBar({ onLayoutChange, layoutMode, hasExternalDisplay }: TopNavBarProps) {
  const { name, isDirty, setName, setDirty } = useProject()
  const [isEditing, setIsEditing] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false)

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setIsEditing(false)
    }
  }

  useEffect(() => {
    console.log("isUserSettingsOpen", isUserSettingsOpen)
  }, [isUserSettingsOpen])

  const handleSave = () => {
    setDirty(false)
  }

  const handleExport = () => {
    setIsExportOpen(true)
  }

  return (
    <div className="relative flex w-full items-center justify-between border border-b bg-gray-200 px-1 py-[2px] dark:bg-[#1b1a1f]">
      <div className="flex h-6 items-center">
        <ThemeToggle />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              className="hover:bg-secondary h-7 w-7 cursor-pointer p-0"
              variant="ghost"
              size="icon"
              title="Макет"
            >
              <Layout className="h-5 w-5" />
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
          className="hover:bg-secondary h-7 w-7 cursor-pointer p-0"
          variant="ghost"
          size="icon"
          title="Быстрые клавиши"
        >
          <Keyboard className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex items-center">
        <Button
          className="hover:bg-secondary h-7 w-7 cursor-pointer p-0"
          variant="ghost"
          size="icon"
          title="Настройки"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings className="h-5 w-5" />
        </Button>
        <Button
          className={cn(
            "hover:bg-secondary h-7 w-7 cursor-pointer p-0",
            isDirty ? "opacity-50 hover:opacity-50" : "hover:bg-accent opacity-100",
          )}
          variant="ghost"
          size="icon"
          title={isDirty ? "Все изменения сохранены" : "Сохранить изменения"}
          onClick={handleSave}
          disabled={isDirty}
        >
          <Save className="h-5 w-5" />
        </Button>

        <div
          className={cn(
            "group relative ml-1 w-[200px] text-xs",
            isEditing
              ? "ring-1 ring-[#35d1c1]"
              : "transition-colors group-hover:ring-1 group-hover:ring-[#35d1c1]",
          )}
          onClick={() => setIsEditing(true)}
        >
          {isEditing ? (
            <input
              id="project-name-input"
              type="text"
              value={name}
              onChange={handleNameChange}
              onKeyDown={handleKeyDown}
              onBlur={() => setIsEditing(false)}
              className="w-full bg-transparent pl-[1px] text-xs focus:outline-none"
              autoFocus
            />
          ) : (
            <span className="block truncate pl-[1px] hover:border hover:border-[#35d1c1] hover:pl-[0px]">
              {name}
            </span>
          )}
        </div>
      </div>
      <div className="flex h-6 items-center space-x-0">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              className="h-7 w-7 cursor-pointer p-0"
              variant="ghost"
              size="icon"
              title="Опубликовать"
            >
              <Send className="h-5 w-5" />
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
              className="h-7 w-7 cursor-pointer p-0"
              variant="ghost"
              size="icon"
              title="Задачи монтажа"
            >
              <ListTodo className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" sideOffset={0}>
            <div className="">
              <h4 className="text-sm font-semibold">Задачи Проекта</h4>
              <div className="h-10"></div>
            </div>
          </PopoverContent>
        </Popover>
        {/* <Button
          variant="ghost"
          size="icon"
          className="cursor-pointer p-0 h-7 w-7"
          title="Экспорт"
          onClick={() => setIsExportOpen(true)}
        >
          <Upload className="h-5 w-5" />
        </Button> */}
        <Button
          variant="ghost"
          size="icon"
          className="mr-1 h-7 w-7 cursor-pointer p-0"
          title="Настройки"
          onClick={() => setIsUserSettingsOpen(true)}
        >
          <UserCog className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-[26px] w-24 cursor-pointer border-none items-center gap-1 bg-[#38dacac3] px-1 text-sm text-black hover:bg-[#35d1c1] hover:text-black dark:bg-[#35d1c1] dark:hover:bg-[#35d1c1]"
          onClick={handleExport}
        >
          <span className="px-2 text-xs">Экспорт</span>
          <Upload className="h-5 w-5" />
        </Button>
      </div>
      <ExportDialog open={isExportOpen} onOpenChange={setIsExportOpen} />
      <ProjectSettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  )
}
