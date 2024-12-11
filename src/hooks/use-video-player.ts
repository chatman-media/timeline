import { MediaFile } from "@/types/videos"
import { useState, useCallback } from "react"

interface UseVideoPlayerProps {
  videoRefs: React.MutableRefObject<Record<string, HTMLVideoElement | null>>
}

export function useVideoPlayer({ videoRefs }: UseVideoPlayerProps) {
  const [playingFileId, setPlayingFileId] = useState<string | null>(null)

  const handlePlayPause = useCallback(
    async (e: React.MouseEvent, file: MediaFile, streamIndex: number) => {
      e.stopPropagation()
      const fileId = getFileId(file)
      const videoKey = `${fileId}-${streamIndex}`
      const mediaElement = videoRefs.current[videoKey]

      if (mediaElement) {
        try {
          if (playingFileId === fileId) {
            await mediaElement.pause()
            setPlayingFileId(null)
          } else {
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

  const handleMouseLeave = useCallback(async (fileId: string) => {
    const baseFileId = fileId.split("-")[0]
    if (playingFileId === baseFileId) {
      Object.entries(videoRefs.current).forEach(([key, player]) => {
        if (key.startsWith(baseFileId) && player) {
          player.pause()
        }
      })
      setPlayingFileId(null)
    }
  }, [playingFileId])

  return {
    playingFileId,
    setPlayingFileId,
    handlePlayPause,
    handleMouseLeave,
  }
} 