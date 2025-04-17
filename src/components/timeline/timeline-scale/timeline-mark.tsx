import { formatTimeWithMilliseconds } from "@/lib/utils"

interface TimelineMarkProps {
  timestamp: number
  position: number
  markType: "large" | "medium" | "small" | "smallest"
  showValue?: boolean
}

export function TimelineMark({ timestamp, position, markType, showValue }: TimelineMarkProps) {
  const getMarkHeight = () => {
    switch (markType) {
    case "large":
      return "h-6 bg-[#4a4a4a] dark:bg-[#aeaeae]"
    case "medium":
      return "h-4 bg-[#4a4a4a] dark:bg-[#aeaeae] opacity-80"
    case "small":
      return "h-3 bg-[#4a4a4a] dark:bg-[#aeaeae] opacity-70"
    case "smallest":
      return "h-2 bg-[#4a4a4a] dark:bg-[#aeaeae] opacity-50"
    }
  }

  return (
    <>
      <div className="absolute h-full flex flex-col items-start" style={{ left: `${position}%` }}>
        <div className={`w-[1px] ${getMarkHeight()}`} />
        {showValue && (
          <span
            className={`text-[11px] absolute top-4 mt-0 whitespace-nowrap text-gray-900 dark:text-gray-100 transform translate-x-[10px]`}
          >
            {formatTimeWithMilliseconds(timestamp, false, true, false)}
          </span>
        )}
      </div>
    </>
  )
}
