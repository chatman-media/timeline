import { useEffect, useState } from "react"

import { MediaFile } from "../types/videos"

export function useThumbnailGeneration(rawVideos: MediaFile[]) {
  const [videos, setVideos] = useState<MediaFile[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (!rawVideos.length) return

    const generateThumbnails = async () => {
      setIsGenerating(true)

      const videosWithThumbnails: MediaFile[] = await Promise.all(
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
              thumbnail: "",
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
        if (video.thumbnail) {
          URL.revokeObjectURL(video.thumbnail)
        }
      })
    }
  }, [rawVideos])

  return { videos, isGenerating }
}
