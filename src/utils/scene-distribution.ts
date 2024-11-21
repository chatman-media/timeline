import { BitrateDataPoint } from "@/types/video"
import { SceneDistributionParams, SceneSegment } from "@/types/scenes"
import { VideoSegment } from "@/types/video-segment"

/**
 * Создает распределение сцен для мультикамерного монтажа
 * @param targetDuration - Желаемая длительность итогового видео в секундах
 * @param totalDuration - Общая длительность видео в секундах
 * @param numCameras - Количество активных камер
 * @param averageSceneDuration - Средняя длительность сцены в секундах
 * @param cameraChangeFrequency - Частота смены камеры (от 0 до 1)
 * @param bitrateData - Данные о bitrate для каждой камеры
 * @returns Массив сцен с указанием камеры, времени начала и длительности
 *
 * @example
 * const scenes = distributeScenes(30, 4, 10, 0.5)
 * // Вернет массив сцен для 30-секундного видео из 120 секунд записи с 4 камер
 *
 * const scenesWithCustomSegments = distributeScenes(30, 120, 4, [{ time: 10, bitrate: 1000 }, { time: 20, bitrate: 1500 }])
 * // Вернет массив из 500 сцен для более частого переключения
 */
export function distributeScenes({
  targetDuration,
  totalDuration,
  numCameras,
  averageSceneDuration,
  cameraChangeFrequency,
  bitrateData,
}: SceneDistributionParams) {
  console.log("Distribution params:", {
    targetDuration,
    totalDuration,
    numCameras,
    averageSceneDuration,
    cameraChangeFrequency,
  })

  // 1. Сначала создаем полную запись с переключением камер
  const fullRecording: SceneSegment[] = []

  // Используем totalDuration вместо расчета из bitrateData
  const totalVideoDuration = totalDuration

  // Длительность одного отрезка с одной камерой (минимум 1 секунда)
  const cameraSegmentDuration = Math.max(1, 1 / cameraChangeFrequency)

  // Создаем полную запись, разбитую по времени переключения камер
  let currentTime = 0
  while (currentTime < totalVideoDuration) {
    const segmentEndTime = Math.min(currentTime + cameraSegmentDuration, totalVideoDuration)

    // Для каждого временного отрезка определяем лучшую камеру
    const bestCamera = findBestCameraForSegment(
      currentTime,
      segmentEndTime,
      bitrateData,
      numCameras,
    )

    fullRecording.push({
      startTime: currentTime,
      endTime: segmentEndTime,
      cameraIndex: bestCamera,
      totalBitrate: calculateTotalBitrate(
        currentTime,
        segmentEndTime,
        bitrateData,
      ),
    })

    currentTime = segmentEndTime
  }

  // 2. Теперь выбираем лучшие сегменты заданной длительности
  const numSegmentsNeeded = Math.ceil(targetDuration / averageSceneDuration)
  const segmentsToSelect = selectBestSegments(
    fullRecording,
    numSegmentsNeeded,
    averageSceneDuration,
  )

  console.log("Generated segments:", {
    totalSegments: segmentsToSelect.length,
    fullRecordingLength: fullRecording.length,
    averageSceneDuration,
    cameraChangeFrequency,
  })

  return segmentsToSelect
}

function findBestCameraForSegment(
  startTime: number,
  endTime: number,
  bitrateData: Array<BitrateDataPoint[]> | undefined,
  numCameras: number,
): number {
  if (!bitrateData) return Math.floor(Math.random() * numCameras)

  const cameraBitrates = new Array(numCameras).fill(0)

  bitrateData.forEach((cameraBitrate, cameraIndex) => {
    const relevantPoints = cameraBitrate.filter(
      (point) => point.time >= startTime && point.time <= endTime,
    )
    if (relevantPoints.length > 0) {
      cameraBitrates[cameraIndex] = relevantPoints.reduce(
        (sum, point) => sum + point.bitrate,
        0,
      ) / relevantPoints.length
    }
  })

  // Возвращаем индекс камеры с максимальным битрейтом
  const maxBitrateIndex = cameraBitrates.indexOf(Math.max(...cameraBitrates))
  return maxBitrateIndex >= 0 ? maxBitrateIndex : 0
}

function calculateTotalBitrate(
  startTime: number,
  endTime: number,
  bitrateData: Array<BitrateDataPoint[]> | undefined,
): number {
  if (!bitrateData) return 0

  let totalBitrate = 0
  bitrateData.forEach((cameraBitrate) => {
    const relevantPoints = cameraBitrate.filter(
      (point) => point.time >= startTime && point.time <= endTime,
    )
    if (relevantPoints.length > 0) {
      totalBitrate += relevantPoints.reduce(
        (sum, point) => sum + point.bitrate,
        0,
      ) / relevantPoints.length
    }
  })
  return totalBitrate
}

function selectBestSegments(
  fullRecording: SceneSegment[],
  numSegments: number,
  averageSceneDuration: number,
): VideoSegment[] {
  // Проверяем, что у нас есть записи
  if (!fullRecording.length) {
    return []
  }

  const segmentDuration = fullRecording[0].endTime - fullRecording[0].startTime
  const segmentsInScene = Math.floor(averageSceneDuration / segmentDuration)

  // Проверяем, что у нас достаточно сегментов
  if (segmentsInScene <= 0 || fullRecording.length < segmentsInScene) {
    return []
  }

  const selectedSegments: VideoSegment[] = []

  // Ищем сегменты с наибольшим суммарным битрейтом
  for (let i = 0; i < fullRecording.length - segmentsInScene; i++) {
    const potentialSegment = fullRecording.slice(i, i + segmentsInScene)
    const totalBitrate = potentialSegment.reduce(
      (sum, segment) => sum + (segment.totalBitrate || 0),
      0,
    )

    selectedSegments.push({
      startTime: potentialSegment[0].startTime,
      endTime: potentialSegment[potentialSegment.length - 1].endTime,
      cameraIndex: potentialSegment[0].cameraIndex,
      segments: potentialSegment,
      totalBitrate,
    })
  }

  // Сортируем по битрейту и берем лучшие
  return selectedSegments
    .sort((a, b) =>
      (b.segments.reduce((sum, s) => sum + (s.totalBitrate || 0), 0)) -
      (a.segments.reduce((sum, s) => sum + (s.totalBitrate || 0), 0))
    )
    .slice(0, numSegments)
}
