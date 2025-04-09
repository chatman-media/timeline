export interface TimeRange {
  id: string
  trackId: string
  start: number
  end: number
  duration: number
  type: "video" | "audio" | string
  isSelected: boolean
  color?: string
}
