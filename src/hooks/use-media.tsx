import { useEffect } from "react"

import { useVideoStore } from "@/stores/videoStore"

export function useMedia() {
  const store = useVideoStore()

  useEffect(() => {
    store.fetchVideos()
  }, [])

  return {
    ...store,
  }
}
