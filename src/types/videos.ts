import { FfprobeData } from "fluent-ffmpeg"

import { TimeRange } from "./time-range"

export interface RecordEntry {
  id: string
  startTime: number
  endTime: number
  duration: number
  type: string
  color?: string
}

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
  size?: number
  createdAt?: string
  updatedAt?: string
}

export interface Track {
  id: string
  name: string
  type: "video" | "audio" | "image"
  isActive: boolean
  videos: MediaFile[]
  startTime: number
  endTime: number
  combinedDuration: number
  timeRanges: TimeRange[]
  index: string | number
}

export interface VideoSegment {
  id: string
  trackId: string
  start: number
  end: number
  duration: number
  type: string
  color?: string
}

export interface ScreenLayout {
  type: string
  activeTracks: string[]
}

export interface ThumbnailParams {
  videoDuration: number
  containerWidth: number
  scale: number
  trackHeight: number
  segmentWidth: number
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
