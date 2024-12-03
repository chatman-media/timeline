import { useEffect } from "react"

import { STORAGE_KEYS } from "@/lib/constants"
import { isVideoAvailable } from "@/lib/utils"
import { useVideoStore } from "@/stores/videoStore"

export function useMedia() {
  const store = useVideoStore()

  useEffect(() => {
    store.fetchVideos()
    store.updateAssembledTracks()
  }, [])

  useEffect(() => {
    if (store.isChangingCamera) {
      const currentTrack = store.assembledTracks.find((track) =>
        track.allVideos.some((video) => video.id === store.activeVideo?.id)
      )

      const availableVideo = currentTrack?.allVideos.find((video) =>
        isVideoAvailable(video, store.currentTime)
      )

      if (availableVideo) {
        store.setActiveCamera(availableVideo.id)
      }
    } else {
      const currentVideoIsValid = store.activeVideo &&
        isVideoAvailable(store.activeVideo, store.currentTime, 0) // No tolerance for current video

      if (!currentVideoIsValid) {
        const currentTrack = store.assembledTracks.find((track) =>
          track.allVideos.some((video) => video.id === store.activeVideo?.id)
        )

        const availableVideo = currentTrack?.allVideos.find((video) =>
          isVideoAvailable(video, store.currentTime)
        )

        if (availableVideo) {
          store.setActiveCamera(availableVideo.id)
        }
      }
    }
  }, [store.currentTime, store.activeVideo, store.isChangingCamera])

  useEffect(() => {
    // Вариант 1: Использовать sessionStorage вместо localStorage
    sessionStorage.setItem(STORAGE_KEYS.CURRENT_TIME, store.currentTime.toString())
  }, [store.currentTime])

  // Вариант 2: Сохранять только при важных событиях
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem(STORAGE_KEYS.CURRENT_TIME, store.currentTime.toString())
    }

    globalThis.addEventListener("beforeunload", handleBeforeUnload)
    return () => globalThis.removeEventListener("beforeunload", handleBeforeUnload)
  }, [store.currentTime])

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
