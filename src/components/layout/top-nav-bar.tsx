import { Keyboard, Layout, ListTodo, Save, Send, Settings } from "lucide-react"
import { useState } from "react"

import { ProjectSettingsDialog } from "@/components/dialogs/project-settings-dialog"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useProject } from "@/machines/project-machine"

import { ThemeToggle } from "../layout/theme-toggle"
import { LayoutMode, LayoutPreviews } from "../media-editor"

interface TopNavBarProps {
  onLayoutChange: (mode: LayoutMode) => void
  layoutMode: LayoutMode
  hasExternalDisplay: boolean
}

export function TopNavBar({ onLayoutChange, layoutMode, hasExternalDisplay }: TopNavBarProps) {
  const { name, isDirty, setName, setDirty } = useProject()
  const [isEditing, setIsEditing] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setIsEditing(false)
    }
  }

  const handleSave = () => {
    setDirty(false)
  }

  return (
    <div className="flex items-center justify-between w-full py-[2px] px-1 bg-gray-200 dark:bg-[#1b1a1f] relative">
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
      <div className="flex items-center gap-2">
        <Button
          className="cursor-pointer p-0 h-6 w-6"
          variant="ghost"
          size="icon"
          title="Настройки"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings className="h-3.5 w-3.5" />
        </Button>
        <Button
          className={cn(
            "cursor-pointer p-0 h-6 w-6",
            isDirty ? "opacity-50 hover:opacity-50" : "opacity-100 hover:bg-accent",
          )}
          variant="ghost"
          size="icon"
          title={isDirty ? "Все изменения сохранены" : "Сохранить изменения"}
          onClick={handleSave}
          disabled={isDirty}
        >
          <Save className="h-3.5 w-3.5" />
        </Button>

        <div
          className={cn(
            "relative group w-[200px] text-xs",
            isEditing
              ? "ring-1 ring-[#3ebfb2]"
              : "group-hover:ring-1 group-hover:ring-[#3ebfb2] transition-colors",
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
              className="text-xs bg-transparent focus:outline-none w-full pl-[1px]"
              autoFocus
            />
          ) : (
            <span className="block truncate hover:border pl-[1px] hover:pl-[0px] hover:border-[#3ebfb2]">
              {name}
            </span>
          )}
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
        {/* <Button
          variant="ghost"
          size="icon"
          className="cursor-pointer p-0 h-6 w-6"
          title="Экспорт"
          onClick={() => setIsExportOpen(true)}
        >
          <Upload className="h-3.5 w-3.5" />
        </Button> */}
      </div>
      {/* <ExportDialog open={isExportOpen} onOpenChange={setIsExportOpen} /> */}
      <ProjectSettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  )
}
