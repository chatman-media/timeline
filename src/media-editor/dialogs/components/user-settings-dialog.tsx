import { Folder, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Language,
  LANGUAGES,
  PreviewClickBehavior,
} from "@/media-editor/browser/machines/user-settings-machine"
import { useUserSettings } from "@/media-editor/browser/providers/user-settings-provider"

interface UserSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserSettingsDialog({ open, onOpenChange }: UserSettingsDialogProps) {
  const {
    language,
    screenshotsPath,
    previewClickBehavior,
    handleLanguageChange,
    handleScreenshotsPathChange,
    handlePreviewClickBehaviorChange,
  } = useUserSettings()
  const { t, i18n } = useTranslation()
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language)
  const [selectedScreenshotsPath, setSelectedScreenshotsPath] = useState<string>(screenshotsPath)
  const [selectedPreviewClickBehavior, setSelectedPreviewClickBehavior] =
    useState<PreviewClickBehavior>(previewClickBehavior)

  // Обновляем выбранный язык при изменении языка в контексте
  useEffect(() => {
    setSelectedLanguage(language)
  }, [language])

  // Обновляем выбранный путь скриншотов при изменении пути в контексте
  useEffect(() => {
    setSelectedScreenshotsPath(screenshotsPath)
  }, [screenshotsPath])

  // Обновляем выбранное поведение при клике на превью при изменении в контексте
  useEffect(() => {
    setSelectedPreviewClickBehavior(previewClickBehavior)
  }, [previewClickBehavior])

  // Проверяем соответствие языка в i18n и localStorage при открытии диалога
  useEffect(() => {
    if (open) {
      const storedLang = localStorage.getItem("app-language")
      console.log("UserSettingsDialog: Current i18n language:", i18n.language)
      console.log("UserSettingsDialog: Current context language:", language)
      console.log("UserSettingsDialog: localStorage language:", storedLang)

      // Если язык в localStorage отличается от текущего языка в контексте, обновляем его
      if (storedLang && LANGUAGES.includes(storedLang as Language) && storedLang !== language) {
        console.log(
          "UserSettingsDialog: Updating selected language to match localStorage:",
          storedLang,
        )
        setSelectedLanguage(storedLang as Language)
      }
    }
  }, [open, language, i18n.language])

  // Обработчик изменения языка - применяет изменения сразу
  const handleLanguageSelect = (value: string) => {
    const newLanguage = value as Language
    setSelectedLanguage(newLanguage)

    // Сразу применяем изменения языка
    console.log("Applying language change immediately:", newLanguage)

    // Сохраняем язык напрямую в localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("app-language", newLanguage)
      console.log("Directly saved language to localStorage:", newLanguage)
    }

    // Обновляем язык в i18next
    i18n.changeLanguage(newLanguage)

    // Обновляем язык в state machine
    handleLanguageChange(newLanguage)
  }

  // Обработчик изменения пути скриншотов
  const handleScreenshotsPathInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPath = e.target.value
    setSelectedScreenshotsPath(newPath)
  }

  // Обработчик изменения поведения при клике на превью
  const handlePreviewClickBehaviorSelect = (value: string) => {
    const newBehavior = value as PreviewClickBehavior
    setSelectedPreviewClickBehavior(newBehavior)
  }

  // Обработчик сохранения настроек
  const handleSaveSettings = () => {
    // Применяем изменения пути скриншотов
    if (selectedScreenshotsPath !== screenshotsPath) {
      console.log("Applying screenshots path change:", selectedScreenshotsPath)
      handleScreenshotsPathChange(selectedScreenshotsPath)
    }

    // Применяем изменения поведения при клике на превью
    if (selectedPreviewClickBehavior !== previewClickBehavior) {
      console.log("Applying preview click behavior change:", selectedPreviewClickBehavior)
      handlePreviewClickBehaviorChange(selectedPreviewClickBehavior)
    }

    // Закрываем диалог
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-sm dark:bg-[#1b1a1f] [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-md text-center">
            {t("dialogs.userSettings.title")}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-6 py-1">
          <div className="flex items-center justify-end">
            <Label className="mr-2 text-xs">{t("dialogs.userSettings.interfaceLanguage")}</Label>
            <Select value={selectedLanguage} onValueChange={handleLanguageSelect}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("dialogs.userSettings.interfaceLanguage")} />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {t(`language.native.${lang}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">
              {t(
                "dialogs.userSettings.previewClickBehavior",
                "Не дублировать превью видео в плеере",
              )}
            </Label>
            <Switch
              checked={selectedPreviewClickBehavior === "preview"}
              onCheckedChange={(checked) =>
                handlePreviewClickBehaviorSelect(checked ? "preview" : "player")
              }
            />
          </div>

          <div className="flex flex-col space-y-2">
            <Label className="text-xs font-medium">
              {t("dialogs.userSettings.screenshotsPath")}
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={selectedScreenshotsPath}
                  onChange={handleScreenshotsPathInput}
                  placeholder="public/screenshots"
                  className="h-9 pr-8 font-mono text-sm"
                />
                {selectedScreenshotsPath && selectedScreenshotsPath !== "public/screenshots" && (
                  <button
                    type="button"
                    onClick={() => setSelectedScreenshotsPath("public/screenshots")}
                    className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    title={t("dialogs.userSettings.clearPath")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-9 cursor-pointer"
                title={t("dialogs.userSettings.selectFolder")}
                onClick={() => {
                  // Предлагаем несколько стандартных папок для выбора
                  const folders = [
                    "public/screenshots",
                    "public/images/screenshots",
                    "public/media/screenshots",
                    "public/assets/screenshots",
                  ]

                  // Создаем диалог выбора папки
                  const selectedFolder = window.prompt(
                    t("dialogs.userSettings.selectFolderPrompt"),
                    folders.join("\n"),
                  )

                  if (selectedFolder) {
                    setSelectedScreenshotsPath(selectedFolder.trim())
                  }
                }}
              >
                <Folder className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-between space-x-4">
          <Button
            variant="default"
            className="flex-1 cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            {t("dialogs.userSettings.cancel")}
          </Button>
          <Button
            variant="default"
            className="flex-1 cursor-pointer bg-[#00CCC0] text-black hover:bg-[#00AAA0]"
            onClick={handleSaveSettings}
          >
            {t("dialogs.userSettings.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
