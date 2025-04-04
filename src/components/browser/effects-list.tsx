import { Sliders } from "lucide-react"
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
      className="relative w-24 h-24 overflow-hidden rounded-md cursor-pointer bg-black"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={onClick}
    >
      <video
        ref={videoRef}
        src="/vex2.mp4"
        className="absolute left-1/2 top-1/2 w-full h-full object-cover -translate-x-1/2 -translate-y-1/2"
        muted
        playsInline
        preload="auto"
      />
      <div className="absolute bottom-0 left-0 right-0 p-2 text-xs text-white bg-black/50">
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
      <div className="space-y-1 p-3">
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-[50%]">
            <input
              type="text"
              placeholder="Поиск..."
              className="w-full px-3 py-1 text-sm bg-transparent border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
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
