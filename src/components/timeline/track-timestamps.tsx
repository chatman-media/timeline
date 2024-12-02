import { formatTimeWithMilliseconds } from "@/lib/utils"

export function TrackTimestamps({
  trackStartTime,
  trackEndTime,
}: {
  trackStartTime: number
  trackEndTime: number
}) {
  return (
    <div className="w-full inset-0 flex left-0 px-1 mt-1 justify-between text-xs text-gray-100">
      <div className="time">
        {formatTimeWithMilliseconds(trackStartTime, false, true, true)}
      </div>
      <div className="time">
        {formatTimeWithMilliseconds(trackEndTime, false, true, true)}
      </div>
    </div>
  )
}
