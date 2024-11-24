import { generateGaussianSceneDurations } from "./generate-scene-durations"
import { SceneDistributionParams, SceneSegment } from "../types/scene"
import { analyzeAudioForSegment } from "./audio-analysis"

/**
 * Создает распределение сцен для мультикамерного монтажа.
 * Генерирует последовательность сцен с разной длительностью,
 * распределенных по нормальному закону, и назначает каждой сцене камеру
 * с учетом заданных параметров и ограничений.
 *
 * @param params - Параметры распределения сцен
 * @returns Массив сегментов видео с указанием камеры, времени начала и длительности
 *
 * @example
 * const scenes = distributeScenes({
 *   targetDuration: 300, // 5 минут
 *   numCameras: 4,
 *   averageSceneDuration: 6,
 *   cameraChangeFrequency: 0.5,
 *   mainCamera: 1,
 *   mainCameraProb: 0.6,
 *   timeRange: { min: 1700000000, max: 1700000300 },
 *   videos: videoArray
 * })
 */
export function distributeScenes(params: SceneDistributionParams): SceneSegment[] {
  const scenes: SceneSegment[] = []
  let lastCamera = params.mainCamera

  // Используем assembledTracks для группировки видео
  const videosByCamera = new Map(
    params.assembledTracks.map((track) => [
      track.index,
      track.allMedia,
    ]),
  )

  // Вспомогательная функция для поиска видео для сегмента
  const findVideoForSegment = (camera: number, startTime: number, endTime: number) => {
    const videos = videosByCamera.get(camera) || []
    return videos.find((video) => {
      const videoStart = new Date(video.probeData.format.creation_time!).getTime() / 1000
      const videoEnd = videoStart + video.probeData.format.duration
      return videoStart <= startTime && videoEnd >= endTime
    })
  }

  // Находим общий временной диапазон всех видео
  const timeRanges = params.assembledTracks.map((track) => {
    const trackRanges = track.allMedia.map((video) => ({
      start: new Date(video.probeData.format.creation_time!).getTime() / 1000,
      end: new Date(video.probeData.format.creation_time!).getTime() / 1000 +
        +video.probeData.format.duration,
    }))
    return {
      camera: track.index,
      min: Math.min(...trackRanges.map((r) => r.start)),
      max: Math.max(...trackRanges.map((r) => r.end)),
    }
  })

  // Берем самый широкий диапазон
  const effectiveTimeRange = {
    min: Math.min(...timeRanges.map((r) => r.min)),
    max: Math.max(...timeRanges.map((r) => r.max)),
  }

  console.log("Effective time range:", effectiveTimeRange)

  // Проверяем валидность диапазона
  if (effectiveTimeRange.max <= effectiveTimeRange.min) {
    console.error("No common time range found for all cameras")
    return []
  }

  // Масштабируем длительности
  const availableDuration = effectiveTimeRange.max - effectiveTimeRange.min
  if (availableDuration < params.targetDuration) {
    console.warn("Available duration is less than target duration", {
      available: availableDuration,
      target: params.targetDuration,
    })
  }

  // Генерируем базовые сегменты
  let timeSegments = generateGaussianSceneDurations(
    availableDuration,
    params.averageSceneDuration,
  )

  // Масштабируем длительности
  // const currentTotalDuration = timeSegments.reduce((sum, segment) => sum + segment.duration, 0)
  // const durationScaleFactor = params.targetDuration / currentTotalDuration

  const segmentCount = Math.floor(params.targetDuration / params.averageSceneDuration)
  const totalTimeRange = effectiveTimeRange.max - effectiveTimeRange.min
  const timeStep = totalTimeRange / (params.targetDuration / params.averageSceneDuration)

  const selectedPoints = Array.from({ length: segmentCount }, (_, i) => {
    // Распределяем точки с учетом целевой длительности
    const basePoint = effectiveTimeRange.min + (i * timeStep)
    // Добавляем небольшое случайное смещение (±10% от шага)
    const jitter = (Math.random() - 0.5) * timeStep * 0.2
    return Math.min(
      Math.max(basePoint + jitter, effectiveTimeRange.min),
      effectiveTimeRange.max,
    )
  }).sort((a, b) => a - b)

  // Создаем сегменты фиксированной длительности
  timeSegments = selectedPoints.map((startTime) => ({
    startTime,
    duration: params.averageSceneDuration,
  }))

  // Распределение камер внутри сегментов
  for (const segment of timeSegments) {
    const numChanges = Math.floor(
      segment.duration / params.averageSceneDuration * params.cameraChangeFrequency,
    )
    const subSegmentDuration = segment.duration / (numChanges + 1)

    for (let i = 0; i <= numChanges; i++) {
      const subSegmentStart = segment.startTime + (i * subSegmentDuration)
      const subSegmentEnd = Math.min(
        subSegmentStart + subSegmentDuration,
        effectiveTimeRange.max,
      )

      // Если вышли за пределы доступного времени, прекращаем
      if (subSegmentStart >= effectiveTimeRange.max) break

      // Находим доступные камеры для текущего временного отрезка
      const availableCameras = Array.from(videosByCamera.entries())
        .filter(([_, videos]) =>
          videos.some((video) => {
            const videoStart = new Date(video.probeData.format.creation_time!).getTime() / 1000
            const videoEnd = videoStart + video.probeData.format.format.duration
            return videoStart <= subSegmentStart && videoEnd >= subSegmentEnd
          })
        )
        .map(([camera]) => camera)

      if (availableCameras.length === 0) {
        console.warn("No available cameras for segment:", {
          subSegmentStart,
          subSegmentEnd,
          lastCamera,
        })
        continue
      }

      // Анализируем аудио для текущего сегмента
      const audioScores = analyzeAudioForSegment(
        subSegmentStart,
        subSegmentEnd,
        params.assembledTracks,
      )

      // Выбираем камеру с учетом аудио качества
      let selectedCamera = params.mainCamera

      // Всегда выбираем камеру, отличную от предыдущей
      const otherCameras = availableCameras.filter((c) => c !== lastCamera)

      if (otherCameras.length > 0) {
        // Если это основная камера и выпал шанс её использовать
        if (Math.random() <= params.mainCameraProb && !otherCameras.includes(params.mainCamera)) {
          selectedCamera = params.mainCamera
        } else {
          // Учитываем аудио скоры при выборе камеры
          const weightedCameras = otherCameras.map((camera) => {
            const audioScore = audioScores.find((s) => s.cameraIndex === camera)?.score || 0
            return {
              camera,
              weight: 1 + audioScore, // Базовый вес + аудио скор
            }
          })

          // Выбираем камеру с учетом весов
          const totalWeight = weightedCameras.reduce((sum, c) => sum + c.weight, 0)
          let random = Math.random() * totalWeight

          for (const { camera, weight } of weightedCameras) {
            random -= weight
            if (random <= 0) {
              selectedCamera = camera
              break
            }
          }
        }
      }

      const video = findVideoForSegment(selectedCamera, subSegmentStart, subSegmentEnd)
      if (video) {
        scenes.push({
          startTime: subSegmentStart,
          endTime: subSegmentEnd,
          duration: subSegmentEnd - subSegmentStart,
          cameraIndex: selectedCamera,
          videoFile: video.path,
          totalBitrate: video.probeData.format.format.bit_rate || 0,
        })
        lastCamera = selectedCamera
      }
    }
  }

  // После генерации всех сегментов, объединяем последовательные с одной камеры
  const mergedScenes: SceneSegment[] = []
  let currentMergedScene: SceneSegment | null = null

  for (const scene of scenes) {
    if (!currentMergedScene) {
      currentMergedScene = { ...scene }
      continue
    }

    const canMerge =
      // Та же камера
      currentMergedScene.cameraIndex === scene.cameraIndex &&
      // Последовательные времена
      Math.abs(currentMergedScene.endTime - scene.startTime) < 0.1 &&
      // Тот же файл видео
      currentMergedScene.videoFile === scene.videoFile &&
      // Не превышаем максимальную длительность
      (scene.endTime - currentMergedScene.startTime) <= params.averageSceneDuration * 3

    if (canMerge) {
      // Объединяем сцены
      currentMergedScene.endTime = scene.endTime
      currentMergedScene.duration = currentMergedScene.endTime - currentMergedScene.startTime
    } else {
      // Добавляем текущую объединенную сцену в результат
      mergedScenes.push(currentMergedScene)
      // Начинаем новую сцену
      currentMergedScene = { ...scene }
    }
  }

  // Добавляем последнюю сцену
  if (currentMergedScene) {
    mergedScenes.push(currentMergedScene)
  }

  return mergedScenes
}
