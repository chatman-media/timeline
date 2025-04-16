import { useCallback, useState } from "react"

import { MediaFile } from "@/types/media"

interface UseVideoPlayerProps {
  videoRefs: React.MutableRefObject<Record<string, HTMLVideoElement | null>>
}

export function useVideoPlayer({ videoRefs }: UseVideoPlayerProps) {
  const [playingFileId, setPlayingFileId] = useState<string | null>(null)

  const handlePlayPause = useCallback(
    async (e: React.MouseEvent, file: MediaFile, streamIndex: number) => {
      e.stopPropagation()
      const fileId = file.id
      const videoKey = `${fileId}-${streamIndex}`
      const mediaElement = videoRefs.current[videoKey]

      if (mediaElement) {
        try {
          if (playingFileId === fileId) {
            await mediaElement.pause()
            setPlayingFileId(null)
          } else {
            // Останавливаем предыдущее видео, если оно было
            if (playingFileId) {
              Object.entries(videoRefs.current).forEach(([key, player]) => {
                if (key.startsWith(playingFileId) && player) {
                  player.pause()
                }
              })
            }

            await mediaElement.play()
            setPlayingFileId(fileId)
          }
        } catch (error) {
          console.error("Playback error:", error)
          setPlayingFileId(null)
        }
      }
    },
    [playingFileId],
  )

  // Упрощенный обработчик для выхода курсора с видео
  const handleMouseLeave = useCallback(
    (fileId: string) => {
      const baseFileId = fileId.split("-")[0]
      const [prefix, streamIndex] = fileId.split("-")

      // Находим конкретный элемент видео и останавливаем его
      const videoElement = videoRefs.current[fileId]
      if (videoElement && !videoElement.paused) {
        videoElement.pause()
      }

      // Сбрасываем индикатор проигрывания, если это было активное видео
      if (playingFileId === baseFileId) {
        setPlayingFileId(null)
      }
    },
    [playingFileId],
  )

  return {
    playingFileId,
    setPlayingFileId,
    handlePlayPause,
    handleMouseLeave,
  }
}
