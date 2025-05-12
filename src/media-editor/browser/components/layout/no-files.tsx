import { useTranslation } from "react-i18next"

export function NoFiles() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <div className="text-gray-600 dark:text-gray-400">{t("browser.noFiles.title")}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {t("browser.noFiles.addFilesPrompt")}
      </div>
      <div className="flex flex-col gap-2 text-sm">
        <div className="text-gray-500 dark:text-gray-400">
          <code className="rounded bg-gray-100 px-2 py-1 dark:bg-gray-800">/public/media/</code>
          <span className="ml-2">{t("browser.noFiles.mediaTypes")}</span>
        </div>
        <div className="text-gray-500 dark:text-gray-400">
          <code className="rounded bg-gray-100 px-2 py-1 dark:bg-gray-800">/public/music/</code>
          <span className="ml-2">{t("browser.noFiles.musicType")}</span>
        </div>
      </div>
      <div className="text-xs text-gray-400 dark:text-gray-500">
        {t("browser.noFiles.supportedVideoFormats")}
        <br />
        {t("browser.noFiles.supportedAudioFormats")}
      </div>
    </div>
  )
}
