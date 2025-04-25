import { useEffect, useRef, useState } from "react"

import { Input } from "@/components/ui/input"
import { VideoEffect } from "@/types/effects"

interface EffectPreviewProps {
  effectType: VideoEffect["type"]
  onClick: () => void
}

const effects = [
  {
    id: "brightness",
    type: "brightness" as const,
    name: "Яркость",
    labels: {
      ru: "Яркость",
      en: "Brightness",
    },
    duration: 0,
    ffmpegCommand: "eq=brightness=0.5",
  },
  {
    id: "contrast",
    type: "contrast" as const,
    name: "Контраст",
    labels: {
      ru: "Контраст",
      en: "Contrast",
    },
    duration: 0,
    ffmpegCommand: "eq=contrast=1.5",
  },
  {
    id: "saturation",
    type: "saturation" as const,
    name: "Насыщенность",
    labels: {
      ru: "Насыщенность",
      en: "Saturation",
    },
    duration: 0,
    ffmpegCommand: "eq=saturation=2",
  },
  {
    id: "sepia",
    type: "sepia" as const,
    name: "Сепия",
    labels: {
      ru: "Сепия",
      en: "Sepia",
    },
    duration: 0,
    ffmpegCommand: "colorize=color=brown:blend=0.3",
  },
  {
    id: "grayscale",
    type: "grayscale" as const,
    name: "Черно-белый",
    labels: {
      ru: "Черно-белый",
      en: "Grayscale",
    },
    duration: 0,
    ffmpegCommand: "colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3",
  },
  {
    id: "invert",
    type: "invert" as const,
    name: "Инверсия",
    labels: {
      ru: "Инверсия",
      en: "Invert",
    },
    duration: 0,
    ffmpegCommand: "negate",
  },
  {
    id: "hue-rotate",
    type: "hue-rotate" as const,
    name: "Оттенок",
    labels: {
      ru: "Оттенок",
      en: "Hue Rotate",
    },
    duration: 0,
    ffmpegCommand: "hue=h=90",
  },
  {
    id: "vintage",
    type: "vintage" as const,
    name: "Винтаж",
    labels: {
      ru: "Винтаж",
      en: "Vintage",
    },
    duration: 0,
    ffmpegCommand: "curves=vintage",
  },
  {
    id: "duotone",
    type: "duotone" as const,
    name: "Дуотон",
    labels: {
      ru: "Дуотон",
      en: "Duotone",
    },
    duration: 0,
    ffmpegCommand: "colorbalance=rs=0.3:gs=0.3:bs=0.3:rm=0:gm=0:bm=0:rh=-0.3:gh=-0.3:bh=-0.3",
  },
  {
    id: "speed",
    type: "speed" as const,
    name: "Скорость",
    labels: {
      ru: "Скорость",
      en: "Speed",
    },
    duration: 0.5,
    ffmpegCommand: "setpts=0.5*PTS",
  },
  {
    id: "noir",
    type: "noir" as const,
    name: "Нуар",
    labels: {
      ru: "Нуар",
      en: "Noir",
    },
    duration: 0,
    ffmpegCommand: "curves=noir",
  },
  {
    id: "cyberpunk",
    type: "cyberpunk" as const,
    name: "Киберпанк",
    labels: {
      ru: "Киберпанк",
      en: "Cyberpunk",
    },
    duration: 0,
    ffmpegCommand: "colorbalance=rs=0.5:gs=-0.5:bs=0.8",
  },
  {
    id: "dreamy",
    type: "dreamy" as const,
    name: "Мечтательный",
    labels: {
      ru: "Мечтательный",
      en: "Dreamy",
    },
    duration: 0,
    ffmpegCommand: "gblur=sigma=1.5,colorbalance=rs=0.1:gs=0.1:bs=0.1",
  },
  {
    id: "infrared",
    type: "infrared" as const,
    name: "Инфракрасный",
    labels: {
      ru: "Инфракрасный",
      en: "Infrared",
    },
    duration: 0,
    ffmpegCommand: "colorbalance=rs=0.8:gs=-0.8:bs=-0.8",
  },
  {
    id: "matrix",
    type: "matrix" as const,
    name: "Матрица",
    labels: {
      ru: "Матрица",
      en: "Matrix",
    },
    duration: 0,
    ffmpegCommand: "colorbalance=rs=-0.8:gs=0.8:bs=-0.8",
  },
  {
    id: "arctic",
    type: "arctic" as const,
    name: "Арктика",
    labels: {
      ru: "Арктика",
      en: "Arctic",
    },
    duration: 0,
    ffmpegCommand: "colorbalance=rs=-0.2:gs=0.2:bs=0.4",
  },
  {
    id: "sunset",
    type: "sunset" as const,
    name: "Закат",
    labels: {
      ru: "Закат",
      en: "Sunset",
    },
    duration: 0,
    ffmpegCommand: "colorbalance=rs=0.4:gs=0.1:bs=-0.4",
  },
  {
    id: "lomo",
    type: "lomo" as const,
    name: "Ломо",
    labels: {
      ru: "Ломо",
      en: "Lomo",
    },
    duration: 0,
    ffmpegCommand: "curves=lomo",
  },
  {
    id: "twilight",
    type: "twilight" as const,
    name: "Сумерки",
    labels: {
      ru: "Сумерки",
      en: "Twilight",
    },
    duration: 0,
    ffmpegCommand: "colorbalance=rs=-0.2:gs=-0.1:bs=0.3",
  },
  {
    id: "neon",
    type: "neon" as const,
    name: "Неон",
    labels: {
      ru: "Неон",
      en: "Neon",
    },
    duration: 0,
    ffmpegCommand: "colorbalance=rs=0.5:gs=0.5:bs=0.8,curves=increase_contrast",
  },
]

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
      case "brightness":
        videoElement.style.filter = "brightness(1.5)"
        break
      case "contrast":
        videoElement.style.filter = "contrast(1.5)"
        break
      case "saturation":
        videoElement.style.filter = "saturate(2)"
        break
      case "sepia":
        videoElement.style.filter = "sepia(0.8)"
        break
      case "grayscale":
        videoElement.style.filter = "grayscale(1)"
        break
      case "invert":
        videoElement.style.filter = "invert(0.8)"
        break
      case "hue-rotate":
        videoElement.style.filter = "hue-rotate(90deg)"
        break
      case "vintage":
        videoElement.style.filter = "sepia(0.5) contrast(1.2) brightness(0.9) saturate(0.8)"
        break
      case "duotone":
        videoElement.style.filter = "grayscale(1) brightness(1.2) contrast(1.5) sepia(0.5)"
        break
      case "speed":
        videoElement.playbackRate = 2
        break
      case "noir":
        videoElement.style.filter = "grayscale(1) contrast(1.5) brightness(0.8)"
        break
      case "cyberpunk":
        videoElement.style.filter = "hue-rotate(180deg) saturate(2) contrast(1.3) brightness(1.2)"
        break
      case "dreamy":
        videoElement.style.filter =
            "brightness(1.1) contrast(0.9) saturate(0.8) hue-rotate(30deg)"
        break
      case "infrared":
        videoElement.style.filter = "hue-rotate(-30deg) saturate(2) contrast(1.5) brightness(1.2)"
        break
      case "matrix":
        videoElement.style.filter = "brightness(1.2) saturate(1.5) hue-rotate(100deg)"
        break
      case "arctic":
        videoElement.style.filter =
            "brightness(1.2) saturate(0.8) contrast(1.1) hue-rotate(180deg)"
        break
      case "sunset":
        videoElement.style.filter =
            "brightness(1.1) contrast(1.2) saturate(1.5) hue-rotate(30deg) sepia(0.3)"
        break
      case "lomo":
        videoElement.style.filter = "contrast(1.4) brightness(0.9) sepia(0.3) saturate(1.5)"
        break
      case "twilight":
        videoElement.style.filter =
            "brightness(0.9) contrast(1.1) saturate(0.8) hue-rotate(-20deg)"
        break
      case "neon":
        videoElement.style.filter = "brightness(1.2) contrast(1.4) saturate(2) hue-rotate(180deg)"
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
      className="relative h-24 w-24 cursor-pointer rounded-xs bg-black"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={onClick}
    >
      <video
        ref={videoRef}
        src="/t1.mp4"
        className="absolute top-1/2 left-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-xs object-cover"
        muted
        playsInline
        preload="auto"
      />
      <div className="absolute right-0 bottom-0 left-0 bg-black/50 p-2 text-xs text-white">
        {effects.find((e) => e.type === effectType)?.labels.ru}
      </div>
    </div>
  )
}

export function EffectsList() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredEffects = effects.filter((effect) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      effect.labels.ru.toLowerCase().includes(searchLower) ||
      effect.labels.en.toLowerCase().includes(searchLower) ||
      effect.name.toLowerCase().includes(searchLower)
    )
  })

  const handleEffectClick = (effect: VideoEffect) => {
    console.log("Applying effect:", effect.name)
  }

  return (
    <div className="h-full flex-1 space-y-1 overflow-y-auto p-1">
      <div className="flex items-center justify-between p-2">
        <Input
          type="search"
          placeholder="Поиск"
          className="mr-5 h-6 w-full max-w-[400px] rounded-sm border border-gray-300 text-xs outline-none focus:border-gray-400 focus:ring-0 focus-visible:ring-0 dark:border-gray-600 dark:focus:border-gray-500"
          style={{
            backgroundColor: "transparent",
          }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="p-3">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-4">
          {filteredEffects.map((effect) => (
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
