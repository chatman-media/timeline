import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { useEffect } from "react"

import { useMedia } from "@/hooks/use-media"
import { LoadingState } from "@/components/loading-state"
import { NoFiles } from "@/components/no-files"
import { MediaPlayer } from "@/components/media-player"

// Инициализируем плагин duration
dayjs.extend(duration)
dayjs.extend(utc)
dayjs.extend(timezone)

export default function Home() {
  const {
    isLoading,
    currentTime,
    hasVideos,
    play,
    isPlaying,
    activeCamera,
    setActiveCamera,
    isChangingCamera,
    assembledTracks,
  } = useMedia()

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Handle camera switching (1-9)
      const cameraNumber = parseInt(e.key)
      if (!isNaN(cameraNumber) && cameraNumber >= 1 && cameraNumber <= 9) {
        const targetCamera = `V${cameraNumber}`
        // Проверяем наличие трека для этой камеры
        const trackExists = assembledTracks.some((track) => track.index === cameraNumber)
        if (trackExists) {
          setActiveCamera(targetCamera)
        }
      }

      // Handle play/pause (P key)
      if (e.key.toLowerCase() === "p" || e.key.toLowerCase() === " ") {
        play()
      }
    }

    globalThis.addEventListener("keydown", handleKeyPress)
    return () => globalThis.removeEventListener("keydown", handleKeyPress)
  }, [assembledTracks, play, isChangingCamera])

  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)] relative bg-white dark:bg-[#0A0A0A]">
      {isLoading ? <LoadingState /> : hasVideos ? <NoFiles /> : (
        <MediaPlayer
          currentTime={currentTime}
          play={play}
          isPlaying={isPlaying}
          activeCamera={activeCamera}
        />
      )}
    </div>
  )
}
