import { useState } from "react"
import { useTranslation } from "react-i18next"

export function SubtitlesList() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between p-1">
        <div className="relative w-[50%]">
          <input
            type="text"
            placeholder={t("browser.subtitles.search")}
            className="focus:ring-primary w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm focus:ring-2 focus:outline-none dark:border-gray-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("browser.subtitles.dragHint")}
          </p>
        </div>
      </div>
    </div>
  )
}
