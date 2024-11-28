// Базовые типы для временной шкалы
export interface TimeRange {
  start: number
  duration: number
}

export interface VideoMetadata {
  filename: string
  codecName: string
  width: number
  height: number
  aspectRatio: string
  bitrate: number
  duration: number
}

export interface TimelineSliceType {
  id: string
  x: number
  y: number
  width: string | number
  height: number
  videoPath: string
}

export interface SeekbarState {
  width: number
  height: number
  y: number
  x: number
}
