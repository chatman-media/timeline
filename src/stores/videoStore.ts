import { create } from "zustand"

import type { MediaFile, Track, TimeRange, ScreenLayout } from "@/types/videos"
import { calculateTimeRanges } from "@/utils/videoUtils"

interface VideoState {
  videos: MediaFile[]
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
  setActiveTrack: (trackId: string) => void
  setActiveVideo: (videoId: string) => void
  setIsPlaying: (isPlaying: boolean) => void
  setCurrentTime: (time: number) => void
  fetchVideos: () => Promise<void>
  setScreenLayout: (layout: ScreenLayout) => void

  // timeToPercent: (time: number) => number
  // percentToTime: (percent: number) => number
  addToMetadataCache: (key: string, data: any) => void
  addToThumbnailCache: (key: string, data: string) => void
}

export const useVideoStore = create<VideoState>((set, get) => ({
  videos: [],
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
    set({ currentTime: time })
  },

  fetchVideos: async () => {
    const { hasFetched } = get()
    if (hasFetched) return

    set({ isLoading: true, hasFetched: true })

    try {
      const response = await fetch("/api/videos")
      const data = await response.json()

      if (!data.media || !Array.isArray(data.media) || data.media.length === 0) {
        console.error("No videos received from API")
        set({ videos: [], isLoading: false })
        return
      }

      const validVideos = data.media
        .filter((v: MediaFile) => {
          const isVideo = v.probeData?.streams.some((s) => s.codec_type === "video")
          const hasCreationTime = !!v.probeData?.format.tags?.creation_time
          return isVideo && hasCreationTime
        })
        .sort((a: MediaFile, b: MediaFile) => {
          const timeA = new Date(a.probeData?.format.tags?.creation_time || 0).getTime()
          const timeB = new Date(b.probeData?.format.tags?.creation_time || 0).getTime()
          return timeA - timeB
        })
        .map((video: MediaFile, index: number) => ({
          ...video,
          id: `V${index + 1}`,
        }))

      if (validVideos.length === 0) {
        set({ videos: [], isLoading: false })
        return
      }

      // Group videos into tracks
      const tracks: Track[] = []
      validVideos.forEach((video: MediaFile) => {
        const trackId = video.id
        let track = tracks.find((t) => t.id === trackId)
        if (!track) {
          tracks.push({ id: trackId, videos: [], timeRanges: [], index: 0, isActive: false, combinedDuration: 0 })
        }
      })

      // Calculate time ranges for each track
      tracks.forEach((track) => {
        track.timeRanges = calculateTimeRanges(track.videos)
      })

      // Calculate overall time ranges
      // const overallTimeRanges = calculateTimeRanges(validVideos)

      set({
        videos: validVideos,
        tracks,
        // timeRanges: overallTimeRanges
        hasMedia: true,
      })
    } catch (error) {
      console.error("Error fetching videos:", error)
    } finally {
      set({ isLoading: false })
    }
  },

  addToMetadataCache: (key, data) => {
    set(state => ({
      metadataCache: {
        ...state.metadataCache,
        [key]: data
      }
    }))
  },

  addToThumbnailCache: (key, data) => {
    set(state => ({
      thumbnailCache: {
        ...state.thumbnailCache,
        [key]: data
      }
    }))
  }
}))
