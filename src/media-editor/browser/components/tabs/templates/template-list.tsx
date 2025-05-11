import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { usePreviewSize } from "@/media-editor/browser"
import { TemplateListToolbar } from "@/media-editor/browser/components/tabs/templates"
import { usePlayerContext } from "@/media-editor/media-player"
import { AppliedTemplate } from "@/media-editor/media-player/services/template-service"
import { useProject } from "@/media-editor/project-settings/project-provider"
import { useTimeline } from "@/media-editor/timeline/services/timeline-provider"
import { MediaFile, Track } from "@/types/media"

import { getTemplateLabels } from "./template-labels"
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
      const fixedWidth = (size / height) * width
      return { width: fixedWidth, height: size }
    }

    // Для горизонтальных шаблонов уменьшаем высоту пропорционально
    const calculatedHeight = Math.min((size * height) / width, size)
    return { width: size, height: calculatedHeight }
  }

  const { height: previewHeight, width: previewWidth } = calculateDimensions()

  return (
    <div
      className="group relative cursor-pointer"
      style={{
        aspectRatio: `${width} / ${height}`,
        height: `${previewHeight}px`,
        width: `${previewWidth}px`,
      }}
      onClick={onClick}
    >
      {template.render()}
    </div>
  )
}

export function TemplateList() {
  const { t, i18n } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [, setActiveTemplate] = useState<MediaTemplate | null>(null)
  const [, setCurrentGroup] = useState<"landscape" | "portrait" | "square">("landscape")
  const [currentDimensions, setCurrentDimensions] = useState<[number, number]>([1920, 1080])
  const [templates, setTemplates] = useState<MediaTemplate[]>([])
  const { settings } = useProject()

  // Получаем доступ к контексту плеера для работы с параллельными видео и шаблонами
  const { parallelVideos, setAppliedTemplate } = usePlayerContext()

  const {
    previewSize,
    isSizeLoaded,
    handleIncreaseSize,
    handleDecreaseSize,
    canIncreaseSize,
    canDecreaseSize,
  } = usePreviewSize("TEMPLATES")

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
    const searchLower = searchQuery.toLowerCase().trim()

    // Если поисковый запрос пустой, возвращаем все шаблоны
    if (!searchLower) {
      return true
    }

    // Проверяем, является ли запрос одной цифрой (количество экранов)
    if (/^\d+$/.test(searchLower)) {
      const screenCount = parseInt(searchLower, 10)
      return template.screens === screenCount
    }

    // Проверяем, является ли запрос двумя цифрами, разделенными пробелом или x/х (например, "5 2" или "5x2")
    const twoDigitsMatch = searchLower.match(/^(\d+)[\s×x](\d+)$/)
    if (twoDigitsMatch) {
      const [, firstDigit, secondDigit] = twoDigitsMatch
      // Проверяем, содержит ли ID шаблона эти две цифры в правильном порядке
      const digitPattern = new RegExp(`${firstDigit}[^\\d]*${secondDigit}`)
      return digitPattern.test(template.id)
    }

    // Стандартный поиск по ID
    if (template.id.toLowerCase().includes(searchLower)) {
      return true
    }

    // Поиск по локализованным названиям
    const labels = getTemplateLabels(template.id)
    if (labels) {
      if (
        labels.ru.toLowerCase().includes(searchLower) ||
        labels.en.toLowerCase().includes(searchLower)
      ) {
        return true
      }
    }

    return false
  })

  // Группируем шаблоны по количеству экранов
  const groupedTemplates = filteredTemplates.reduce<Record<number, MediaTemplate[]>>(
    (acc, template) => {
      const screenCount = template.screens || 1
      if (!acc[screenCount]) {
        acc[screenCount] = []
      }
      acc[screenCount].push(template)
      return acc
    },
    {},
  )

  // Получаем отсортированные ключи групп (количество экранов)
  const sortedGroups = Object.keys(groupedTemplates)
    .map(Number)
    .sort((a, b) => a - b)

  // Получаем доступ к контексту таймлайна для получения всех видео с таймлайна
  const { tracks } = useTimeline()

  const handleTemplateClick = (template: MediaTemplate) => {
    setActiveTemplate(template)

    // Получаем локализованное название шаблона
    const labels = getTemplateLabels(template.id)
    const templateName = labels ? labels[i18n.language === "en" ? "en" : "ru"] : template.id

    console.log("Applying template:", template.id, templateName)

    // Собираем все видео со всех треков таймлайна
    const allTimelineVideos: MediaFile[] = []
    tracks.forEach((track: Track) => {
      if (track.videos && track.videos.length > 0) {
        allTimelineVideos.push(...track.videos)
      }
    })

    // Проверяем, что у всех видео есть путь
    const validVideos = allTimelineVideos.filter((video) => {
      if (!video.path) {
        console.error(`Видео ${video.id} не имеет пути:`, video)
        return false
      }
      return true
    })

    // Сортируем видео по времени начала (startTime)
    const sortedVideos = [...validVideos].sort((a, b) => (a.startTime || 0) - (b.startTime || 0))

    if (sortedVideos.length > 0) {
      console.log(
        `Применяем шаблон "${templateName}" (${template.id}) к ${sortedVideos.length} видео с таймлайна`,
      )

      // Проверяем, сколько экранов в шаблоне и сколько у нас видео
      const screensCount = template.screens || 1
      const availableVideos = sortedVideos.slice(0, screensCount)

      console.log(
        `Шаблон содержит ${screensCount} экранов, доступно ${availableVideos.length} видео`,
      )

      // Подробное логирование видео для отладки
      console.log("Детали видео для шаблона:")
      availableVideos.forEach((v, i) => {
        console.log(
          `Видео ${i + 1}/${availableVideos.length}: id=${v.id}, path=${v.path}, name=${v.name}`,
        )
      })

      // Создаем объект AppliedTemplate
      const appliedTemplate: AppliedTemplate = {
        template,
        videos: availableVideos,
      }

      // Применяем шаблон через контекст плеера
      setAppliedTemplate(appliedTemplate)
    } else if (parallelVideos.length > 0) {
      // Если на таймлайне нет видео, но есть параллельные видео, используем их (для обратной совместимости)
      console.log(`На таймлайне нет видео, используем ${parallelVideos.length} параллельных видео`)

      const screensCount = template.screens || 1
      const availableVideos = parallelVideos.slice(0, screensCount)

      const appliedTemplate: AppliedTemplate = {
        template,
        videos: availableVideos,
      }

      setAppliedTemplate(appliedTemplate)
    } else {
      console.log("Нет видео на таймлайне и нет параллельных видео для применения шаблона")
    }
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

      <div className="scrollbar-hide hover:scrollbar-default min-h-0 flex-1 overflow-y-auto p-3 dark:bg-[#1b1a1f]">
        {!isSizeLoaded ? (
          <div className="flex h-full items-center justify-center text-gray-500" />
        ) : filteredTemplates.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            {t("browser.tabs.templates")} {t("common.notFound")}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Выводим шаблоны, сгруппированные по количеству экранов */}
            {sortedGroups.map((screenCount) => (
              <div key={screenCount} className="mb-4">
                <h3 className="mb-3 text-sm font-medium text-gray-400">
                  {screenCount}{" "}
                  {i18n.language === "en"
                    ? screenCount === 1
                      ? "screen"
                      : "screens"
                    : screenCount === 1
                      ? "экран"
                      : screenCount < 5
                        ? "экрана"
                        : "экранов"}
                </h3>
                <div
                  className="flex flex-wrap gap-4"
                  style={{ "--preview-size": `${previewSize}px` } as React.CSSProperties}
                >
                  {groupedTemplates[screenCount].map((template) => (
                    <div key={template.id} className="flex flex-col items-center">
                      <TemplatePreview
                        template={template}
                        onClick={() => handleTemplateClick(template)}
                        size={previewSize}
                        dimensions={currentDimensions}
                      />
                      <div
                        className="mt-1 truncate text-center text-xs text-gray-400"
                        title={
                          getTemplateLabels(template.id)?.[i18n.language === "en" ? "en" : "ru"] ||
                          template.id
                        }
                        style={{ width: `${previewSize}px` }}
                      >
                        {getTemplateLabels(template.id)?.[i18n.language === "en" ? "en" : "ru"] ||
                          template.id}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
