interface GlobalTimelineBarProps {
  duration: number
  startTime: number
  height: number
}

const GlobalTimelineBar = ({ duration, startTime, height }: GlobalTimelineBarProps) => {
  return (
    <div
      className="absolute w-[2px] bg-white/80 pointer-events-none z-50"
      style={{
        left: `${startTime / duration * 100}%`,
        height: `${height}px`,
        top: 0,
      }}
    >
      <div className="absolute -top-2 -translate-x-1/2 w-3 h-3 bg-white rounded-full" />
    </div>
  )
}

export default GlobalTimelineBar
