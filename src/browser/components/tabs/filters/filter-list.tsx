import { ZoomIn, ZoomOut } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { usePreviewSize } from "@/browser/components/preview/preview-sizes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export interface VideoFilter {
  id: string
  name: string
  labels: {
    ru: string
    en: string
  }
  params: {
    brightness?: number
    contrast?: number
    saturation?: number
    gamma?: number
    temperature?: number
    tint?: number
  }
}

const filters: VideoFilter[] = [
  {
    id: "s-log",
    name: "S-Log",
    labels: {
      ru: "S-Log",
      en: "S-Log",
    },
    params: {
      brightness: 0.1,
      contrast: 0.8,
      saturation: 0.9,
      gamma: 1.2,
    },
  },
  {
    id: "d-log",
    name: "D-Log",
    labels: {
      ru: "D-Log",
      en: "D-Log",
    },
    params: {
      brightness: 0.05,
      contrast: 0.85,
      saturation: 0.95,
      gamma: 1.1,
    },
  },
  {
    id: "v-log",
    name: "V-Log",
    labels: {
      ru: "V-Log",
      en: "V-Log",
    },
    params: {
      brightness: 0.15,
      contrast: 0.75,
      saturation: 0.85,
      gamma: 1.3,
    },
  },
  {
    id: "hlg",
    name: "HLG",
    labels: {
      ru: "HLG",
      en: "HLG",
    },
    params: {
      brightness: 0.2,
      contrast: 0.9,
      saturation: 1.1,
      gamma: 1.4,
    },
  },
  {
    id: "rec709",
    name: "Rec.709",
    labels: {
      ru: "Rec.709",
      en: "Rec.709",
    },
    params: {
      brightness: 0,
      contrast: 1,
      saturation: 1,
      gamma: 1,
    },
  },
  {
    id: "rec2020",
    name: "Rec.2020",
    labels: {
      ru: "Rec.2020",
      en: "Rec.2020",
    },
    params: {
      brightness: 0.1,
      contrast: 1.1,
      saturation: 1.2,
      gamma: 1.1,
    },
  },
  {
    id: "cinestyle",
    name: "CineStyle",
    labels: {
      ru: "CineStyle",
      en: "CineStyle",
    },
    params: {
      brightness: 0.05,
      contrast: 0.9,
      saturation: 0.8,
      gamma: 1.15,
    },
  },
  {
    id: "flat",
    name: "Flat",
    labels: {
      ru: "Flat",
      en: "Flat",
    },
    params: {
      brightness: 0,
      contrast: 0.7,
      saturation: 0.7,
      gamma: 1,
    },
  },
  {
    id: "neutral",
    name: "Neutral",
    labels: {
      ru: "Нейтральный",
      en: "Neutral",
    },
    params: {
      brightness: 0,
      contrast: 1,
      saturation: 1,
      gamma: 1,
    },
  },
  {
    id: "portrait",
    name: "Portrait",
    labels: {
      ru: "Портрет",
      en: "Portrait",
    },
    params: {
      brightness: 0.1,
      contrast: 1.1,
      saturation: 0.9,
      gamma: 1.05,
      temperature: 10,
      tint: 5,
    },
  },
  {
    id: "landscape",
    name: "Landscape",
    labels: {
      ru: "Пейзаж",
      en: "Landscape",
    },
    params: {
      brightness: 0.05,
      contrast: 1.2,
      saturation: 1.3,
      gamma: 1.1,
      temperature: -5,
      tint: -2,
    },
  },
]

interface FilterPreviewProps {
  filter: VideoFilter
  onClick: () => void
  size: number
}

const FilterPreview = ({ filter, onClick, size }: FilterPreviewProps) => {
  const [isHovering, setIsHovering] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>(null)

  const getFilterStyle = () => {
    const { brightness, contrast, saturation, gamma, temperature, tint } = filter.params
    const filters = []

    if (brightness !== undefined) filters.push(`brightness(${1 + brightness})`)
    if (contrast !== undefined) filters.push(`contrast(${contrast})`)
    if (saturation !== undefined) filters.push(`saturate(${saturation})`)
    if (gamma !== undefined) filters.push(`gamma(${gamma})`)
    if (temperature !== undefined) filters.push(`sepia(${temperature}%)`)
    if (tint !== undefined) filters.push(`hue-rotate(${tint}deg)`)

    return filters.join(" ")
  }

  useEffect(() => {
    if (!videoRef.current) return
    const videoElement = videoRef.current

    const applyFilter = () => {
      videoElement.currentTime = 0
      videoElement.style.filter = getFilterStyle()
      videoElement.play()

      timeoutRef.current = setTimeout(() => {
        if (isHovering) {
          applyFilter()
        }
      }, 2000)
    }

    if (isHovering) {
      applyFilter()
    } else {
      videoElement.pause()
      videoElement.currentTime = 0
      videoElement.style.filter = ""
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [isHovering, filter])

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative cursor-pointer rounded-xs bg-black"
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
      </div>
      <div className="mt-1 text-xs text-gray-300">
        {filters.find((f) => f.id === filter.id)?.labels.ru}
      </div>
    </div>
  )
}

export function FilterList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [, setActiveFilter] = useState<VideoFilter | null>(null)

  const {
    previewSize,
    isSizeLoaded,
    handleIncreaseSize,
    handleDecreaseSize,
    canIncreaseSize,
    canDecreaseSize,
  } = usePreviewSize("EFFECTS_AND_FILTERS")

  const filteredFilters = filters.filter((filter) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      filter.labels.ru.toLowerCase().includes(searchLower) ||
      filter.labels.en.toLowerCase().includes(searchLower) ||
      filter.name.toLowerCase().includes(searchLower)
    )
  })

  const handleFilterClick = (filter: VideoFilter) => {
    setActiveFilter(filter)
    console.log("Applying filter:", filter.name, filter.params)
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-gray-800 p-3 pb-1 pl-4">
        <Input
          type="search"
          placeholder="Поиск"
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
                <TooltipContent>Уменьшить превью</TooltipContent>
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
                <TooltipContent>Увеличить превью</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {!isSizeLoaded ? (
          <div className="flex h-full items-center justify-center text-gray-500" />
        ) : filteredFilters.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            Фильтры не найдены
          </div>
        ) : (
          <div
            className="grid grid-cols-[repeat(auto-fill,minmax(0,calc(var(--preview-size)+12px)))] gap-2"
            style={{ "--preview-size": `${previewSize}px` } as React.CSSProperties}
          >
            {filteredFilters.map((filter) => (
              <FilterPreview
                key={filter.id}
                filter={filter}
                onClick={() => handleFilterClick(filter)}
                size={previewSize}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
