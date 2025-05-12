import { useTranslation } from "react-i18next"

import { usePlayerContext } from ".."

export function usePlayer() {
  const { t } = useTranslation()
  const { video, isVideoLoading, isVideoReady } = usePlayerContext()

  if (!video) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black">
        <p className="text-white">
          {t("timeline.player.noVideoSelected", "Select a video to play")}
        </p>
      </div>
    )
  }

  if (isVideoLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  if (!isVideoReady) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black">
        <p className="text-white">{t("timeline.player.videoLoadError", "Video loading error")}</p>
      </div>
    )
  }

  return <video className="h-full w-full bg-black" src={video.path} controls autoPlay />
}
