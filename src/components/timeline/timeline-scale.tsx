import { useEffect, useMemo } from "react"
import { Track } from "@/types/videos"
import { formatTimeWithMilliseconds } from "@/lib/utils"

interface TimelineScaleProps {
  tracks: Track[]
  startTime: number
  endTime: number
  duration: number
  onTimeRangeAdjust?: (adjustedRange: TimeRange) => void
}

interface TimeRange {
  startTime: number
  endTime: number
  duration: number
}

interface TimeScale {
  main: number
  sub: number
}
export function TimelineScale(
  { tracks, startTime, endTime, duration, onTimeRangeAdjust }: TimelineScaleProps,
): JSX.Element {
  const { timeStep, subStep } = useMemo(() => {
    const getTimeScale = (duration: number): TimeScale => {
      if (duration <= 30) return { main: 5, sub: 1 } // Up to 30 sec
      if (duration <= 60) return { main: 10, sub: 2 } // Up to 1 min
      if (duration <= 300) return { main: 30, sub: 5 } // Up to 5 min
      if (duration <= 900) return { main: 60, sub: 15 } // Up to 15 min
      if (duration <= 3600) return { main: 300, sub: 60 } // Up to 1 hour
      return { main: 900, sub: 300 } // More than an hour
    }

    const scale = getTimeScale(duration)
    return {
      timeStep: scale.main,
      subStep: scale.sub,
    }
  }, [duration])

  const adjustedRange = useMemo((): TimeRange => {
    const timeRange = endTime - startTime
    const padding = timeRange * 0.03
    return {
      startTime: startTime - padding,
      endTime: endTime + padding,
      duration: (endTime + padding) - (startTime - padding),
    }
  }, [startTime, endTime])

  useEffect(() => {
    onTimeRangeAdjust?.(adjustedRange)
  }, [adjustedRange])

  return (
    <div className="relative w-full flex flex-col mb-[20px]">
      {/* Индикатор доступных промежутков видео */}
      <div
        className="h-0.5 w-full"
        style={{ background: "rgb(47, 61, 62)", opacity: 0.5, height: "1px" }}
      >
        {tracks.map((track: Track) =>
          track.videos.map((video, videoIndex) => {
            const videoStart = video.startTime || 0
            const videoDuration = video.duration || 0
            // Используем adjustedDuration вместо duration
            const rangeWidth = (videoDuration / adjustedRange.duration) * 100
            const rangePosition =
              ((videoStart - adjustedRange.startTime) / adjustedRange.duration) * 100

            return (
              <div
                key={`${track.id}-${videoIndex}`}
                className="h-0.5 absolute"
                style={{
                  width: `${rangeWidth}%`,
                  left: `${rangePosition}%`,
                  background: "rgb(25, 102, 107)",
                }}
              />
            )
          })
        )}
      </div>

      {/* Шкала с делениями */}
      <div className="relative w-full h-8">
        <TimelineMarks
          startTime={adjustedRange.startTime}
          endTime={adjustedRange.endTime}
          duration={adjustedRange.duration}
          timeStep={timeStep}
          subStep={subStep}
        />
      </div>
    </div>
  )
}

interface TimelineMarkProps {
  timestamp: number
  position: number
  markType: "large" | "medium" | "small" | "smallest"
  showValue?: boolean
  formatTime?: (timestamp: number) => string
  isFirstMark?: boolean
}

// Вспомогательный компонент для отрисовки делений шкалы
function TimelineMarks({
  startTime,
  endTime,
  duration,
  timeStep,
  subStep,
}: {
  startTime: number
  endTime: number
  duration: number
  timeStep: number
  subStep: number
}) {
  const marks = []
  const level1Step = timeStep
  const level2Step = subStep
  const level3Step = subStep / 2
  const level4Step = subStep / 4

  // Начинаем с ближайшего кратного timeStep значения
  const firstMark = Math.ceil(startTime / level1Step) * level1Step

  for (let timestamp = firstMark; timestamp <= endTime; timestamp += level4Step) {
    const position = ((timestamp - startTime) / duration) * 100

    let markType: "large" | "medium" | "small" | "smallest"
    let showValue = false

    if (timestamp % level1Step === 0) {
      markType = "large"
      showValue = true
    } else if (timestamp % level2Step === 0) {
      markType = "medium"
    } else if (timestamp % level3Step === 0) {
      markType = "small"
    } else {
      markType = "smallest"
    }

    marks.push(
      <TimelineMark
        key={timestamp}
        timestamp={timestamp}
        position={position}
        markType={markType}
        showValue={showValue}
        isFirstMark={timestamp === firstMark}
      />,
    )
  }

  return (
    <div className="relative w-full h-10 bg-[#1a1a1a]">
      {marks}
    </div>
  )
}

export function TimelineMark(
  { timestamp, position, markType, showValue, isFirstMark }: TimelineMarkProps,
) {
  const getMarkHeight = () => {
    switch (markType) {
      case "large":
        return "h-7 bg-[#aeaeae] opacity-50"
      case "medium":
        return "h-3 bg-[#767676] opacity-50"
      case "small":
        return "h-2 opacity-70"
      case "smallest":
        return "h-[6px] opacity-70"
    }
  }

  return (
    <div
      className="absolute h-full flex flex-col items-center"
      style={{ left: `${position}%` }}
    >
      <div
        className={`w-[1px] bg-[#4a4a4a] ${getMarkHeight()}`}
      />
      {showValue && (
        <span
          className={`text-[11px] text-[#808080] mt-1 absolute top-7 ml-[90px] mt-[-15px] whitespace-nowrap ${
            isFirstMark ? "w-20 text-white opacity-70" : "w-10"
          }`}
        >
          {formatTimeWithMilliseconds(timestamp, isFirstMark, true, false)}
        </span>
      )}
    </div>
  )
}
