import { TimeRange } from "@/types/videos"

export const timeToPercent = (timeRanges: TimeRange[], time: number) => {
  if (timeRanges.length === 0) return 0
  const minTime = Math.min(...timeRanges.map((x) => x.start))
  const maxTime = Math.max(...timeRanges.map((x) => x.end || 0))
  const duration = maxTime - minTime
  return ((time - minTime) / duration) * 100
}

export const percentToTime = (timeRanges: TimeRange[], percent: number) => {
  if (timeRanges.length === 0) return 0
  const minTime = Math.min(...timeRanges.map((x) => x.start))
  const maxTime = Math.max(...timeRanges.map((x) => x.end || 0))
  const duration = maxTime - minTime
  return minTime + (duration * percent) / 100
}
