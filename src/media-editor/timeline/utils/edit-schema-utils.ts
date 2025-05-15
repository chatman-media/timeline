/**
 * Утилиты для работы со схемой монтажа
 */
import { MediaTemplate } from "@/media-editor/browser/components/tabs/templates/templates"
import { Sector } from "@/media-editor/browser/utils/media-files"
import {
  createEditSegment,
  createEditTrack,
  EditResource,
  EditSegment,
  EditTrack,
} from "@/types/edit-schema"

/**
 * Конвертирует секторы в сегменты схемы монтажа
 * @param sectors Секторы для конвертации
 * @returns Массив сегментов схемы монтажа
 */
export function convertSectorsToEditSegments(sectors: Sector[]): EditSegment[] {
  let currentTime = 0

  return sectors.map((sector) => {
    // Создаем сегмент для сектора
    const segmentDuration = Math.max(
      ...sector.tracks.map((track) => track.combinedDuration || 0),
      0,
    )

    const segment = createEditSegment(sector.name, currentTime, segmentDuration)

    // Обновляем текущее время для следующего сегмента
    currentTime += segmentDuration

    // Добавляем дорожки из сектора
    segment.tracks = sector.tracks.map((track) => {
      return createEditTrack(
        track.name,
        track.type as "video" | "audio" | "title",
        track.id,
        track.startTime || 0,
        track.combinedDuration || 0,
        undefined, // position
        track.volume || 1,
      )
    })

    return segment
  })
}

/**
 * Создает дорожки на основе шаблона
 * @param template Шаблон для применения
 * @param existingTracks Существующие дорожки
 * @param params Параметры шаблона
 * @returns Массив дорожек
 */
export function createTracksFromTemplate(
  template: MediaTemplate,
  existingTracks: EditTrack[],
  params?: Record<string, any>,
): EditTrack[] {
  // Если шаблон не содержит информации о расположении экранов, возвращаем существующие дорожки
  if (!template.screens) {
    return existingTracks
  }

  // Создаем копию существующих дорожек
  const newTracks = [...existingTracks]

  // Применяем шаблон к дорожкам
  // Для каждого экрана в шаблоне находим соответствующую дорожку и обновляем её позицию
  const videoTracks = newTracks.filter((track) => track.type === "video")

  // Если количество видео дорожек меньше количества экранов в шаблоне,
  // то используем только доступные дорожки
  const screensCount = Math.min(template.screens, videoTracks.length)

  for (let i = 0; i < screensCount; i++) {
    // Рассчитываем позицию для экрана на основе шаблона
    let position

    if (template.split === "vertical") {
      // Вертикальное разделение
      position = {
        x: 0,
        y: (i / screensCount) * 100,
        width: 100,
        height: 100 / screensCount,
      }
    } else if (template.split === "horizontal") {
      // Горизонтальное разделение
      position = {
        x: (i / screensCount) * 100,
        y: 0,
        width: 100 / screensCount,
        height: 100,
      }
    } else if (template.split === "grid") {
      // Сетка
      const cols = Math.ceil(Math.sqrt(screensCount))
      const rows = Math.ceil(screensCount / cols)

      const col = i % cols
      const row = Math.floor(i / cols)

      position = {
        x: (col / cols) * 100,
        y: (row / rows) * 100,
        width: 100 / cols,
        height: 100 / rows,
      }
    } else {
      // Если тип разделения не определен, используем полный экран
      position = {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }
    }

    // Обновляем позицию дорожки
    videoTracks[i].position = position
  }

  return newTracks
}

/**
 * Генерирует команду FFmpeg для сегмента
 * @param segment Сегмент для генерации команды
 * @param outputPath Путь для сохранения результата
 * @returns Команда FFmpeg
 */
export function generateSegmentCommand(segment: EditSegment, outputPath: string): string {
  // Базовая команда FFmpeg
  let command = "ffmpeg"

  // Добавляем входные файлы
  segment.tracks.forEach((track, index) => {
    command += ` -i "${track.sourceId}"`
  })

  // Добавляем фильтры
  command += ' -filter_complex "'

  // Обрабатываем каждую дорожку
  segment.tracks.forEach((track, index) => {
    // Обрезаем видео по времени
    command += `[${index}:v]trim=start=${track.startTime}:duration=${track.duration},`

    // Если есть позиция, применяем масштабирование и позиционирование
    if (track.position) {
      command += `scale=iw*${track.position.width / 100}:ih*${track.position.height / 100},`
      command += `pad=1920:1080:${(track.position.x / 100) * 1920}:${(track.position.y / 100) * 1080},`
    }

    // Применяем ресурсы (эффекты, фильтры)
    track.resources.forEach((resource) => {
      if (resource.type === "effect" || resource.type === "filter") {
        // Здесь нужно добавить логику для применения эффектов и фильтров
        // в зависимости от их типа и параметров
        command += `${resource.resourceId},`
      }
    })

    // Убираем последнюю запятую и добавляем метку
    command = command.slice(0, -1)
    command += `[v${index}];`
  })

  // Объединяем все видеодорожки
  if (segment.tracks.length > 1) {
    segment.tracks.forEach((_, index) => {
      command += `[v${index}]`
    })
    command += `overlay=shortest=1[outv];`
  } else if (segment.tracks.length === 1) {
    command += `[v0][outv];`
  }

  // Закрываем фильтр
  command += '"'

  // Добавляем выходные параметры
  command += ` -map "[outv]" -c:v libx264 -preset medium -crf 23 "${outputPath}"`

  return command
}

/**
 * Генерирует команду для объединения сегментов
 * @param segmentCount Количество сегментов
 * @param outputPath Путь для сохранения результата
 * @returns Команда FFmpeg
 */
export function generateConcatCommand(segmentCount: number, outputPath: string): string {
  // Создаем файл со списком сегментов
  let command = 'echo "'

  for (let i = 0; i < segmentCount; i++) {
    command += `file 'temp_segment_${i}.mp4'\n`
  }

  command += '" > concat_list.txt && '

  // Объединяем сегменты
  command += `ffmpeg -f concat -safe 0 -i concat_list.txt -c copy "${outputPath}" && `

  // Удаляем временные файлы
  command += "rm concat_list.txt"

  for (let i = 0; i < segmentCount; i++) {
    command += ` temp_segment_${i}.mp4`
  }

  return command
}
