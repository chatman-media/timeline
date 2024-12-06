import { useEffect } from "react"

import { STORAGE_KEYS } from "@/lib/constants"
import { isVideoAvailable } from "@/lib/utils"
import { useVideoStore } from "@/stores/videoStore"
import { MediaFile } from "@/types/videos"

export function useMedia() {
  const store = useVideoStore()

  useEffect(() => {
    store.fetchVideos()
  }, [])

  useEffect(() => {
    if (store.isChangingCamera) {
      const currentTrack = store.tracks.find((track) =>
        track.videos.some((video) => video.id === store.activeVideo?.id)
      )

      const availableVideo = currentTrack?.videos.find((video) =>
        isVideoAvailable(video, store.currentTime)
      )

      if (availableVideo?.id) {
        store.setActiveVideo(availableVideo.id)
      }
    } else {
      const currentVideoIsValid = store.activeVideo &&
        isVideoAvailable(store.activeVideo, store.currentTime, 0) // No tolerance for current video

      if (!currentVideoIsValid) {
        const currentTrack = store.tracks.find((track) =>
          track.videos.some((video) => video.id === store.activeVideo?.id)
        )

        const availableVideo = currentTrack?.videos.find((video: MediaFile) =>
          isVideoAvailable(video, store.currentTime)
        )

        if (availableVideo?.id) {
          store.setActiveVideo(availableVideo.id)
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
    ...store,
    play,
  }
}
