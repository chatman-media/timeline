import { create } from "zustand"

interface ThumbnailState {
  thumbnails: Record<string, string[]>
  addThumbnails: (videoName: string, scale: number, count: number, urls: string[]) => void
  getThumbnails: (videoName: string, scale: number, count: number) => string[] | null
  hasThumbnails: (videoName: string, scale: number, count: number) => boolean
}

declare global {
  interface Window {
    store: typeof useThumbnailStore
  }
}

const useThumbnailStore = create<ThumbnailState>((set, get) => ({
  thumbnails: {},

  addThumbnails: (videoName: string, scale: number, count: number, urls: string[]) => {
    const key = `${videoName}-${scale}-${count}`
    set((state) => ({
      thumbnails: {
        ...state.thumbnails,
        [key]: urls,
      },
    }))
  },

  getThumbnails: (videoName: string, scale: number, count: number) => {
    const key = `${videoName}-${scale}-${count}`
    return get().thumbnails[key] || null
  },

  hasThumbnails: (videoName: string, scale: number, count: number) => {
    const key = `${videoName}-${scale}-${count}`
    return key in get().thumbnails
  },
}))

if (typeof window !== "undefined") {
  window.store = useThumbnailStore
}

export default useThumbnailStore
