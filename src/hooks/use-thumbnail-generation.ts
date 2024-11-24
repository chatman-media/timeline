import { MediaFile, VideoWithThumbnail } from "../types/video"
import { useEffect, useState } from "react"

export function useThumbnailGeneration(rawVideos: MediaFile[]) {
  const [videos, setVideos] = useState<VideoWithThumbnail[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (!rawVideos.length) return

    const generateThumbnails = async () => {
      setIsGenerating(true)

      const videosWithThumbnails: VideoWithThumbnail[] = await Promise.all(
        rawVideos.map(async (video) => {
          try {
            const response = await fetch(`/api/thumbnail?video=${video.filename}`)
            const blob = await response.blob()
            const thumbnailUrl = URL.createObjectURL(blob)

            return {
              ...video,
              thumbnailUrl,
            }
          } catch (error) {
            console.error(`Error generating thumbnail for ${video.filename}:`, error)
            return {
              ...video,
              thumbnailUrl: "",
            }
          }
        }),
      )

      setVideos(videosWithThumbnails)
      setIsGenerating(false)
    }

    generateThumbnails()

    return () => {
      videos.forEach((video) => {
        if (video.thumbnailUrl) {
          URL.revokeObjectURL(video.thumbnailUrl)
        }
      })
    }
  }, [rawVideos])

  return { videos, isGenerating }
}
