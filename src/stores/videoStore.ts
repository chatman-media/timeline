import { create } from 'zustand'
import type { AssembledTrack, MediaFile } from "@/types/videos"
import { TimeRange } from "@/types/scene"
import { RefObject } from 'react'

interface VideoState {
  videos: MediaFile[]
  isLoading: boolean
  hasVideos: boolean
  activeCamera: number
  isPlaying: boolean
  currentTime: number
  timeRanges: TimeRange[]
  assembledTracks: AssembledTrack[]
  videoRefs: { [key: string]: HTMLVideoElement }
  hasFetched: boolean
  activeVideos: MediaFile[]
  mainCamera: string

  // Actions
  setVideos: (videos: MediaFile[]) => void
  setActiveCamera: (camera: number) => void
  setIsPlaying: (isPlaying: boolean) => void
  setCurrentTime: (time: number) => void
  fetchVideos: () => Promise<void>
  timeToPercent: (time: number) => number
  percentToTime: (percent: number) => number
  updateAssembledTracks: () => void
  updateActiveVideos: () => void
  setMainCamera: (camera: string) => void
}

export const useVideoStore = create<VideoState>((set, get) => ({
  videos: [],
  isLoading: true,
  hasVideos: false,
  activeCamera: 1,
  isPlaying: false,
  currentTime: 0,
  timeRanges: [],
  assembledTracks: [],
  videoRefs: {},
  hasFetched: false,
  activeVideos: [],
  mainCamera: '',

  setVideos: (videos) => {
    const firstVideo = videos[0]?.name || ''
    set({ 
      videos,
      mainCamera: firstVideo,
      hasVideos: videos.length > 0 
    })
    get().updateActiveVideos()
  },
  setActiveCamera: (camera) => set({ activeCamera: camera }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (time) => {
    set({ currentTime: time })
    get().updateActiveVideos()
  },

  timeToPercent: (time) => {
    const { timeRanges } = get()
    if (timeRanges.length === 0) return 0
    const minTime = Math.min(...timeRanges.map((x) => x.min))
    const maxTime = Math.max(...timeRanges.map((x) => x.max))
    const duration = maxTime - minTime
    return ((time - minTime) / duration) * 100
  },

  percentToTime: (percent) => {
    const { timeRanges } = get()
    if (timeRanges.length === 0) return 0
    const minTime = Math.min(...timeRanges.map((x) => x.min))
    const maxTime = Math.max(...timeRanges.map((x) => x.max))
    const duration = maxTime - minTime
    return minTime + (duration * percent) / 100
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

      const validVideos = data.media.filter((v: MediaFile) => {
        const isVideo = v.probeData.streams.some((s) => s.codec_type === "video")
        const hasCreationTime = !!v.probeData.format.tags?.creation_time
        return isVideo && hasCreationTime
      })

      if (validVideos.length === 0) {
        set({ videos: [], isLoading: false })
        return
      }

      const sortedVideos = validVideos.sort((a: MediaFile, b: MediaFile) => {
        const timeA = new Date(a.probeData.format.tags!.creation_time).getTime()
        const timeB = new Date(b.probeData.format.tags!.creation_time).getTime()
        return timeA - timeB
      })

      // Calculate time ranges
      const times = sortedVideos.flatMap((v: MediaFile) => {
        const startTime = new Date(v.probeData.format.tags!.creation_time).getTime()
        const duration = v.probeData.format.duration || 0
        const endTime = startTime + duration * 1000
        return [startTime, endTime]
      })

      if (times.length > 0) {
        const sortedTimes = times.sort((a: number, b: number) => a - b)
        const ranges: TimeRange[] = []
        let currentRange = {
          min: Math.floor(sortedTimes[0] / 1000),
          max: Math.floor(sortedTimes[0] / 1000),
          duration: Math.floor(sortedTimes[1] / 1000) - Math.floor(sortedTimes[0] / 1000),
        }

        for (let i = 1; i < sortedTimes.length; i++) {
          const currentTime = Math.floor(sortedTimes[i] / 1000)
          const gap = currentTime - currentRange.max

          if (gap > 3600) {
            ranges.push(currentRange)
            currentRange = {
              min: currentTime,
              max: currentTime,
              duration: 0,
            }
          } else {
            currentRange.max = currentTime
          }
        }
        ranges.push(currentRange)

        set({ 
          timeRanges: ranges,
          currentTime: ranges[0].min,
          videos: sortedVideos,
          hasVideos: true
        })
      }

    } catch (error) {
      console.error("Error fetching videos:", error)
    } finally {
      set({ isLoading: false })
    }
  },

  updateAssembledTracks: () => {
    const { videos } = get()
    if (!videos.length) return
    const videoGroups = new Map<string, MediaFile[]>()

    videos.forEach((video) => {
      const videoStream = video.probeData.streams.find((s) => s.codec_type === "video")
      if (!videoStream) return

      // Create a unique key for each camera type based on resolution and aspect ratio
      const cameraKey =
        `${videoStream.width}x${videoStream.height}_${videoStream.profile}_${videoStream.codec_name}`

      if (!videoGroups.has(cameraKey)) {
        videoGroups.set(cameraKey, [])
      }
      videoGroups.get(cameraKey)?.push(video)
    })

    // Sort videos within each group by creation time
    videoGroups.forEach((groupVideos) => {
      groupVideos.sort((a, b) => {
        const timeA = new Date(a.probeData.format.tags?.creation_time || 0).getTime()
        const timeB = new Date(b.probeData.format.tags?.creation_time || 0).getTime()
        return timeA - timeB
      })
    })

    // Create assembled tracks
    const tracks: AssembledTrack[] = Array.from(videoGroups.entries())
      .map(([cameraKey, groupVideos], index) => {
        // Check for time continuity
        const continuousSegments: MediaFile[][] = []
        let currentSegment: MediaFile[] = []

        if (groupVideos.length === 1) {
          continuousSegments.push([groupVideos[0]])
        } else {
          currentSegment = [groupVideos[0]]

          for (let i = 1; i < groupVideos.length; i++) {
            const currentVideo = groupVideos[i]
            const previousVideo = groupVideos[i - 1]

            const currentStartTime =
              new Date(currentVideo.probeData.format.tags?.creation_time || 0).getTime() / 1000
            const previousEndTime =
              (new Date(previousVideo.probeData.format.tags?.creation_time || 0).getTime() / 1000) +
              (previousVideo.probeData.format.duration || 0)

            // Allow for small gaps (e.g., 1 second) between videos
            const timeGap = currentStartTime - previousEndTime
            if (Math.abs(timeGap) <= 0.5) {
              currentSegment.push(currentVideo)
            } else {
              continuousSegments.push([...currentSegment])
              currentSegment = [currentVideo]
            }
          }
          // Add the last segment
          if (currentSegment.length > 0) {
            continuousSegments.push([...currentSegment])
          }
        }

        return {
          video: groupVideos[0], // First video for metadata
          index: index + 1, // Camera index starting from 1
          isActive: true,
          cameraKey,
          allVideos: groupVideos,
          continuousSegments, // Add this to your AssembledTrack type
          combinedDuration: groupVideos.reduce(
            (acc, video) => acc + (video.probeData.format.duration || 0),
            0,
          ),
        }
      })
  },

  updateActiveVideos: () => {
    const { videos, currentTime } = get()
    
    if (!videos.length) {
      set({ activeVideos: [] })
      return
    }

    const active = videos.filter((video) => {
      const startTime = new Date(video.probeData.format.tags?.creation_time || 0).getTime() / 1000
      const duration = video.probeData.format.duration || 0
      const endTime = startTime + duration

      return currentTime >= startTime && currentTime <= endTime
    })

    set({ activeVideos: active })
  },

  setMainCamera: (camera) => set({ mainCamera: camera }),
})) 