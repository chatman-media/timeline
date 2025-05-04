import { type JSX, useState, useEffect, useCallback } from "react"
import { usePreviewSize } from "../../preview/preview-sizes"
import { TemplateListToolbar } from "."
import { useProject } from "@/media-editor/project-settings/project-provider"

interface MediaTemplate {
  id: string
  split: "vertical" | "horizontal"
  render: () => JSX.Element
}

const TEMPLATE_MAP: Record<"landscape" | "portrait" | "square", MediaTemplate[]> = {
  landscape: [
    {
      id: "split-vertical-landscape",
      split: "vertical",
      render: () => (
        <div className="flex h-full w-full">
          <div className="flex flex-1 items-center justify-center text-gray-400 text-lg font-normal" style={{ background: "#23262b" }}>1</div>
          <div className="h-full w-px bg-gray-600" />
          <div className="flex flex-1 items-center justify-center text-gray-400 text-lg font-normal" style={{ background: "#2a2e36" }}>2</div>
        </div>
      ),
    },
    {
      id: "split-horizontal-landscape",
      split: "horizontal",
      render: () => (
        <div className="flex h-full w-full flex-col">
          <div className="flex flex-1 items-center justify-center text-gray-400 text-lg font-normal" style={{ background: "#23262b" }}>1</div>
          <div className="w-full h-px bg-gray-600" />
          <div className="flex flex-1 items-center justify-center text-gray-400 text-lg font-normal" style={{ background: "#2a2e36" }}>2</div>
        </div>
      ),
    },
  ],
  portrait: [
    {
      id: "split-vertical-portrait",
      split: "vertical",
      render: () => (
        <div className="flex h-full w-full">
          <div className="flex flex-1 items-center justify-center text-gray-400 text-lg font-normal" style={{ background: "#23262b" }}>1</div>
          <div className="h-full w-px bg-gray-600" />
          <div className="flex flex-1 items-center justify-center text-gray-400 text-lg font-normal" style={{ background: "#2a2e36" }}>2</div>
        </div>
      ),
    },
    {
      id: "split-horizontal-portrait",
      split: "horizontal",
      render: () => (
        <div className="flex h-full w-full flex-col">
          <div className="flex flex-1 items-center justify-center text-gray-400 text-lg font-normal" style={{ background: "#23262b" }}>1</div>
          <div className="w-full h-px bg-gray-600" />
          <div className="flex flex-1 items-center justify-center text-gray-400 text-lg font-normal" style={{ background: "#2a2e36" }}>2</div>
        </div>
      ),
    },
  ],
  square: [
    {
      id: "split-vertical-square",
      split: "vertical",
      render: () => (
        <div className="flex h-full w-full">
          <div className="flex flex-1 items-center justify-center text-gray-400 text-lg font-normal" style={{ background: "#23262b" }}>1</div>
          <div className="h-full w-px bg-gray-600" />
          <div className="flex flex-1 items-center justify-center text-gray-400 text-lg font-normal" style={{ background: "#2a2e36" }}>2</div>
        </div>
      ),
    },
    {
      id: "split-horizontal-square",
      split: "horizontal",
      render: () => (
        <div className="flex h-full w-full flex-col">
          <div className="flex flex-1 items-center justify-center text-gray-400 text-lg font-normal" style={{ background: "#23262b" }}>1</div>
          <div className="w-full h-px bg-gray-600" />
          <div className="flex flex-1 items-center justify-center text-gray-400 text-lg font-normal" style={{ background: "#2a2e36" }}>2</div>
        </div>
      ),
    },
  ],
}

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
  const calculateWidth = (): number => {
    const [width, height] = dimensions
    return Math.min((size * width) / height, size)
  }
  return (
    <div
      className="group relative h-full flex-shrink-0 cursor-pointer"
      style={{ height: `${size}px`, width: `${calculateWidth().toFixed(0)}px`, maxWidth: `${size}px` }}
      onClick={onClick}
    >
      {template.render()}
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
    const dimensions: [number, number] = [settings.aspectRatio.value.width, settings.aspectRatio.value.height]

    setCurrentGroup(group)
    setCurrentDimensions(dimensions)
    setTemplates(TEMPLATE_MAP[group])

    console.log("[TemplateList] Templates updated:", {
      aspectRatio: settings.aspectRatio.label,
      resolution: settings.resolution,
      group,
      dimensions,
      width: settings.aspectRatio.value.width,
      height: settings.aspectRatio.value.height
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

      <div className="flex-1 overflow-y-auto p-3">
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
                  dimensions={currentDimensions}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
