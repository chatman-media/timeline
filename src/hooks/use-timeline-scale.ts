import { useCallback, useMemo, useState } from "react"
import { useMedia } from "./use-media"

interface UseTimelineScaleReturn {
  scale: number
  setScale: (value: number) => void
  increaseScale: () => void
  decreaseScale: () => void
  scalePercentage: string
  scaleStyle: { width: string }
  maxDuration: number
  minStartTime: number
  roundedStartTime: number
  roundedEndTime: number
  timeStep: number
  subStep: number
}

export function useTimelineScale(): UseTimelineScaleReturn {
  const { tracks } = useMedia()
  const [scale, setScale] = useState(1)

  const { maxDuration, minStartTime } = useMemo(() => {
    if (tracks.length === 0) {
      return { maxDuration: 0, minStartTime: 0 }
    }

    let earliestTime = Infinity
    let latestTime = -Infinity

    tracks.forEach((track) => {
      const firstVideo = track.videos[0]
      const lastVideo = track.videos[track.videos.length - 1]

      const trackStartTime = firstVideo.startTime || 0
      const trackEndTime = (lastVideo.startTime || 0) + (lastVideo.duration || 0)

      earliestTime = Math.min(earliestTime, trackStartTime)
      latestTime = Math.max(latestTime, trackEndTime)
    })

    console.log("Scale calculation:", {
      earliestTime,
      latestTime,
      maxDuration: latestTime - earliestTime,
    })

    return {
      minStartTime: earliestTime,
      maxDuration: latestTime - earliestTime,
    }
  }, [tracks])

  const increaseScale = useCallback(() => {
    setScale((s) => Math.min(2, s + 0.1))
  }, [])

  const decreaseScale = useCallback(() => {
    setScale((s) => Math.max(0.1, s - 0.1))
  }, [])

  const handleSetScale = useCallback((value: number) => {
    const newScale = Math.max(0.1, Math.min(2, value))
    setScale(newScale)
  }, [])

  // Расчеты для шкалы времени
  const timeScaleCalculations = useMemo(() => {
    const baseMainMarks = 10
    const numMainMarks = Math.ceil(baseMainMarks * scale)
    const numSubMarks = 5

    const getTimeScale = (duration: number, currentScale: number) => {
      const scaledDuration = duration / currentScale
      if (scaledDuration >= 3600) return 3600
      if (scaledDuration >= 300) return 60
      if (scaledDuration >= 60) return 30
      if (scaledDuration >= 10) return 5
      return 1
    }

    const timeScale = getTimeScale(maxDuration, scale)
    const roundedStartTime = Math.floor(minStartTime / timeScale) * timeScale
    const endTime = roundedStartTime + maxDuration
    const roundedEndTime = Math.ceil(endTime / timeScale) * timeScale
    const timeStep = Math.ceil((roundedEndTime - roundedStartTime) / numMainMarks) * timeScale
    const subStep = timeStep / numSubMarks

    return {
      roundedStartTime,
      roundedEndTime,
      timeStep,
      subStep,
      maxDuration,
    }
  }, [maxDuration, minStartTime, scale])

  const scalePercentage = useMemo(() => `${Math.round(scale * 100)}%`, [scale])
  const scaleStyle = useMemo(() => ({ width: `${scale * 100}%` }), [scale])

  return {
    scale,
    setScale: handleSetScale,
    increaseScale,
    decreaseScale,
    scalePercentage,
    scaleStyle,
    minStartTime,
    ...timeScaleCalculations,
  }
}
