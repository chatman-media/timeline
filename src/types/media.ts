import { FfprobeData, FfprobeStream } from "./ffprobe"
import { TimeRange } from "./time-range"

export interface MediaFile {
  id: string
  name: string
  path: string
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
  source?: "media" | "timeline" | string
  proxy?: {
    path: string
    width: number
    height: number
    bitrate: number
  }
  proxies?: Array<{
    path: string
    width: number
    height: number
    bitrate: number
    streamKey: string
  }>
  lrv?: {
    path: string
    width: number
    height: number
    duration: number
    probeData?: FfprobeData
  }
  insv?: {
    leftLens: {
      stream: FfprobeStream
      width: number
      height: number
    }
    rightLens: {
      stream: FfprobeStream
      width: number
      height: number
    }
    isStitched: boolean
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

export interface VideoSegment {
  id: string
  videoId: string
  startTime: number
  endTime: number
  duration: number
  isVisible?: boolean
  isSelected?: boolean
}

export interface Track {
  id: string
  name?: string
  type?: "video" | "audio" | "image"
  isActive?: boolean
  videos?: MediaFile[]
  segments?: VideoSegment[]
  startTime?: number
  endTime?: number
  combinedDuration?: number
  timeRanges?: TimeRange[]
  index: string | number
  cameraId?: string
  cameraName?: string // Пользовательское название камеры (например, "Sony Alpha")
  sectionDuration?: number // Длительность секции для расчета позиции видео

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
