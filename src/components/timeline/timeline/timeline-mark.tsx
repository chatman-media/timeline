import { formatDate, formatTimeWithMilliseconds } from "@/lib/utils"

interface TimelineMarkProps {
  timestamp: number
  position: number
  markType: "large" | "medium" | "small" | "smallest"
  showValue?: boolean
  formatTime?: (timestamp: number) => string
  isFirstMark?: boolean
}

export function TimelineMark({
  timestamp,
  position,
  markType,
  showValue,
  isFirstMark,
}: TimelineMarkProps) {
  const getMarkHeight = () => {
    switch (markType) {
      case "large":
        return "h-6 bg-[#aeaeae] opacity-50"
      case "medium":
        return "h-3 bg-[#767676] opacity-50"
      case "small":
        return "h-2 opacity-70"
      case "smallest":
        return "h-[4px] opacity-70"
    }
  }

  return (
    <>
      {isFirstMark && (
        <span className="absolute top-[-20px] text-[12px] dark:text-gray-100 text-gray-900 opacity-80 bg-black/10 px-1 rounded left-0 z-10">
          {formatDate(timestamp)}
        </span>
      )}

      <div
        className="absolute h-full flex flex-col items-center"
        style={{ left: `${position}%` }}
      >
        <div className={`w-[1px] bg-[#4a4a4a] ${getMarkHeight()}`} />
        {showValue && (
          <span
            className={`text-[11px] text-[#808080] absolute top-7 mt-[-16px] whitespace-nowrap dark:text-gray-100 text-gray-900 opacity-70 transform translate-x-[-50%]`}
          >
            {formatTimeWithMilliseconds(timestamp, false, true, false)}
          </span>
        )}
      </div>
    </>
  )
}
