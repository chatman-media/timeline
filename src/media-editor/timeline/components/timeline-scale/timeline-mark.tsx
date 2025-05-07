import { formatTimeWithMilliseconds } from "@/lib/utils"

interface TimelineMarkProps {
  timestamp: number
  position: number
  markType: "large" | "medium" | "small" | "smallest"
  showValue?: boolean
}

export function TimelineMark({ timestamp, position, markType, showValue }: TimelineMarkProps) {
  // Функция для определения высоты и стиля метки в зависимости от её типа
  const getMarkHeight = () => {
    switch (markType) {
    case "large":
      return "h-6 bg-[#4a4a4a] dark:bg-[#aeaeae]" // Высокие метки для основных делений
    case "medium":
      return "h-4 bg-[#4a4a4a] dark:bg-[#aeaeae] opacity-80" // Средние метки
    case "small":
      return "h-3 bg-[#4a4a4a] dark:bg-[#aeaeae] opacity-70" // Малые метки
    case "smallest":
      return "h-2 bg-[#4a4a4a] dark:bg-[#aeaeae] opacity-50" // Самые маленькие метки
    }
  }

  return (
    <>
      <div className="absolute flex h-full flex-col items-start" style={{ left: `${position}px` }}>
        <div className={`w-[1px] ${getMarkHeight()}`} />
        {showValue && (
          <span
            className={`absolute top-4 mt-0 -translate-x-1/2 transform text-[11px] whitespace-nowrap text-gray-900 dark:text-gray-100`}
          >
            {formatTimeWithMilliseconds(timestamp, false, true, false)}
          </span>
        )}
      </div>
    </>
  )
}
