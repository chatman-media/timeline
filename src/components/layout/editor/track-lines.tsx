import { useEffect, useState } from "react"

export function TrackLines() {
  const [tracks, setTracks] = useState<{ width: number; left: number }[]>([])

  useEffect(() => {
    const randomTracks = [
      { width: 0.8, left: 0.1 },
      { width: 0.5, left: 0.2 },
      { width: 0.8, left: 0.15 },
    ]
    setTracks(randomTracks)
  }, [])

  return (
    <div className="flex flex-col items-start pt-[1px]">
      {tracks.map((track, index) => (
        <div
          key={index}
          className="h-[4px] bg-primary/70 rounded-sm mb-[1px]"
          style={{
            width: `${track.width * 100}%`,
            marginLeft: `${track.left * 100}%`,
          }}
        />
      ))}
    </div>
  )
}
