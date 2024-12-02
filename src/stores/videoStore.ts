import { create } from "zustand"
import type { AssembledTrack, MediaFile } from "@/types/videos"
import { SceneSegment, TimeRange } from "@/types/scene"

interface VideoState {
  videos: MediaFile[]
  isLoading: boolean
  hasVideos: boolean
  isPlaying: boolean
  currentTime: number
  timeRanges: TimeRange[]
  assembledTracks: AssembledTrack[]
  videoRefs: { [key: string]: HTMLVideoElement }
  hasFetched: boolean
  activeVideos: MediaFile[]
  activeVideo?: MediaFile
  activeCamera: string
  scenes: SceneSegment[]
  isChangingCamera: boolean

  // Actions
  setVideos: (videos: MediaFile[]) => void
  setActiveCamera: (cameraId: string) => void
  setActiveVideo: (videoId: string) => void
  setIsPlaying: (isPlaying: boolean) => void
  setCurrentTime: (time: number) => void
  fetchVideos: () => Promise<void>
  timeToPercent: (time: number) => number
  percentToTime: (percent: number) => number
  updateAssembledTracks: () => void
  updateActiveVideos: () => void
  setScenes: (scenes: SceneSegment[]) => void
}

export const useVideoStore = create<VideoState>((set, get) => ({
  videos: [],
  isLoading: true,
  hasVideos: false,
  activeCamera: "V1",
  isPlaying: false,
  currentTime: 0,
  timeRanges: [],
  assembledTracks: [],
  videoRefs: {},
  hasFetched: false,
  activeVideos: [],
  scenes: [],
  isChangingCamera: false,

  setVideos: (videos) => {
    set({ isChangingCamera: true })
    set({
      videos,
      activeCamera: "V1",
      activeVideo: videos.find((v) => v.id === "V1") || videos[0],
      hasVideos: videos.length > 0,
      isChangingCamera: false,
    })
    get().updateActiveVideos()
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
  setActiveCamera: (cameraId) => {
    const { currentTime, assembledTracks } = get()

    set({ isChangingCamera: true })

    try {
      const targetTrack = assembledTracks.find((track) => {
        const trackNumber = parseInt(cameraId.replace("V", ""))
        return track.index === trackNumber
      })

      if (targetTrack) {
        const availableVideo = targetTrack.allVideos.find((video) => {
          const startTime = new Date(video.probeData.format.tags?.creation_time || 0).getTime() /
            1000
          const endTime = startTime + (video.probeData.format.duration || 0)
          const tolerance = 0.3
          return currentTime >= (startTime - tolerance) && currentTime <= (endTime + tolerance)
        })

        if (availableVideo && get().videoRefs.current) {
          const preloadNearbyVideos = () => {
            const currentIndex = targetTrack.allVideos.indexOf(availableVideo)
            const nearbyVideos = [
              targetTrack.allVideos[currentIndex - 1],
              targetTrack.allVideos[currentIndex + 1],
            ].filter(Boolean)

            nearbyVideos.forEach((video) => {
              const preloadVideo = document.createElement("video")
              preloadVideo.src = video.path
              preloadVideo.preload = "auto"
              preloadVideo.load()
            })
          }

          set({
            activeCamera: cameraId,
            activeVideo: availableVideo,
          })

          const videoElement = get().videoRefs.current[availableVideo.id]
          if (videoElement) {
            videoElement.preload = "auto"
            videoElement.load()

            const videoStartTime =
              new Date(availableVideo.probeData.format.tags?.creation_time || 0).getTime() / 1000
            const relativeTime = currentTime - videoStartTime
            videoElement.currentTime = relativeTime

            requestIdleCallback(() => preloadNearbyVideos())
          }
        }
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

      const validVideos = data.media
        .filter((v: MediaFile) => {
          const isVideo = v.probeData.streams.some((s) => s.codec_type === "video")
          const hasCreationTime = !!v.probeData.format.tags?.creation_time
          return isVideo && hasCreationTime
        })
        .sort((a: MediaFile, b: MediaFile) => {
          const timeA = new Date(a.probeData.format.tags!.creation_time).getTime()
          const timeB = new Date(b.probeData.format.tags!.creation_time).getTime()
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

      // Calculate time ranges
      const times = validVideos.flatMap((v: MediaFile) => {
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
          videos: validVideos,
          hasVideos: true,
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

    // Sort all videos by start time first
    const sortedVideos = [...videos].sort((a, b) => {
      const aTime = new Date(a.probeData.format.tags?.creation_time || 0).getTime()
      const bTime = new Date(b.probeData.format.tags?.creation_time || 0).getTime()
      return aTime - bTime
    })

    const assembledTracks: AssembledTrack[] = []

    const getVideoSignature = (video: MediaFile) => {
      const videoStream = video.probeData.streams.find((s) => s.codec_type === "video")
      return {
        codec: videoStream?.codec_name,
        width: videoStream?.width,
        height: videoStream?.height,
        aspectRatio: videoStream?.display_aspect_ratio,
        frameRate: videoStream?.r_frame_rate,
        rotation: videoStream?.rotation || 0,
      }
    }

    const isSameVideoType = (video1: MediaFile, video2: MediaFile) => {
      const sig1 = getVideoSignature(video1)
      const sig2 = getVideoSignature(video2)

      return sig1.codec === sig2.codec &&
        sig1.width === sig2.width &&
        sig1.height === sig2.height &&
        sig1.aspectRatio === sig2.aspectRatio &&
        sig1.frameRate === sig2.frameRate &&
        sig1.rotation === sig2.rotation
    }

    // Find existing track for video or create new one
    const findOrCreateTrack = (video: MediaFile) => {
      // Try to find matching track
      for (const track of assembledTracks) {
        if (isSameVideoType(track.video, video)) {
          return track
        }
      }

      // Create new track if no match found
      const newTrack: AssembledTrack = {
        video,
        cameraKey: video.probeData.streams.find((s) => s.codec_type === "video")?.key || "",
        index: assembledTracks.length + 1,
        isActive: true,
        combinedDuration: 0,
        allVideos: [],
        continuousSegments: [],
      }
      assembledTracks.push(newTrack)
      return newTrack
    }

    // Process each video
    sortedVideos.forEach((video, i) => {
      const prevVideo = i > 0 ? sortedVideos[i - 1] : null
      const track = findOrCreateTrack(video)

      if (prevVideo && isSameVideoType(prevVideo, video)) {
        const prevStart = new Date(prevVideo.probeData.format.tags?.creation_time || 0).getTime() /
          1000
        const prevDuration = prevVideo.probeData.format.duration || 0
        const currentStart = new Date(video.probeData.format.tags?.creation_time || 0).getTime() /
          1000
        const timeDiff = currentStart - (prevStart + prevDuration)

        // If time gap is small enough, add to current segment
        if (timeDiff < 0.5) {
          if (track.continuousSegments.length === 0) {
            track.continuousSegments.push([video])
          } else {
            track.continuousSegments[track.continuousSegments.length - 1].push(video)
          }
        } else {
          // Start new segment
          track.continuousSegments.push([video])
        }
      } else {
        // First video in track or different type
        track.continuousSegments.push([video])
      }

      track.allVideos.push(video)
      track.combinedDuration += video.probeData.format.duration || 0
    })

    set({ assembledTracks })
  },

  updateActiveVideos: () => {
    if (get().isChangingCamera) return

    const { videos, currentTime, activeCamera } = get()

    if (!videos.length) {
      set({ activeVideos: [], activeVideo: undefined })
      return
    }

    const active = videos.filter((video) => {
      const startTime = new Date(video.probeData.format.tags?.creation_time || 0).getTime() / 1000
      const duration = video.probeData.format.duration || 0
      const endTime = startTime + duration
      return currentTime >= startTime && currentTime <= endTime
    })

    const currentActiveVideo = active.find((video) => video.id === activeCamera)

    set({
      activeVideos: active,
      activeVideo: currentActiveVideo,
    })
  },
  setScenes: (scenes) => set({ scenes }),
}))
