import { create } from "zustand"

import type { MediaFile, ScreenLayout, TimeRange, Track } from "@/types/videos"
import { generateVideoId } from "@/lib/utils"
import { createTracksFromFiles } from "@/utils/mediaUtils"

interface VideoState {
  videos: MediaFile[]
  media: MediaFile[]
  isLoading: boolean
  hasMedia: boolean
  isPlaying: boolean
  currentTime: number
  timeRanges: Record<string, TimeRange[]>
  tracks: Track[]
  videoRefs: { [key: string]: HTMLVideoElement }
  hasFetched: boolean
  isChangingCamera: boolean
  activeVideo?: MediaFile
  activeTrackId: string | null
  metadataCache: Record<string, any>
  thumbnailCache: Record<string, string>
  currentLayout: ScreenLayout

  // Actions
  setVideos: (videos: MediaFile[]) => void
  setHasFetched: (hasFetched: boolean) => void
  setMedia: (media: MediaFile[]) => void
  setActiveTrack: (trackId: string) => void
  setActiveVideo: (videoId: string) => void
  setIsPlaying: (isPlaying: boolean) => void
  setCurrentTime: (time: number) => void
  fetchVideos: () => Promise<void>
  setTracks: (tracks: Track[]) => void
  setScreenLayout: (layout: ScreenLayout) => void

  timeToPercent: (time: number) => number
  percentToTime: (percent: number) => number
  addToMetadataCache: (key: string, data: string) => void
  addToThumbnailCache: (key: string, data: string) => void
  addNewTracks: (media: MediaFile[]) => void
}

export const useVideoStore = create<VideoState>((set, get) => ({
  videos: [],
  media: [],
  isLoading: true,
  hasMedia: false,
  isPlaying: false,
  currentTime: 0,
  timeRanges: {},
  tracks: [],
  videoRefs: {},
  activeVideo: undefined,
  hasFetched: false,
  activeTrackId: null,
  isChangingCamera: false,
  metadataCache: {},
  thumbnailCache: {},
  currentLayout: { type: "1x1", activeTracks: ["T1"] },
  setScreenLayout: (layout) => set({ currentLayout: layout }),
  setVideos: (videos) => {
    set({
      videos,
      activeTrackId: "T1",
      activeVideo: videos.find((v) => v.id === "V1") || videos[0],
      hasMedia: videos.length > 0,
      isChangingCamera: false,
    })
  },
  setMedia: (media) => {
    set({ media })
  },

  fetchVideos: async () => {
    const { hasFetched } = get()
    if (hasFetched) return

    set({ isLoading: true, hasFetched: true })

    try {
      const response = await fetch("/api/media")
      const data = await response.json()

      if (!data.media || !Array.isArray(data.media) || data.media.length === 0) {
        console.error("No media received from API")
        set({ isLoading: false })
        return
      }
      set({ media: data.media })

      const validMedia = data.media
        .map((file: MediaFile) => ({
          ...file,
          id: file.id || generateVideoId(data.media),
        }))
        .filter((file: MediaFile) => file.duration)
        .sort((a: MediaFile, b: MediaFile) => (a.startTime || 0) - (b.startTime || 0))

      if (validMedia.length === 0) {
        set({ videos: [], isLoading: false })
        return
      }

      set({
        videos: validMedia,
        hasMedia: true,
      })
    } catch (error) {
      console.error("Error fetching videos:", error)
    } finally {
      set({ isLoading: false })
    }
  },

  setHasFetched: (hasFetched: boolean) => {
    set({ hasFetched })
  },

  setActiveVideo: (videoId) => {
    const { videos } = get()
    const targetVideo = videos.find((v) => v.id === videoId)
    if (targetVideo) {
      set({
        activeVideo: targetVideo,
      })
    }
  },
  setActiveTrack: (trackId) => {
    const { currentTime, tracks } = get()

    set({ isChangingCamera: true })

    try {
      const targetTrack = tracks.find((track) => track.id === trackId)

      if (!targetTrack) {
        console.warn(`Track ${trackId} not found`)
        return
      }

      // Find available video with better error handling
      const availableVideo = targetTrack.videos.find((video) => {
        if (!video.probeData?.format.tags?.creation_time) {
          console.warn(`Video ${video.id} missing creation time`)
          return false
        }

        const startTime = new Date(video.probeData.format.tags.creation_time).getTime() / 1000
        const endTime = startTime + (video.probeData.format.duration || 0)
        const tolerance = 0.3
        return currentTime >= (startTime - tolerance) && currentTime <= (endTime + tolerance)
      })

      if (availableVideo) {
        // Preload nearby videos before switching
        const preloadNearbyVideos = () => {
          const currentIndex = targetTrack.videos.indexOf(availableVideo)
          const nearbyVideos = [
            targetTrack.videos[currentIndex - 1],
            targetTrack.videos[currentIndex + 1],
          ].filter(Boolean)

          nearbyVideos.forEach((video) => {
            if (!video.path) {
              console.warn(`Missing path for video ${video.id}`)
              return
            }
            const preloadVideo = document.createElement("video")
            preloadVideo.src = video.path
            preloadVideo.preload = "auto"
            preloadVideo.load()
          })
        }

        set({
          activeTrackId: trackId,
          activeVideo: availableVideo,
        })

        // Preload videos in background
        requestIdleCallback(() => preloadNearbyVideos())
      } else {
        console.warn(`No available video found for time ${currentTime} in track ${trackId}`)
      }
    } catch (error) {
      console.error("Error while changing camera:", error)
    } finally {
      set({ isChangingCamera: false })
    }
  },
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (time) => {
    // const { activeVideo, videoRefs } = get()
    // if (activeVideo && videoRefs[activeVideo.id]) {
    //   const videoElement = videoRefs[activeVideo.id]
    //   const videoStartTime = activeVideo.startTime || 0
    //   videoElement.currentTime = time - videoStartTime // Adjust for video start time
    // }
    set({ currentTime: time })
  },

  setTracks: (tracks: Track[]) => set({ tracks }),

  addToMetadataCache: (key, data) => {
    set((state) => ({
      metadataCache: {
        ...state.metadataCache,
        [key]: data,
      },
    }))
  },

  addToThumbnailCache: (key, data) => {
    set((state) => ({
      thumbnailCache: {
        ...state.thumbnailCache,
        [key]: data,
      },
    }))
  },

  timeToPercent: (time: number) => {
    const { tracks } = get()
    const track = tracks.find((t) => t.id === get().activeTrackId)
    return (time / (track?.combinedDuration || 0)) * 100
  },

  percentToTime: (percent: number) => {
    const { tracks } = get()
    const track = tracks.find((t) => t.id === get().activeTrackId)
    return (percent / 100) * (track?.combinedDuration || 0)
  },

  addNewTracks: (media: MediaFile[]) => {
    const { tracks } = get()
    const newTracks = createTracksFromFiles(media, tracks.length)
    const uniqueNewTracks = newTracks.filter((t) => !(new Set(tracks.map((t) => t.id))).has(t.id))

    set((state) => ({
      tracks: [...state.tracks, ...uniqueNewTracks],
    }))
  },

  play: () => {
    set({ isPlaying: !get().isPlaying })
  },
}))
