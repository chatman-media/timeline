import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { useBrowserVisibility } from "@/media-editor/browser/providers/browser-visibility-provider"

/**
 * Компонент для переключения видимости браузера
 * Отображает кнопку со стрелкой влево/вправо в зависимости от текущего состояния
 */
export function BrowserToggle() {
  const { t } = useTranslation()
  const { isBrowserVisible, toggleBrowserVisibility } = useBrowserVisibility()

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`absolute transition-all duration-300 ${isBrowserVisible ? "-right-8" : "left-2"} top-2 z-50 h-8 w-8 rounded-full bg-gray-200 p-1 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer`}
      onClick={toggleBrowserVisibility}
      title={isBrowserVisible ? t("browser.hide") : t("browser.show")}
    >
      {isBrowserVisible ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
    </Button>
  )
}
