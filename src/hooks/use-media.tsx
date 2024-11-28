import { useVideoStore } from "@/stores/videoStore"
import { useEffect } from "react"

export function useMedia() {
  const store = useVideoStore()

  useEffect(() => {
    store.fetchVideos()
  }, [])

  useEffect(() => {
    store.updateActiveVideos()
  }, [store.currentTime])

  return {
    videos: store.videos,
    timeRanges: store.timeRanges,
    currentTime: store.currentTime,
    updateTime: store.setCurrentTime,
    isLoading: store.isLoading,
    hasVideos: store.hasVideos,
    setActiveCamera: store.setActiveCamera,
    isPlaying: store.isPlaying,
    setIsPlaying: store.setIsPlaying,
    timeToPercent: store.timeToPercent,
    percentToTime: store.percentToTime,
    assembledTracks: store.assembledTracks,
    videoRefs: store.videoRefs,
    maxDuration: Math.max(...store.timeRanges.map((x) => x.max)) -
      Math.min(...store.timeRanges.map((x) => x.min)),
    activeVideos: store.activeVideos,
    activeCamera: store.activeCamera,
    activeVideo: store.activeVideo,
  }
}
