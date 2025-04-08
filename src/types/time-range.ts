export interface TimeRange {
  id: string
  trackId: string
  start: number
  end: number
  type: 'video' | 'audio'
  isSelected: boolean
}
