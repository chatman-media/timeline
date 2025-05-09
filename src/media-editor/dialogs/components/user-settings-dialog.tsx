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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Language } from "@/media-editor/browser/machines/user-settings-machine"
import { useUserSettings } from "@/media-editor/browser/providers/user-settings-provider"

interface UserSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserSettingsDialog({ open, onOpenChange }: UserSettingsDialogProps) {
  const { language, handleLanguageChange } = useUserSettings()
  const { t, i18n } = useTranslation()
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language)

  // Обновляем выбранный язык при изменении языка в контексте
  useEffect(() => {
    setSelectedLanguage(language)
  }, [language])

  // Проверяем соответствие языка в i18n и localStorage при открытии диалога
  useEffect(() => {
    if (open) {
      const storedLang = localStorage.getItem("app-language")
      console.log("UserSettingsDialog: Current i18n language:", i18n.language)
      console.log("UserSettingsDialog: Current context language:", language)
      console.log("UserSettingsDialog: localStorage language:", storedLang)

      // Если язык в localStorage отличается от текущего языка в контексте, обновляем его
      if (storedLang && (storedLang === "ru" || storedLang === "en") && storedLang !== language) {
        console.log(
          "UserSettingsDialog: Updating selected language to match localStorage:",
          storedLang,
        )
        setSelectedLanguage(storedLang as Language)
      }
    }
  }, [open, language, i18n.language])

  // Обработчик изменения языка
  const handleLanguageSelect = (value: string) => {
    setSelectedLanguage(value as Language)
  }

  // Обработчик сохранения настроек
  const handleSave = () => {
    console.log("Saving language settings:", selectedLanguage)

    // Сначала сохраняем язык напрямую в localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("app-language", selectedLanguage)
      console.log("Directly saved language to localStorage:", selectedLanguage)
    }

    // Затем обновляем язык в i18next
    i18n.changeLanguage(selectedLanguage)

    // И наконец обновляем язык в state machine
    handleLanguageChange(selectedLanguage)

    // Проверяем, что язык был сохранен
    if (typeof window !== "undefined") {
      console.log("Verified localStorage language value:", localStorage.getItem("app-language"))
      console.log("Current i18n language:", i18n.language)
    }

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
                <SelectItem value="ru">{t("language.ru")}</SelectItem>
                <SelectItem value="en">{t("language.en")}</SelectItem>
              </SelectContent>
            </Select>
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
            onClick={handleSave}
          >
            {t("dialogs.userSettings.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
