import { formatTime } from "@/lib/utils"

interface PreviewTimelineProps {
  time: number
  duration: number
}

export function PreviewTimeline({ time, duration }: PreviewTimelineProps) {
  return (
    <>
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-red-500 pointer-events-none z-10"
        style={{
          left: `${(time / duration) * 100}%`,
        }}
      />
      <div
        className="absolute bottom-0 text-xs bg-black/75 text-white px-1 rounded pointer-events-none z-20"
        style={{
          left: `${(time / duration) * 100}%`,
          fontSize: "10px",
          transform: "translateX(-50%)",
        }}
      >
        {formatTime(time, false)}
      </div>
    </>
  )
}
