import { type JSX, useCallback, useEffect, useState } from "react"

import { useProject } from "@/media-editor/project-settings/project-provider"

import { usePreviewSize } from "../../preview/preview-sizes"
import { TemplateListToolbar } from "."
import { MediaTemplate, TEMPLATE_MAP } from "./templates"

function mapAspectLabelToGroup(label: string): "landscape" | "square" | "portrait" {
  if (label === "1:1") return "square"
  if (label === "9:16" || label === "4:5") return "portrait"
  return "landscape"
}

interface TemplatePreviewProps {
  template: MediaTemplate
  onClick: () => void
  size: number
  dimensions: [number, number]
}

export function TemplatePreview({ template, onClick, size, dimensions }: TemplatePreviewProps) {
  const [width, height] = dimensions

  // Вычисляем размеры превью, сохраняя соотношение сторон
  const calculateDimensions = (): { width: number; height: number } => {
    // Для квадратных шаблонов используем одинаковую ширину и высоту
    if (width === height) {
      return { width: size, height: size }
    }

    // Для вертикальных шаблонов используем максимально возможную ширину
    // и увеличиваем высоту пропорционально
    if (height > width) {
      // Используем 90% доступного пространства для лучшего отображения
      const fixedWidth = size * 0.9;
      const calculatedHeight = (fixedWidth * height) / width;
      return { width: fixedWidth, height: calculatedHeight }
    }

    // Для горизонтальных шаблонов уменьшаем высоту пропорционально
    const calculatedHeight = Math.min((size * height) / width, size)
    return { width: size, height: calculatedHeight }
  }

  const { height: previewHeight } = calculateDimensions()

  return (
    <div
      className="group relative flex-shrink-0 cursor-pointer flex items-center justify-center w-full h-full"
      onClick={onClick}
    >
      <div
        className="relative w-full"
        style={{
          // Сохраняем соотношение сторон
          aspectRatio: `${width} / ${height}`,
          // Максимальная высота для контейнера
          maxHeight: `${previewHeight}px`,
          // Минимальная ширина для вертикальных шаблонов
          minWidth: height > width ? '120px' : 'auto'
        }}
      >
        {template.render()}
      </div>
    </div>
  )
}

export function TemplateList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [, setActiveTemplate] = useState<MediaTemplate | null>(null)
  const [currentGroup, setCurrentGroup] = useState<"landscape" | "portrait" | "square">("landscape")
  const [currentDimensions, setCurrentDimensions] = useState<[number, number]>([1920, 1080])
  const [templates, setTemplates] = useState<MediaTemplate[]>([])
  const { settings } = useProject()

  const {
    previewSize,
    isSizeLoaded,
    handleIncreaseSize,
    handleDecreaseSize,
    canIncreaseSize,
    canDecreaseSize,
  } = usePreviewSize("EFFECTS_AND_FILTERS")

  // Эффект для инициализации и обновления шаблонов при монтировании компонента
  useEffect(() => {
    const group = mapAspectLabelToGroup(settings.aspectRatio.label)
    const dimensions: [number, number] = [
      settings.aspectRatio.value.width,
      settings.aspectRatio.value.height,
    ]

    setCurrentGroup(group)
    setCurrentDimensions(dimensions)
    setTemplates(TEMPLATE_MAP[group])

    console.log("[TemplateList] Templates updated:", {
      aspectRatio: settings.aspectRatio.label,
      resolution: settings.resolution,
      group,
      dimensions,
      width: settings.aspectRatio.value.width,
      height: settings.aspectRatio.value.height,
    })
  }, [settings.aspectRatio, settings.resolution])

  const filteredTemplates = templates.filter((template) => {
    const searchLower = searchQuery.toLowerCase()
    return template.id.toLowerCase().includes(searchLower)
  })

  const handleTemplateClick = (template: MediaTemplate) => {
    setActiveTemplate(template)
    console.log("Applying template:", template.id)
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <TemplateListToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        canDecreaseSize={canDecreaseSize}
        canIncreaseSize={canIncreaseSize}
        handleDecreaseSize={handleDecreaseSize}
        handleIncreaseSize={handleIncreaseSize}
      />

      <div className="scrollbar-hide hover:scrollbar-default min-h-0 flex-1 overflow-y-auto p-1 py-3 dark:bg-[#1b1a1f]">
        {!isSizeLoaded ? (
          <div className="flex h-full items-center justify-center text-gray-500" />
        ) : filteredTemplates.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            Шаблоны не найдены
          </div>
        ) : (
          <div>
            <div className="mb-2 text-xs font-semibold text-gray-400">
              {currentGroup === "landscape" && "Широкоэкранные"}
              {currentGroup === "square" && "Квадратные"}
              {currentGroup === "portrait" && "Вертикальные"}
            </div>

            {/* Группируем шаблоны по количеству экранов */}
            {[2, 3].map((screenCount) => {
              const templatesWithScreenCount = filteredTemplates.filter(
                (template) => template.screens === screenCount,
              )

              if (templatesWithScreenCount.length === 0) return null

              return (
                <div key={screenCount} className="mb-6">
                  <div className="mb-2 text-xs text-gray-500">
                    {screenCount}{" "}
                    {screenCount === 1
                      ? "экран"
                      : screenCount >= 2 && screenCount <= 4
                        ? "экрана"
                        : "экранов"}
                  </div>
                  <div
                    className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4"
                    style={{ "--preview-size": `${previewSize}px` } as React.CSSProperties}
                  >
                    {templatesWithScreenCount.map((template) => (
                      <TemplatePreview
                        key={template.id}
                        template={template}
                        onClick={() => handleTemplateClick(template)}
                        size={previewSize}
                        dimensions={currentDimensions}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
