/**
 * Утилита для создания сборной дорожки из нескольких параллельных дорожек
 */
import { v4 as uuidv4 } from "uuid"

import { createEditTrack, EditResource, EditSegment, EditTrack } from "@/types/edit-schema"

/**
 * Интерфейс для параметров создания сборной дорожки
 */
export interface CompositeTrackOptions {
  segmentId: string // ID сегмента, для которого создается сборная дорожка
  switchInterval?: number // Интервал переключения между дорожками в секундах (по умолчанию 3 секунды)
  trackTypes?: ("video" | "audio" | "title" | "subtitle")[] // Типы дорожек для включения в сборную дорожку
  includeTransitions?: boolean // Включать ли переходы между дорожками
  transitionDuration?: number // Длительность перехода в секундах (по умолчанию 0.5 секунды)
}

/**
 * Интерфейс для результата создания сборной дорожки
 */
export interface CompositeTrackResult {
  track: EditTrack // Созданная сборная дорожка
  ffmpegCommand: string // Команда FFmpeg для сборки дорожки
  segments: {
    trackId: string // ID исходной дорожки
    startTime: number // Время начала сегмента в сборной дорожке
    duration: number // Длительность сегмента
    tracks: EditTrack[] // Все дорожки для совместимости с демо
  }[] // Сегменты сборной дорожки
}

/**
 * Класс для создания сборной дорожки
 */
export class CompositeTrackBuilder {
  /**
   * Создает сборную дорожку из нескольких параллельных дорожек в сегменте
   * @param segment Сегмент с параллельными дорожками
   * @param options Параметры создания сборной дорожки
   * @returns Результат создания сборной дорожки
   */
  public static buildCompositeTrack(
    segment: EditSegment,
    options: CompositeTrackOptions,
  ): CompositeTrackResult {
    // Добавляем tracks в сегменты для совместимости с демо
    const segmentsWithTracks: {
      trackId: string
      startTime: number
      duration: number
      tracks: EditTrack[]
    }[] = []
    console.log(`Создание сборной дорожки для сегмента "${segment.name}" (ID: ${segment.id})`)

    // Проверяем, что сегмент содержит дорожки
    if (!segment.tracks || segment.tracks.length === 0) {
      throw new Error(`Сегмент "${segment.name}" не содержит дорожек`)
    }

    // Проверяем, что сегмент содержит более одной дорожки
    if (segment.tracks.length === 1) {
      throw new Error(
        `Сегмент "${segment.name}" содержит только одну дорожку. Для создания сборной дорожки необходимо минимум две дорожки.`,
      )
    }

    // Устанавливаем значения по умолчанию
    const switchInterval = options.switchInterval || 3 // 3 секунды по умолчанию
    const trackTypes = options.trackTypes || ["video"] // Только видео по умолчанию
    const includeTransitions =
      options.includeTransitions !== undefined ? options.includeTransitions : true
    const transitionDuration = options.transitionDuration || 0.5 // 0.5 секунды по умолчанию

    // Фильтруем дорожки по типу
    const filteredTracks = segment.tracks.filter((track) => trackTypes.includes(track.type as any))

    if (filteredTracks.length === 0) {
      throw new Error(
        `Сегмент "${segment.name}" не содержит дорожек указанных типов: ${trackTypes.join(", ")}`,
      )
    }

    // Определяем общую длительность сборной дорожки
    // Находим самое раннее начало и самое позднее окончание
    let earliestStart = Number.MAX_VALUE
    let latestEnd = 0

    filteredTracks.forEach((track) => {
      const trackStart = track.startTime
      const trackEnd = trackStart + track.duration

      if (trackStart < earliestStart) {
        earliestStart = trackStart
      }

      if (trackEnd > latestEnd) {
        latestEnd = trackEnd
      }
    })

    const totalDuration = latestEnd - earliestStart

    console.log(`Общая длительность сборной дорожки: ${totalDuration} секунд`)
    console.log(`Самое раннее начало: ${earliestStart} секунд`)
    console.log(`Самое позднее окончание: ${latestEnd} секунд`)

    // Создаем сегменты сборной дорожки
    const segments: {
      trackId: string
      startTime: number
      duration: number
      tracks: EditTrack[]
    }[] = []

    // Распределяем дорожки по времени
    let currentTime = 0
    let trackIndex = 0

    while (currentTime < totalDuration) {
      const track = filteredTracks[trackIndex % filteredTracks.length]
      const segmentDuration = Math.min(switchInterval, totalDuration - currentTime)

      segments.push({
        trackId: track.id,
        startTime: currentTime,
        duration: segmentDuration,
        tracks: filteredTracks, // Добавляем все дорожки для совместимости с демо
      })

      currentTime += segmentDuration
      trackIndex++
    }

    console.log(`Создано ${segments.length} сегментов сборной дорожки`)

    // Создаем сборную дорожку
    const compositeTrack = createEditTrack(
      `Сборная дорожка (${filteredTracks.length} источников)`,
      trackTypes[0], // Используем первый тип из списка
      segment.id, // Используем ID сегмента как sourceId
      earliestStart,
      totalDuration,
    )

    // Генерируем команду FFmpeg
    let ffmpegCommand = "ffmpeg"

    // Добавляем входные файлы
    filteredTracks.forEach((track, index) => {
      ffmpegCommand += ` -i "${track.sourceId}"`
    })

    // Добавляем фильтр для создания сборной дорожки
    ffmpegCommand += ' -filter_complex "'

    // Создаем сегменты
    segments.forEach((segment, index) => {
      const trackIndex = filteredTracks.findIndex((track) => track.id === segment.trackId)

      // Вырезаем сегмент из исходной дорожки
      ffmpegCommand += `[${trackIndex}:v]trim=start=${segment.startTime}:duration=${segment.duration},setpts=PTS-STARTPTS[v${index}];`

      // Если нужны переходы и это не последний сегмент
      if (includeTransitions && index < segments.length - 1) {
        // Добавляем переход
        ffmpegCommand += `[v${index}][v${index + 1}]xfade=transition=fade:duration=${transitionDuration}:offset=${segment.duration - transitionDuration}[v${index}_out];`
      }
    })

    // Объединяем все сегменты
    ffmpegCommand += ``

    // Если нужны переходы, используем выходы с переходами
    if (includeTransitions) {
      for (let i = 0; i < segments.length - 1; i++) {
        ffmpegCommand += `[v${i}_out]`
      }
    } else {
      // Иначе используем обычные выходы
      for (let i = 0; i < segments.length; i++) {
        ffmpegCommand += `[v${i}]`
      }
    }

    // Завершаем команду
    ffmpegCommand += `concat=n=${segments.length}:v=1:a=0[outv]" -map "[outv]" output.mp4`

    console.log(`Команда FFmpeg: ${ffmpegCommand}`)

    return {
      track: compositeTrack,
      ffmpegCommand,
      segments,
    }
  }
}
