import { TimeRange } from "./time-range"
import { MediaFile } from "./videos"

// Базовые типы для временной шкалы
export interface VideoMetadata {
  filename: string
  codecName: string
  width: number
  height: number
  aspectRatio: string
  bitrate: number
  duration: number
  fps: number
  channels?: number
  sampleRate?: number
}

export interface TrackSliceState {
  id: string
  x: number
  y: number
  width: string | number
  height: number
  trackId: number
  startTime?: number
  duration?: number
}

export interface SeekbarState {
  width: number
  height: number
  y: number
  x: number
}

export interface TimelineTrack {
  id: string
  index: number
  isActive: boolean
  combinedDuration: number
  startTime: number
  videos: MediaFile[]
  timeRanges: TimeRange[]
}

export interface TimelineVideo {
  id: string
  trackId: string
  startTime: number
  endTime: number
  duration: number
  path: string
  metadata: {
    filename: string
    codecName: string
    width?: number
    height?: number
    aspectRatio?: string
    bitrate?: number
    duration?: number
    channels?: number
    sampleRate?: number
    fps?: number
  }
  position: {
    x: number
    width: number
  }
}
