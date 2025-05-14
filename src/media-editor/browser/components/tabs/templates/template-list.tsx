import React, { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { useMedia, usePreviewSize } from "@/media-editor/browser"
import { AddMediaButton } from "@/media-editor/browser/components/layout/add-media-button"
import { FavoriteButton } from "@/media-editor/browser/components/layout/favorite-button"
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
  // Локальное состояние для отслеживания добавления шаблона
  const [localIsAdded, setLocalIsAdded] = useState(false)

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
  const { addTemplate, isTemplateAdded, removeResource, templateResources } = useTimeline()

  // Создаем клон элемента с добавлением ключа для предотвращения предупреждения React
  const renderedTemplate = template.render()

  // Проверяем, добавлен ли шаблон уже в хранилище
  const isAddedFromStore = isTemplateAdded(template)

  // При изменении состояния в хранилище, обновляем локальное состояние
  useEffect(() => {
    setLocalIsAdded(isAddedFromStore)
  }, [isAddedFromStore])

  // Используем комбинированное состояние - либо из хранилища, либо локальное
  const isAdded = isAddedFromStore || localIsAdded

  const handleAddTemplate = (e: React.MouseEvent, _file: MediaFile) => {
    e.stopPropagation()
    // Немедленно обновляем локальное состояние
    setLocalIsAdded(true)
    // Добавляем шаблон в хранилище
    addTemplate(template)

    // Принудительно обновляем состояние, чтобы кнопка стала видимой сразу
    setTimeout(() => {
      // Это вызовет перерисовку компонента
      const isAdded = isTemplateAdded(template)
      console.log(`Шаблон ${template.id} добавлен: ${isAdded}`)
    }, 10)
  }

  const handleRemoveTemplate = (e: React.MouseEvent, _file: MediaFile) => {
    e.stopPropagation()
    // Немедленно обновляем локальное состояние
    setLocalIsAdded(false)
    // Находим ресурс с этим шаблоном и удаляем его
    const resource = templateResources.find((res) => res.resourceId === template.id)

    if (resource) {
      removeResource(resource.id)
    } else {
      console.warn(`Не удалось найти ресурс шаблона с ID ${template.id} для удаления`)
    }
  }

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
      {React.cloneElement(renderedTemplate, { key: `template-preview-${template.id}` })}

      {/* Кнопка избранного */}
      <FavoriteButton
        file={{ id: template.id, path: "", name: template.id }}
        size={previewWidth}
        type="template"
      />

      <div
        className={`transition-opacity duration-200 ${
          isAdded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        style={{ visibility: isAdded ? "visible" : "inherit" }}
      >
        <AddMediaButton
          file={{ id: template.id, path: "", name: template.id }}
          onAddMedia={handleAddTemplate}
          onRemoveMedia={handleRemoveTemplate}
          isAdded={isAdded}
          size={previewWidth}
        />
      </div>
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
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const { settings } = useProject()

  const handleToggleFavorites = useCallback(() => {
    setShowFavoritesOnly((prev) => !prev)
  }, [])

  // Получаем доступ к контексту плеера для работы с параллельными видео и шаблонами
  const {
    parallelVideos,
    setParallelVideos, // Добавляем setParallelVideos для обновления параллельных видео
    setAppliedTemplate,
    isPlaying,
    setIsPlaying,
    preferredSource, // Добавляем preferredSource для определения текущего источника
    setActiveVideoId, // Добавляем setActiveVideoId для установки активного видео
    setVideo, // Добавляем setVideo для установки активного видео
  } = usePlayerContext()

  // Получаем доступ к контексту медиа для работы с медиафайлами
  const media = useMedia()

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

    // Фильтрация по избранному
    const matchesFavorites =
      !showFavoritesOnly ||
      media.isItemFavorite({ id: template.id, path: "", name: template.id }, "template")

    // Если не проходит фильтр по избранному, сразу возвращаем false
    if (!matchesFavorites) {
      return false
    }

    // Если поисковый запрос пустой, возвращаем все шаблоны (с учетом фильтра по избранному)
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
    const label = getTemplateLabels(template.id)
    if (label && label.toLowerCase().includes(searchLower)) {
      return true
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
    const templateName = getTemplateLabels(template.id) || template.id

    console.log("Applying template:", template.id, templateName)
    console.log(`Текущий источник видео: ${preferredSource}`)

    // Определяем, какие видео использовать в зависимости от выбранного источника
    let availableVideos: MediaFile[] = []
    const sourceType: "timeline" | "media" = preferredSource

    // Если выбран источник "timeline" (таймлайн)
    if (preferredSource === "timeline") {
      console.log("Используем видео из таймлайна, так как выбран источник 'timeline'")

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
        console.log(`Найдено ${sortedVideos.length} видео из таймлайна`)

        // Проверяем, сколько экранов в шаблоне и сколько у нас видео
        const screensCount = template.screens || 1
        availableVideos = sortedVideos.slice(0, screensCount).map((video) => ({
          ...video,
          source: "timeline", // Явно устанавливаем источник как timeline
        }))
      } else {
        console.log("На таймлайне нет видео, но источник установлен как 'timeline'")

        // Если на таймлайне нет видео, но источник установлен как timeline,
        // создаем пустые видео для шаблона
        const screensCount = template.screens || 1
        availableVideos = Array(screensCount)
          .fill(null)
          .map((_, i) => ({
            id: `empty-${i}`,
            name: `Empty Video ${i + 1}`,
            path: "",
            duration: 0,
            isVideo: true,
            isAudio: false,
            isImage: false,
            source: "timeline", // Явно устанавливаем источник как timeline
          }))
      }
    }
    // Если выбран источник "media" (браузер)
    else {
      console.log("Используем видео из браузера, так как выбран источник 'media'")

      // Получаем все медиафайлы из библиотеки
      if (media.allMediaFiles && media.allMediaFiles.length > 0) {
        console.log(`Найдено ${media.allMediaFiles.length} медиафайлов из библиотеки`)

        // Фильтруем только видеофайлы с путями
        const validMediaFiles = media.allMediaFiles.filter(
          (file: MediaFile) => file.isVideo && file.path,
        )

        if (validMediaFiles.length > 0) {
          // Сортируем по имени
          const sortedMediaFiles = [...validMediaFiles].sort((a, b) => {
            return (a.name || "").localeCompare(b.name || "")
          })

          // Берем несколько видео для параллельного отображения (до 4 или сколько нужно для шаблона)
          const screensCount = template.screens || 1
          const selectedVideos = sortedMediaFiles.slice(0, Math.max(4, screensCount))

          console.log(`[TemplateClick] Выбрано ${selectedVideos.length} видео из библиотеки`)

          // Обновляем параллельные видео
          setParallelVideos(selectedVideos)

          console.log(
            `[TemplateClick] Установлены параллельные видео: ${selectedVideos.map((v) => v.id).join(", ")}`,
          )

          // Используем выбранные видео для шаблона
          availableVideos = selectedVideos.slice(0, screensCount).map((video) => ({
            ...video,
            source: "media", // Явно устанавливаем источник как media
          }))
        } else {
          console.log("В библиотеке нет подходящих видеофайлов")

          // Если нет подходящих видеофайлов, создаем пустые видео для шаблона
          const screensCount = template.screens || 1
          availableVideos = Array(screensCount)
            .fill(null)
            .map((_, i) => ({
              id: `empty-${i}`,
              name: `Empty Video ${i + 1}`,
              path: "",
              duration: 0,
              isVideo: true,
              isAudio: false,
              isImage: false,
              source: "media", // Явно устанавливаем источник как media
            }))
        }
      }
      // Если нет ни параллельных видео, ни медиафайлов, создаем пустые видео
      else {
        console.log("Нет доступных видео из браузера")

        // Создаем пустые видео для шаблона
        const screensCount = template.screens || 1
        availableVideos = Array(screensCount)
          .fill(null)
          .map((_, i) => ({
            id: `empty-${i}`,
            name: `Empty Video ${i + 1}`,
            path: "",
            duration: 0,
            isVideo: true,
            isAudio: false,
            isImage: false,
            source: "media", // Явно устанавливаем источник как media
          }))
      }
    }

    // Подробное логирование видео для отладки
    console.log(
      `Шаблон содержит ${template.screens || 1} экранов, доступно ${availableVideos.length} видео из источника ${sourceType}`,
    )
    console.log("Детали видео для шаблона:")
    availableVideos.forEach((v, i) => {
      console.log(
        `Видео ${i + 1}/${availableVideos.length}: id=${v.id}, path=${v.path}, name=${v.name}, source=${sourceType}`,
      )
    })

    // Создаем объект AppliedTemplate
    const appliedTemplate: AppliedTemplate = {
      template,
      videos: availableVideos,
    }

    // Применяем шаблон через контекст плеера
    setAppliedTemplate(appliedTemplate)

    // Если есть видео в шаблоне, устанавливаем первое как активное
    if (availableVideos.length > 0 && availableVideos[0].id) {
      setActiveVideoId(availableVideos[0].id)
      setVideo(availableVideos[0])
      console.log(`Установлено активное видео: ${availableVideos[0].id}`)
    }

    // Запускаем воспроизведение, если оно было активно
    if (isPlaying) {
      console.log(`Запускаем воспроизведение видео в шаблоне`)
      // Небольшая задержка для инициализации шаблона
      setTimeout(() => {
        setIsPlaying(true)
      }, 100)
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
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavorites={handleToggleFavorites}
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
                  {t(
                    `browser.templateScreens.${screenCount === 1 ? "one" : i18n.language === "ru" && screenCount < 5 ? "few" : "many"}`,
                    {
                      count: screenCount,
                      defaultValue: screenCount === 1 ? "screen" : "screens",
                    },
                  )}
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
                        title={getTemplateLabels(template.id) || template.id}
                        style={{ width: `${previewSize}px` }}
                      >
                        {getTemplateLabels(template.id) || template.id}
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
