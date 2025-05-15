/**
 * Кнопка для создания сборной дорожки
 */
import { Layers } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sector } from "@/media-editor/browser/utils/media-files"
import { useTimeline } from "@/media-editor/timeline/services"
import { CompositeTrackBuilder } from "@/media-editor/timeline/utils/composite-track-builder"
import { runCompositeTrackDemo } from "@/media-editor/timeline/utils/composite-track-demo"
import { EditSegment } from "@/types/edit-schema"

interface CompositeTrackButtonProps {
  sector?: Sector | null
  className?: string
}

export function CompositeTrackButton({ sector, className }: CompositeTrackButtonProps) {
  const { t } = useTranslation()
  const { editSegments } = useTimeline()

  // Функция для создания сборной дорожки
  const handleCreateCompositeTrack = (options: {
    segmentId: string
    switchInterval: number
    trackTypes: ("video" | "audio" | "title" | "subtitle")[]
    includeTransitions: boolean
    transitionDuration: number
  }) => {
    console.log("Создание сборной дорожки с параметрами:", options)

    try {
      // Находим сегмент по ID
      const segment = editSegments.find((segment) => segment.id === options.segmentId)

      if (!segment) {
        console.error(`Сегмент с ID ${options.segmentId} не найден`)
        return
      }

      // Создаем сборную дорожку
      const result = CompositeTrackBuilder.buildCompositeTrack(segment, options)

      // Выводим результат в консоль
      console.log("Создана сборная дорожка:", result)
      console.log("Команда FFmpeg:", result.ffmpegCommand)
      console.log("Сегменты:", result.segments)

      // Здесь можно добавить код для обновления схемы монтажа
      // Например, добавить сборную дорожку в сегмент
      // updateEditSegments([...editSegments])

      // Показываем уведомление пользователю
      alert(`Создана сборная дорожка "${result.track.name}". Результат выведен в консоль.`)

      // Запускаем демонстрацию
      runCompositeTrackDemo()
    } catch (error) {
      console.error("Ошибка при создании сборной дорожки:", error)
    }
  }

  // Если нет активного сектора, кнопка неактивна
  if (!sector) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={className} disabled>
              <Layers className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("timeline.compositeTrack.noActiveSector") || "Нет активного сектора"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Преобразуем сектор в сегмент для демонстрации
  const demoSegment: EditSegment = {
    id: sector.id, // Используем ID сектора
    name: sector.name, // Используем название сектора
    startTime: sector.startTime || 0,
    duration: (sector.endTime || 30) - (sector.startTime || 0), // Вычисляем длительность
    tracks: sector.tracks.map((track) => ({
      id: track.id,
      name: track.name || "Дорожка",
      type: (track.type as "video" | "audio") || "video",
      sourceId: track.id,
      startTime: track.startTime || 0,
      duration: 10, // Фиксированная длительность для демонстрации
      resources: [],
    })),
  }

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className={className}>
                <Layers className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("timeline.compositeTrack.createCompositeTrack", "Создать сборную дорожку")}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {t("timeline.compositeTrack.options", "Параметры сборной дорожки")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            handleCreateCompositeTrack({
              segmentId: demoSegment.id,
              switchInterval: 3,
              trackTypes: ["video"],
              includeTransitions: true,
              transitionDuration: 0.5,
            })
          }}
        >
          {t("timeline.compositeTrack.videoOnly", "Только видео (3 сек)")}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            handleCreateCompositeTrack({
              segmentId: demoSegment.id,
              switchInterval: 5,
              trackTypes: ["video"],
              includeTransitions: true,
              transitionDuration: 1,
            })
          }}
        >
          {t("timeline.compositeTrack.videoLonger", "Видео (5 сек)")}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            handleCreateCompositeTrack({
              segmentId: demoSegment.id,
              switchInterval: 3,
              trackTypes: ["audio"],
              includeTransitions: true,
              transitionDuration: 0.5,
            })
          }}
        >
          {t("timeline.compositeTrack.audioOnly", "Только аудио")}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            runCompositeTrackDemo()
          }}
        >
          {t("timeline.compositeTrack.runDemo", "Запустить демо")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
