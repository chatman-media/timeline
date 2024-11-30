import { useVideoStore } from "@/stores/videoStore"
import { useEffect } from "react"

export function useMedia() {
  const store = useVideoStore()

  useEffect(() => {
    store.fetchVideos()
    store.updateAssembledTracks()
  }, [])

  useEffect(() => {
    const currentVideoIsValid = store.activeVideo &&
      store.currentTime >=
        new Date(store.activeVideo.probeData.format.tags?.creation_time || 0).getTime() / 1000 &&
      store.currentTime <=
        (new Date(store.activeVideo.probeData.format.tags?.creation_time || 0).getTime() / 1000 +
          (store.activeVideo.probeData.format.duration || 0))

    if (!currentVideoIsValid && !store.isChangingCamera) {
      const currentTrack = store.assembledTracks.find((track) =>
        track.allVideos.some((video) => video.id === store.activeVideo?.id)
      )

      let availableVideo = currentTrack?.allVideos.find((video) => {
        const startTime = new Date(video.probeData.format.tags?.creation_time || 0).getTime() / 1000
        const endTime = startTime + (video.probeData.format.duration || 0)
        return store.currentTime >= startTime && store.currentTime <= endTime
      })

      if (availableVideo) {
        store.setActiveCamera(availableVideo.id)
      }
    }
  }, [store.currentTime, store.activeVideo, store.isChangingCamera])

  const play = () => {
    store.setIsPlaying(!store.isPlaying)
  }

  return {
    videos: store.videos,
    timeRanges: store.timeRanges,
    currentTime: store.currentTime,
    updateTime: store.setCurrentTime,
    isLoading: store.isLoading,
    hasVideos: store.hasVideos,
    setActiveCamera: store.setActiveCamera,
    setActiveVideo: store.setActiveVideo,
    isPlaying: store.isPlaying,
    setIsPlaying: store.setIsPlaying,
    play,
    timeToPercent: store.timeToPercent,
    percentToTime: store.percentToTime,
    assembledTracks: store.assembledTracks,
    videoRefs: store.videoRefs,
    maxDuration: Math.max(...store.timeRanges.map((x) => x.max)) -
      Math.min(...store.timeRanges.map((x) => x.min)),
    activeVideos: store.activeVideos,
    activeCamera: store.activeCamera,
    activeVideo: store.activeVideo,
    scenes: store.scenes,
    setScenes: store.setScenes,
    isChangingCamera: store.isChangingCamera,
  }
}
