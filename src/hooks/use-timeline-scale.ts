import { useCallback, useMemo, useState } from "react"

import { Track } from "@/types/videos"

interface UseTimelineScaleReturn {
  scale: number
  setScale: (value: number) => void
  increaseScale: () => void
  decreaseScale: () => void
  scalePercentage: string
  scaleStyle: { width: string }
  maxDuration: number
  calculateMaxDuration: (tracks: Track[]) => number
}

export function useTimelineScale(
  initialScale: number = 1,
  minScale: number = 0.1,
  maxScale: number = 2,
): UseTimelineScaleReturn {
  const [scale, setScale] = useState(initialScale)
  const [maxDuration, setMaxDuration] = useState(0)

  const calculateMaxDuration = useCallback((tracks: Track[]) => {
    const duration = Math.max(...tracks.map((track) => track.combinedDuration))
    setMaxDuration(duration)
    return duration
  }, [])

  const increaseScale = useCallback(() => {
    setScale((s) => Math.min(maxScale, s + 0.1))
  }, [maxScale])

  const decreaseScale = useCallback(() => {
    setScale((s) => Math.max(minScale, s - 0.1))
  }, [minScale])

  const handleSetScale = useCallback((value: number) => {
    const newScale = Math.max(minScale, Math.min(maxScale, value))
    setScale(newScale)
  }, [minScale, maxScale])

  const scalePercentage = useMemo(() => `${Math.round(scale * 100)}%`, [scale])

  const scaleStyle = useMemo(() => ({ width: `${scale * 100}%` }), [scale])

  return {
    scale,
    setScale: handleSetScale,
    increaseScale,
    decreaseScale,
    scalePercentage,
    scaleStyle,
    maxDuration,
    calculateMaxDuration,
  }
}
