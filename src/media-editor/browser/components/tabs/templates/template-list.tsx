import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@radix-ui/react-tooltip"
import { ZoomIn, ZoomOut } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { usePreviewSize } from "../../preview/preview-sizes"

interface MediaTemplate {
  id: string
  name: string
  description: string
  preview: string
}

const templates: MediaTemplate[] = [
  {
    id: "1",
    name: "Template 1",
    description: "Template 1 description",
    preview: "https://via.placeholder.com/150",
  },
  {
    id: "split-vertical-2",
    name: "Разделенный экран 2",
    description: "Два окна, разделённые по вертикали",
    preview: "", // пока не нужен url, будет кастомный рендер
  },
]

interface TemplatePreviewProps {
  template: MediaTemplate
  onClick: () => void
  size: number
}

export function TemplatePreview({ template, onClick, size }: TemplatePreviewProps) {
  // Для шаблона split-vertical-2 рисуем кастомно, остальные — плейсхолдер
  if (template.id === "split-vertical-2") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="hover:border-primary flex flex-col items-center rounded-lg border border-gray-700 bg-gray-800 p-2 transition"
        style={{ width: size, height: size * 0.6, minWidth: 120, minHeight: 72 }}
      >
        <div className="relative flex h-full w-full">
          <div className="flex h-full w-1/2 items-center justify-center border-r border-gray-600 text-2xl text-gray-300">
            1
          </div>
          <div className="flex h-full w-1/2 items-center justify-center text-2xl text-gray-300">
            2
          </div>
        </div>
        <span className="mt-2 text-xs text-gray-400">{template.name}</span>
      </button>
    )
  }

  // fallback для других шаблонов
  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:border-primary flex flex-col items-center rounded-lg border border-gray-700 bg-gray-800 p-2 transition"
      style={{ width: size, height: size * 0.6, minWidth: 120, minHeight: 72 }}
    >
      <img src={template.preview} alt={template.name} className="h-full w-full object-cover" />
      <span className="mt-2 text-xs text-gray-400">{template.name}</span>
    </button>
  )
}

export function TemplateList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [, setActiveTemplate] = useState<MediaTemplate | null>(null)

  const {
    previewSize,
    isSizeLoaded,
    handleIncreaseSize,
    handleDecreaseSize,
    canIncreaseSize,
    canDecreaseSize,
  } = usePreviewSize("EFFECTS_AND_FILTERS")

  const filteredTemplates = templates.filter((template) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      template.name.toLowerCase().includes(searchLower) ||
      template.description.toLowerCase().includes(searchLower)
    )
  })

  const handleTemplateClick = (template: MediaTemplate) => {
    setActiveTemplate(template)
    console.log("Applying template:", template.name, template.description)
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
        ) : filteredTemplates.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            Шаблоны не найдены
          </div>
        ) : (
          <div
            className="grid grid-cols-[repeat(auto-fill,minmax(0,calc(var(--preview-size)+12px)))] gap-2"
            style={{ "--preview-size": `${previewSize}px` } as React.CSSProperties}
          >
            {filteredTemplates.map((template) => (
              <TemplatePreview
                key={template.id}
                template={template}
                onClick={() => handleTemplateClick(template)}
                size={previewSize}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
