import { forwardRef, memo } from "react"

import TimelineBar from "../timeline/timeline-bar"

interface TrackSliceWrapProps {
  children: React.ReactNode
  useGlobalBar?: boolean
  seekbar?: {
    width: number
    height: number
    y: number
  }
  maxDuration?: number
  timeRanges?: { start: number }[]
}

const TrackSliceWrap = memo(forwardRef<HTMLDivElement, TrackSliceWrapProps>(
  ({ children, useGlobalBar = true, seekbar, maxDuration, timeRanges }, ref) => {
    return (
      <div className="slice--parent bg-[#014a4f]" ref={ref}>
        {children}
        {!useGlobalBar && seekbar && timeRanges && (
          <TimelineBar
            width={seekbar.width}
            height={seekbar.height}
            y={seekbar.y}
            duration={maxDuration || 0}
            startTime={Math.min(...timeRanges.map((x) => x.start))}
            visible={true}
          />
        )}
      </div>
    )
  },
))

TrackSliceWrap.displayName = "TrackSliceWrap"

export { TrackSliceWrap }
