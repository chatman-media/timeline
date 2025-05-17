import React, { useEffect, useMemo,useState } from "react"
import { useTranslation } from "react-i18next"

import { toast } from "@/components/ui/use-toast"
import { useYoloData } from "@/media-editor/hooks/use-yolo-data"
import { MediaFile, Track } from "@/types/media"
import { YoloVideoData, YoloVideoSummary } from "@/types/yolo"

interface YoloTrackOverlayProps {
  video: MediaFile
  track: Track
  sectionStart: number
  sectionEnd: number
  width: number
}

/**
 * Компонент для отображения данных YOLO на дорожке таймлайна
 */
export function YoloTrackOverlay({
  video,
  track,
  sectionStart,
  sectionEnd,
  width,
}: YoloTrackOverlayProps) {
  const { t } = useTranslation()
  const { loadYoloDataForVideo, createVideoSummary } = useYoloData()

  const [yoloData, setYoloData] = useState<YoloVideoData | null>(null)
  const [summary, setSummary] = useState<YoloVideoSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Загружаем данные YOLO при монтировании компонента
  useEffect(() => {
    if (!video || !video.id) return

    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Загружаем данные YOLO
        const data = await loadYoloDataForVideo(video.id)
        setYoloData(data)

        if (data) {
          // Создаем сводную информацию
          const summaryData = await createVideoSummary(video.id)
          setSummary(summaryData)
        } else {
          setError("Нет данных YOLO для этого видео")
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Неизвестная ошибка"
        setError(errorMessage)
        console.error(`[YoloTrackOverlay] Ошибка при загрузке данных YOLO:`, err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [video, loadYoloDataForVideo, createVideoSummary])

  // Рассчитываем маркеры объектов для отображения на дорожке
  const objectMarkers = useMemo(() => {
    if (!summary || !summary.classTimeRanges) return []

    const markers: Array<{
      class: string
      start: number
      end: number
      color: string
      left: number
      width: number
    }> = []

    // Определяем цвета для классов объектов
    const classColors: Record<string, string> = {
      person: "#FF5555",
      car: "#55FF55",
      dog: "#5555FF",
      cat: "#FFFF55",
      // Добавьте другие классы по необходимости
    }

    // Создаем маркеры для каждого класса объектов
    Object.entries(summary.classTimeRanges).forEach(([className, timeRanges]) => {
      // Определяем цвет для класса
      const color = classColors[className] || "#FFA500"

      // Создаем маркеры для каждого временного диапазона
      timeRanges.forEach((range) => {
        // Рассчитываем позицию и ширину маркера
        const startTime = range.start
        const endTime = range.end

        // Проверяем, что диапазон находится в пределах видимой секции
        if (endTime < sectionStart || startTime > sectionEnd) return

        // Рассчитываем позицию и ширину маркера в пикселях
        const sectionDuration = sectionEnd - sectionStart
        const left = ((startTime - sectionStart) / sectionDuration) * width
        const markerWidth = ((endTime - startTime) / sectionDuration) * width

        // Добавляем маркер
        markers.push({
          class: className,
          start: startTime,
          end: endTime,
          color,
          left,
          width: markerWidth,
        })
      })
    })

    return markers
  }, [summary, sectionStart, sectionEnd, width])

  // Если данные загружаются, показываем индикатор загрузки
  if (loading) {
    return (
      <div className="bg-opacity-30 absolute inset-0 flex items-center justify-center bg-black">
        <div className="text-sm text-white">{t("Загрузка данных YOLO...")}</div>
      </div>
    )
  }

  // Если произошла ошибка, показываем сообщение об ошибке
  if (error) {
    return (
      <div className="bg-opacity-30 absolute inset-0 flex items-center justify-center bg-black">
        <div className="text-sm text-red-500">{t(error)}</div>
      </div>
    )
  }

  // Если нет данных YOLO, не отображаем ничего
  if (!yoloData || !summary) {
    return null
  }

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Маркеры объектов */}
      <div className="absolute bottom-0 left-0 h-4 w-full">
        {objectMarkers.map((marker, index) => (
          <div
            key={index}
            className="absolute h-full rounded-sm"
            style={{
              left: `${marker.left}px`,
              width: `${marker.width}px`,
              backgroundColor: marker.color,
              opacity: 0.7,
            }}
            title={`${marker.class}: ${marker.start.toFixed(1)}s - ${marker.end.toFixed(1)}s`}
          />
        ))}
      </div>

      {/* Кнопка для создания объединенной дорожки на основе данных YOLO */}
      <button
        className="pointer-events-auto absolute top-1 right-1 rounded bg-blue-500 px-2 py-1 text-xs text-white"
        onClick={() => {
          // Здесь будет логика создания объединенной дорожки
          // Пока просто показываем уведомление
          toast({
            title: t("Создание объединенной дорожки"),
            description: t(
              "Функция создания объединенной дорожки на основе данных YOLO находится в разработке",
            ),
            variant: "default",
          })
        }}
      >
        {t("Создать объединенную дорожку")}
      </button>

      {/* Индикатор наличия данных YOLO */}
      <div className="absolute top-1 left-1 rounded bg-green-500 px-2 py-1 text-xs text-white">
        YOLO: {summary.detectedClasses.length} {t("классов")}
      </div>
    </div>
  )
}
