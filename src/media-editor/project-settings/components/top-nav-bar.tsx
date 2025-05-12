import { Keyboard, Layout, ListTodo, Save, Send, Settings, Upload, UserCog } from "lucide-react"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  ExportDialog,
  KeyboardShortcutsDialog,
  ProjectSettingsDialog,
  UserSettingsDialog,
} from "@/media-editor/dialogs"
import { useModalContext } from "@/media-editor/dialogs/services/modal-provider"
import { useAppHotkeys } from "@/media-editor/keyboard-shortcuts/use-app-hotkeys"
import { type LayoutMode, LayoutPreviews } from "@/media-editor/layouts"
import { useProject } from "@/media-editor/project-settings/project-provider"

import { BrowserToggleButton } from "./browser-toggle-button"
import { ThemeToggle } from "./theme-toggle"

interface TopNavBarProps {
  onLayoutChange: (mode: LayoutMode) => void
  layoutMode: LayoutMode
  hasExternalDisplay: boolean
}

function TopNavBarClient({ onLayoutChange, layoutMode, hasExternalDisplay }: TopNavBarProps) {
  const { name, isDirty, setName, setDirty } = useProject()
  const { t } = useTranslation()
  const { handleOpenModal, handleCloseModal, activeModal } = useModalContext()
  const [isEditing, setIsEditing] = useState(false)

  // Определяем состояния модальных окон на основе activeModal
  const isSettingsOpen = activeModal === "project-settings"
  const isUserSettingsOpen = activeModal === "user-settings"
  const isKeyboardShortcutsOpen = activeModal === "keyboard-shortcuts"
  const [isExportOpen, setIsExportOpen] = useState(false)

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

  // Используем хук для обработки горячих клавиш
  useAppHotkeys()

  return (
    <div className="relative flex w-full items-center justify-between border border-b bg-gray-200 px-1 py-[2px] dark:bg-[#1b1a1f]">
      <div className="flex h-6 items-center">
        <BrowserToggleButton />
        <ThemeToggle />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              className="hover:bg-secondary h-7 w-7 cursor-pointer p-0"
              variant="ghost"
              size="icon"
              title={t("topNavBar.layout")}
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
          title={t("topNavBar.keyboardShortcuts")}
          onClick={() => handleOpenModal("keyboard-shortcuts")}
        >
          <Keyboard className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex items-center">
        <Button
          className="hover:bg-secondary h-7 w-7 cursor-pointer p-0"
          variant="ghost"
          size="icon"
          title={t("topNavBar.projectSettings")}
          onClick={() => handleOpenModal("project-settings")}
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
          title={isDirty ? t("topNavBar.allChangesSaved") : t("topNavBar.saveChanges")}
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
              title={t("topNavBar.publish")}
            >
              <Send className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" sideOffset={0}>
            <div className="">
              <h4 className="text-sm font-semibold">{t("topNavBar.publicationTasks")}</h4>
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
              title={t("topNavBar.editingTasks")}
            >
              <ListTodo className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" sideOffset={0}>
            <div className="">
              <h4 className="text-sm font-semibold">{t("topNavBar.projectTasks")}</h4>
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
          title={t("topNavBar.userSettings")}
          onClick={() => handleOpenModal("user-settings")}
        >
          <UserCog className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-6 w-24 cursor-pointer items-center gap-1 border-none bg-[#38dacac3] px-1 text-sm text-black hover:bg-[#35d1c1] hover:text-black dark:bg-[#35d1c1] dark:hover:bg-[#35d1c1]"
          onClick={handleExport}
        >
          <span className="px-2 text-xs">{t("topNavBar.export")}</span>
          <Upload className="h-5 w-5" />
        </Button>
      </div>
      <ExportDialog
        open={isExportOpen}
        onOpenChange={(open) => {
          setIsExportOpen(open)
        }}
      />
      <ProjectSettingsDialog
        open={isSettingsOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseModal()
        }}
      />
      <UserSettingsDialog
        open={isUserSettingsOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseModal()
        }}
      />
      <KeyboardShortcutsDialog
        open={isKeyboardShortcutsOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseModal()
        }}
      />
    </div>
  )
}

// Экспортируем компонент с использованием dynamic для предотвращения ошибок гидратации
export const TopNavBar = dynamic(() => Promise.resolve(TopNavBarClient), {
  ssr: false,
})
