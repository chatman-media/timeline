export interface RecordingTrack {
  id: string
  cameraId: string
  startTime: number
  endTime: number
  filters: string[]
  luts: string[]
  subtitles: {
    text: string
    startTime: number
    endTime: number
  }[]
}

export interface RecordingComposition {
  id: string
  tracks: RecordingTrack[]
  timestamp: number
}

export interface RecordingSession {
  id: string
  compositions: RecordingComposition[]
  startTime: number
  endTime: number
  metadata: {
    name: string
    description?: string
    tags?: string[]
  }
} 