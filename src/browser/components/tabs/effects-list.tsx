import { useEffect, useRef, useState } from "react"

import { effects, VideoEffect } from "@/types/effects"

interface EffectPreviewProps {
  effectType: VideoEffect["type"]
  onClick: () => void
}

const EffectPreview = ({ effectType, onClick }: EffectPreviewProps) => {
  const [isHovering, setIsHovering] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>(null)

  useEffect(() => {
    if (!videoRef.current) return
    const videoElement = videoRef.current

    const applyEffect = () => {
      videoElement.currentTime = 0
      videoElement.style.filter = ""

      switch (effectType) {
      case "blur":
        videoElement.style.filter = "blur(5px)"
        break
      case "brightness":
        videoElement.style.filter = "brightness(1.5)"
        break
      case "speed":
        videoElement.playbackRate = 2
        break
      }

      videoElement.play()

      timeoutRef.current = setTimeout(() => {
        if (isHovering) {
          applyEffect()
        }
      }, 2000)
    }

    if (isHovering) {
      applyEffect()
    } else {
      videoElement.pause()
      videoElement.currentTime = 0
      videoElement.style.filter = ""
      videoElement.playbackRate = 1
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [isHovering, effectType])

  return (
    <div
      className="relative h-24 w-24 cursor-pointer overflow-hidden rounded-md bg-black"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={onClick}
    >
      <video
        ref={videoRef}
        src="/t1.mp4"
        className="absolute top-1/2 left-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 object-cover"
        muted
        playsInline
        preload="auto"
      />
      <div className="absolute right-0 bottom-0 left-0 bg-black/50 p-2 text-xs text-white">
        {effectType === "blur" && "Размытие"}
        {effectType === "brightness" && "Яркость"}
        {effectType === "speed" && "Скорость"}
      </div>
    </div>
  )
}

export function EffectsList() {
  const [searchQuery, setSearchQuery] = useState("")

  const handleEffectClick = (effect: VideoEffect) => {
    console.log("Applying effect:", effect.name)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-1 p-3 pr-1 pl-1">
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
          {effects.map((effect) => (
            <EffectPreview
              key={effect.id}
              effectType={effect.type}
              onClick={() => handleEffectClick(effect)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
