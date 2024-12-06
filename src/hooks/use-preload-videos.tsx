import { useEffect } from "react"

import { useVideoStore } from "@/stores/videoStore"

export function usePreloadVideos() {
  const { tracks, activeVideo } = useVideoStore()

  useEffect(() => {
    if (!activeVideo || !tracks.length) return

    const currentTrack = tracks.find((track) =>
      track.videos.some((video) => video.id === activeVideo.id)
    )

    if (currentTrack) {
      const currentIndex = currentTrack.videos.findIndex((video) => video.id === activeVideo.id)
      const videosToPreload = [
        currentTrack.videos[currentIndex - 1],
        currentTrack.videos[currentIndex + 1],
      ].filter(Boolean)

      videosToPreload.forEach((video) => {
        const link = document.createElement("link")
        link.rel = "preload"
        link.as = "video"
        link.href = video.path
        document.head.appendChild(link)
      })
    }
  }, [activeVideo, tracks])
}
