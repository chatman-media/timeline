import { ReactNode } from "react"

interface TimelineTracksProps {
  children: ReactNode
}

export function TimelineTracks({ children }: TimelineTracksProps) {
  return (
    <div className="relative w-full">
      {children}
    </div>
  )
}
