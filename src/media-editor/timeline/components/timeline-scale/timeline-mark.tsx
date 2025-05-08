import { formatDate, formatTimeWithMilliseconds } from "@/lib/utils"

interface TimelineMarkProps {
  timestamp: number
  position: number
  markType: "large" | "medium" | "small" | "smallest"
  showValue?: boolean
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
      return "h-6 bg-[#4a4a4a] dark:bg-[#aeaeae] w-[1px]"
    case "medium":
      return "h-3 bg-[#4a4a4a] dark:bg-[#aeaeae] w-[1px]"
    case "small":
      return "h-2 bg-[#4a4a4a] dark:bg-[#aeaeae] opacity-70 w-[1px]"
    case "smallest":
      return "h-1.5 bg-[#4a4a4a] dark:bg-[#aeaeae] opacity-50 w-[1px]"
    }
  }

  return (
    <>
      {isFirstMark && (
        <span className="absolute top-[-20px] left-0 z-10 rounded bg-black/10 px-1 text-[12px] text-gray-900 opacity-80 dark:text-gray-100">
          {formatDate(timestamp)}
        </span>
      )}

      <div className="absolute flex h-full flex-col items-center" style={{ left: `${position}%` }}>
        <div className={getMarkHeight()} />
        {showValue && (
          <span
            className={`absolute top-7 mt-[-16px] -translate-x-1/2 transform text-[11px] whitespace-nowrap text-gray-900 opacity-80 dark:text-gray-100`}
          >
            {formatTimeWithMilliseconds(timestamp, false, true, false)}
          </span>
        )}
      </div>
    </>
  )
}
