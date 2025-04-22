import { useEffect, useRef, useState } from "react"

import { MediaFile } from "@/types/media"

interface TransitionPreviewProps {
  sourceVideo: MediaFile
  targetVideo: MediaFile
  transitionType: "zoom" | "fade" | "slide"
  onClick: () => void
}

const TransitionPreview = ({
  sourceVideo,
  targetVideo,
  transitionType,
  onClick,
}: TransitionPreviewProps) => {
  const [isHovering, setIsHovering] = useState(false)
  const sourceVideoRef = useRef<HTMLVideoElement>(null)
  const targetVideoRef = useRef<HTMLVideoElement>(null)
  const transitionTimeoutRef = useRef<NodeJS.Timeout>(null)
  const loopTimeoutRef = useRef<NodeJS.Timeout>(null)

  useEffect(() => {
    if (!sourceVideoRef.current || !targetVideoRef.current) return

    const sourceVideo = sourceVideoRef.current
    const targetVideo = targetVideoRef.current

    sourceVideo.currentTime = 0
    targetVideo.currentTime = 0

    const startTransition = () => {
      sourceVideo.currentTime = 0
      targetVideo.currentTime = 0

      // Сброс стилей
      sourceVideo.style.transform = "scale(1) translate(-50%, -50%)"
      sourceVideo.style.opacity = "1"
      targetVideo.style.opacity = "0"
      targetVideo.style.transform = "scale(1) translate(-50%, -50%)"

      sourceVideo.play()

      transitionTimeoutRef.current = setTimeout(() => {
        switch (transitionType) {
        case "zoom":
          sourceVideo.style.transform = "scale(2) translate(-25%, -25%)"
          sourceVideo.style.opacity = "0"
          targetVideo.style.opacity = "1"
          targetVideo.style.transform = "scale(1) translate(-50%, -50%)"
          break

        case "fade":
          sourceVideo.style.opacity = "0"
          targetVideo.style.opacity = "1"
          break

        case "slide":
          sourceVideo.style.transform = "translate(-150%, -50%)"
          targetVideo.style.transform = "translate(-50%, -50%)"
          targetVideo.style.opacity = "1"
          break
        }

        targetVideo.play()

        loopTimeoutRef.current = setTimeout(() => {
          if (isHovering) {
            startTransition()
          }
        }, 2000)
      }, 1000)
    }

    if (isHovering) {
      startTransition()
    } else {
      sourceVideo.pause()
      targetVideo.pause()
      sourceVideo.currentTime = 0
      targetVideo.currentTime = 0

      // Сброс стилей при уходе курсора
      sourceVideo.style.transform = "scale(1) translate(-50%, -50%)"
      sourceVideo.style.opacity = "1"
      targetVideo.style.opacity = "0"
      targetVideo.style.transform = "scale(1) translate(-50%, -50%)"

      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current)
      if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current)
    }

    return () => {
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current)
      if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current)
    }
  }, [isHovering, transitionType])

  return (
    <div
      className="relative h-24 w-24 cursor-pointer overflow-hidden rounded-md bg-black"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={onClick}
    >
      <video
        ref={sourceVideoRef}
        src={sourceVideo.path}
        className="absolute top-1/2 left-1/2 h-full w-full origin-center object-cover transition-all duration-1000"
        muted
        playsInline
        preload="auto"
      />
      <video
        ref={targetVideoRef}
        src={targetVideo.path}
        className="absolute top-1/2 left-1/2 h-full w-full origin-center object-cover opacity-0 transition-all duration-1000"
        muted
        playsInline
        preload="auto"
      />
      <div className="absolute right-0 bottom-0 left-0 bg-black/50 p-2 text-xs text-white">
        {transitionType === "zoom" && "Зум"}
        {transitionType === "fade" && "Затухание"}
        {transitionType === "slide" && "Слайд"}
      </div>
    </div>
  )
}

const transitions = [
  {
    id: "zoom",
    type: "zoom" as const,
  },
  {
    id: "fade",
    type: "fade" as const,
  },
  {
    id: "slide",
    type: "slide" as const,
  },
]

export function TransitionsList({ onSelect }: { onSelect?: (id: string) => void }) {
  const [searchQuery, setSearchQuery] = useState("")
  const demoVideos = {
    source: { path: "/vex1.mp4" } as MediaFile,
    target: { path: "/vex2.mp4" } as MediaFile,
  }

  return (
    <div className="h-full overflow-y-auto p-3">
      <div className="mb-4 flex items-center justify-between">
        <div className="relative w-[50%]">
          <input
            type="text"
            placeholder="Поиск..."
            className="focus:ring-primary w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm focus:ring-2 focus:outline-none dark:border-gray-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-5">
        {transitions.map((transition) => (
          <TransitionPreview
            key={transition.id}
            sourceVideo={demoVideos.source}
            targetVideo={demoVideos.target}
            transitionType={transition.type}
            onClick={() => onSelect?.(transition.id)}
          />
        ))}
      </div>
    </div>
  )
}
