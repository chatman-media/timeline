import { MediaFile } from "../types/videos"
import { useEffect, useState } from "react"

export function useThumbnailGeneration(rawVideos: MediaFile[]) {
  const [videos, setVideos] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (!rawVideos.length) return

    const generateThumbnails = async () => {
      setIsGenerating(true)

      const videosWithThumbnails: any[] = await Promise.all(
        rawVideos.map(async (video) => {
          try {
            const response = await fetch(`/api/thumbnail?video=${video.name}`)
            const blob = await response.blob()
            const thumbnailUrl = URL.createObjectURL(blob)

            return {
              ...video,
              thumbnailUrl,
            }
          } catch (error) {
            console.error(`Error generating thumbnail for ${video.name}:`, error)
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
