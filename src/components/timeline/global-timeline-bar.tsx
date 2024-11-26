import { useTimeline } from "@/hooks/use-timeline"
import { formatTimeWithMilliseconds } from "@/lib/utils"

interface GlobalTimelineBarProps {
  duration: number
  startTime: number
  height: number // Общая высота всех дорожек
}

const GlobalTimelineBar = ({ duration, startTime, height }: GlobalTimelineBarProps) => {
  const { currentTime, timeToPercent } = useTimeline({
    startTime,
    duration,
  })

  const percent = timeToPercent(currentTime)
  const position = `${percent}%`

  return (
    <>
      <div
        className="absolute h-full pointer-events-none"
        style={{
          left: position,
          height: `${height}px`,
          transform: "translateX(-50%)",
        }}
      >
        <div className="w-[1px] h-full bg-primary/50" />
      </div>
      <div
        className="absolute text-sm text-muted-foreground"
        style={{
          left: position,
          top: "-24px",
          transform: "translateX(-50%)",
        }}
      >
        {formatTimeWithMilliseconds(currentTime)}
      </div>
    </>
  )
}

export default GlobalTimelineBar
