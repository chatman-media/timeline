import { formatTimeWithMilliseconds } from "@/lib/utils"

interface TimelineMarkProps {
  timestamp: number
  position: number
  isMainMark: boolean
}

export const TimelineMark = (
  { timestamp, position, isMainMark }: TimelineMarkProps,
): JSX.Element => {
  return (
    <div
      className="absolute flex flex-col"
      style={{ left: `${position}%` }}
    >
      <div
        className={`${isMainMark ? "h-3" : "h-1.5"} w-0.5 bg-gray-600`}
      />
      {isMainMark && (
        <span
          className="text-xs text-gray-100 drag--parent flex-1"
          style={{ marginLeft: "5px", marginTop: "-5px", border: "none" }}
        >
          {formatTimeWithMilliseconds(timestamp, false, true, false)}
        </span>
      )}
    </div>
  )
}
