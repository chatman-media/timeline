import { FfprobeData } from "./ffprobe"
import { TimeRange } from "./time-range"

export interface MediaFile {
  id: string
  name: string
  path: string
  thumbnail?: string
  probeData?: FfprobeData
  startTime?: number
  endTime?: number
  duration?: number
  isVideo?: boolean
  isImage?: boolean
  isAudio?: boolean
  size?: number
  createdAt?: string
  updatedAt?: string
  isAddedToTimeline?: boolean
  proxy?: {
    path: string
    width: number
    height: number
    bitrate: number
  }
  lrv?: {
    path: string
    width: number
    height: number
    duration: number
    probeData?: FfprobeData
  }
}

export interface FileGroup {
  id: string
  title: string
  fileIds: string[]
  count: number
  totalDuration: number
  totalSize: number
  type?: "video" | "audio" | "image" | "sequential"
  videosPerSeries?: number
}

export interface Track {
  id: string
  name?: string
  type?: "video" | "audio" | "image"
  isActive?: boolean
  videos?: MediaFile[]
  startTime?: number
  endTime?: number
  combinedDuration?: number
  timeRanges?: TimeRange[]
  index: string | number

  volume?: number
  isMuted?: boolean
  isLocked?: boolean
  isVisible?: boolean
}

export interface TimelineTimeRange {
  id: string
  trackId?: string
  start: number
  end: number
  duration?: number
  type: "video" | "audio" | "image"
  isSelected: boolean | undefined
  color?: string | undefined
}
