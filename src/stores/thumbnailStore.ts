import { createStore } from "@xstate/store"

interface ThumbnailState {
  thumbnails: Record<string, string[]>
}

declare global {
  interface Window {
    store: any
  }
}

const initialContext: ThumbnailState = {
  thumbnails: {},
}

export const thumbnailStore = createStore({
  context: initialContext,
  on: {
    addThumbnails: (
      context,
      event: {
        videoName: string
        scale: number
        count: number
        urls: string[]
      },
    ) => {
      const key = `${event.videoName}-${event.scale}-${event.count}`
      return {
        ...context,
        thumbnails: {
          ...context.thumbnails,
          [key]: event.urls,
        },
      }
    },
  },
})

export function getThumbnails(videoName: string, scale: number, count: number): string[] | null {
  const key = `${videoName}-${scale}-${count}`
  const state = thumbnailStore.getSnapshot()
  return state.context.thumbnails[key] || null
}

export function hasThumbnails(videoName: string, scale: number, count: number): boolean {
  const key = `${videoName}-${scale}-${count}`
  const state = thumbnailStore.getSnapshot()
  return key in state.context.thumbnails
}

if (typeof window !== "undefined") {
  globalThis.store = thumbnailStore
}

export default thumbnailStore
