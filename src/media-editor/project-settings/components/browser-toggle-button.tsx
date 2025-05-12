import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { useBrowserVisibility } from "@/media-editor/browser/providers/browser-visibility-provider"

/**
 * Компонент кнопки для переключения видимости браузера в верхней панели навигации
 */
export function BrowserToggleButton() {
  const { t } = useTranslation()
  const { isBrowserVisible, toggleBrowserVisibility } = useBrowserVisibility()

  return (
    <Button
      className="hover:bg-secondary h-7 w-7 cursor-pointer p-0"
      variant="ghost"
      size="icon"
      onClick={toggleBrowserVisibility}
      title={t("topNavBar.toggleBrowser")}
    >
      {isBrowserVisible ? (
        <PanelLeftOpen className="h-5 w-5" />
      ) : (
        <PanelLeftClose className="h-5 w-5" />
      )}
    </Button>
  )
}
