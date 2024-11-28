interface GlobalTimelineBarProps {
  duration: number
  currentTime: number
  startTime: number
  height: number
}

const GlobalTimelineBar = ({ duration, currentTime, startTime, height }: GlobalTimelineBarProps) => {
  const position = ((currentTime - startTime) / duration) * 100

  if (position < 0 || position > 100) return null

  return (
    <div
      className="absolute w-[2px] bg-black/80 pointer-events-none z-50"
      style={{
        left: `${position}%`,
        height: `${height-6}px`,
        top: '-45px',
      }}
    >
      {/* <div className="absolute -top-2 -translate-x-1/2 w-3 h-3 bg-white rounded-full" /> */}
    </div>
  )
}

export default GlobalTimelineBar
