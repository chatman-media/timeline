import { ZoomIn, ZoomOut } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { usePreviewSize } from "@/media-editor/browser"
import { AddMediaButton } from "@/media-editor/browser/components/layout/add-media-button"
import { useTimeline } from "@/media-editor/timeline/services/timeline-provider"

import { effects, type VideoEffect } from "."

interface EffectPreviewProps {
  effectType: VideoEffect["type"]
  onClick: () => void
  size: number
}

const EffectPreview = ({ effectType, onClick, size }: EffectPreviewProps) => {
  const { t } = useTranslation()
  const { addEffect, isEffectAdded, removeResource, effectResources } = useTimeline()
  const [isHovering, setIsHovering] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>(null)

  // Находим эффект по типу
  const effect = effects.find((e) => e.type === effectType)

  // Проверяем, добавлен ли эффект уже в хранилище
  const isAdded = effect ? isEffectAdded(effect) : false

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
    <div className="flex flex-col items-center">
      <div
        className="group relative cursor-pointer rounded-xs bg-black"
        style={{ width: `${size}px`, height: `${size}px` }}
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
        <div
          className={`${isAdded ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-200`}
        >
          <AddMediaButton
            file={{ id: effectType, path: "", name: effectType }}
            onAddMedia={(e) => {
              e.stopPropagation()
              if (effect) {
                addEffect(effect)
              }
            }}
            onRemoveMedia={(e) => {
              e.stopPropagation()
              if (effect) {
                // Находим ресурс с этим эффектом и удаляем его
                const resource = effectResources.find((res) => res.resourceId === effect.id)
                if (resource) {
                  removeResource(resource.id)
                } else {
                  console.warn(`Не удалось найти ресурс эффекта с ID ${effect.id} для удаления`)
                }
              }
            }}
            isAdded={isAdded}
            size={size}
          />
        </div>
      </div>
      <div className="mt-1 text-xs text-gray-300">
        {t(`effects.presets.${effectType}`)}
      </div>
    </div>
  )
}

export function EffectList() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")

  const {
    previewSize,
    isSizeLoaded,
    handleIncreaseSize,
    handleDecreaseSize,
    canIncreaseSize,
    canDecreaseSize,
  } = usePreviewSize("TRANSITIONS")

  const filteredEffects = effects.filter((effect) => {
    const searchLower = searchQuery.toLowerCase()
    const localizedName = t(`effects.presets.${effect.type}`).toLowerCase()
    return (
      localizedName.includes(searchLower) ||
      effect.name.toLowerCase().includes(searchLower)
    )
  })

  const handleEffectClick = (effect: VideoEffect) => {
    console.log("Applying effect:", effect.name)
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between p-1">
        <Input
          type="search"
          placeholder={t("common.search")}
          className="mr-5 h-7 w-full max-w-[400px] rounded-sm border border-gray-300 text-xs outline-none focus:border-gray-400 focus:ring-0 focus-visible:ring-0 dark:border-gray-600 dark:focus:border-gray-500"
          style={{
            backgroundColor: "transparent",
          }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex items-center gap-1">
          {/* Кнопки изменения размера */}
          <TooltipProvider>
            <div className="mr-2 flex overflow-hidden rounded-md">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "mr-1 h-6 w-6 cursor-pointer",
                      !canDecreaseSize && "cursor-not-allowed opacity-50",
                    )}
                    onClick={handleDecreaseSize}
                    disabled={!canDecreaseSize}
                  >
                    <ZoomOut size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("browser.toolbar.zoomOut")}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "mr-1 h-6 w-6 cursor-pointer",
                      !canIncreaseSize && "cursor-not-allowed opacity-50",
                    )}
                    onClick={handleIncreaseSize}
                    disabled={!canIncreaseSize}
                  >
                    <ZoomIn size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("browser.toolbar.zoomIn")}</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </div>

      <div className="scrollbar-hide hover:scrollbar-default min-h-0 flex-1 overflow-y-auto p-1 py-3 dark:bg-[#1b1a1f]">
        {!isSizeLoaded ? (
          <div className="flex h-full items-center justify-center text-gray-500" />
        ) : filteredEffects.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            {t("browser.tabs.effects")} {t("common.notFound")}
          </div>
        ) : (
          <div
            className="grid grid-cols-[repeat(auto-fill,minmax(0,calc(var(--preview-size)+12px)))] gap-2"
            style={{ "--preview-size": `${previewSize}px` } as React.CSSProperties}
          >
            {filteredEffects.map((effect) => (
              <EffectPreview
                key={effect.id}
                effectType={effect.type}
                onClick={() => handleEffectClick(effect)}
                size={previewSize}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
