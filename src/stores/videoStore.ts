import { create } from "zustand"

import type { MediaFile, ScreenLayout, TimeRange, Track } from "@/types/videos"
import { calculateTimeRanges } from "@/utils/videoUtils"

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
        .filter((v: MediaFile) => {
          const isVideo = v.probeData?.streams.some((s) =>
            s.codec_type === "video" || s.codec_type === "audio"
          )
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
          id: video.probeData?.streams[0].codec_type === "audio"
            ? `A${index + 1}`
            : `V${index + 1}`,
        }))

      if (validMedia.length === 0) {
        set({ videos: [], isLoading: false })
        return
      }
      const videos = validMedia.filter((v: MediaFile) =>
        v.probeData?.streams[0].codec_type !== "video"
      )

      // Calculate timeRanges for each track
      const tracks: Track[] = []
      const timeRanges: Record<string, TimeRange[]> = {}

      videos.forEach((video: MediaFile) => {
        const trackId = video.id
        let track = tracks.find((t) => t.id === trackId)

        if (!track) {
          const newTimeRanges = calculateTimeRanges([video])
          track = {
            id: trackId,
            videos: [video],
            timeRanges: newTimeRanges,
            index: tracks.length,
            isActive: false,
            combinedDuration: video.probeData?.format.duration || 0,
          }
          tracks.push(track)
          trackId && (timeRanges[trackId] = newTimeRanges)
        } else {
          track.videos.push(video)
          track.combinedDuration += video.probeData?.format.duration || 0
          track.timeRanges = calculateTimeRanges(track.videos)
          track.id && (timeRanges[track.id] = track.timeRanges)
        }
      })

      set({
        videos,
        // tracks,
        timeRanges,
        hasMedia: true,
        activeTrackId: "T1",
        activeVideo: videos.find((v: MediaFile) => v.id === "V1") || videos[0],
      })
    } catch (error) {
      console.error("Error fetching videos:", error)
    } finally {
      set({ isLoading: false })
    }
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
}))
