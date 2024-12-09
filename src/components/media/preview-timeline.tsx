import { formatTime } from "@/lib/utils"

interface PreviewTimelineProps {
  time: number
  duration: number
}

export function PreviewTimeline({ time, duration }: PreviewTimelineProps) {
  return (
    <>
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-red-500 pointer-events-none"
        style={{
          left: `${(time / duration) * 100}%`,
          zIndex: 20,
        }}
      />
      <div
        className="absolute bottom-0 text-xs bg-black/75 text-white px-1 rounded pointer-events-none"
        style={{
          left: `${(time / duration) * 100}%`,
          fontSize: "10px",
          transform: "translateX(-50%)",
          zIndex: 21,
        }}
      >
        {formatTime(time, true)}
      </div>
    </>
  )
}
