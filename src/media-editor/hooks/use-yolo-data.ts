import { useCallback, useRef,useState } from "react"

import { AISceneContext, SceneContextService } from "../services/scene-context-service"
// Используем типы из сервиса, а не из общих типов, чтобы избежать несоответствия
import type { YoloDetection, YoloVideoData, YoloVideoSummary } from "../services/yolo-data-service"
import { yoloDataService } from "../services/yolo-data-service"

/**
 * Хук для работы с данными YOLO
 */
export function useYoloData() {
  const [yoloData, setYoloData] = useState<Record<string, YoloVideoData>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<Record<string, string>>({})

  const yoloService = yoloDataService
  const sceneContextService = SceneContextService.getInstance()

  // Создаем состояние для отслеживания видео, для которых нет данных YOLO
  const [nonExistentData, setNonExistentData] = useState<Record<string, boolean>>({})

  // Счетчик для отслеживания количества сообщений о ненайденных данных YOLO
  const missingDataCountRef = useRef<number>(0)

  /**
   * Загрузить данные YOLO для видео
   * @param videoId ID видео
   * @returns Данные YOLO или null, если произошла ошибка
   */
  const loadYoloDataForVideo = useCallback(
    async (videoId: string): Promise<YoloVideoData | null> => {
      // Если мы уже знаем, что данных нет, не делаем запрос
      if (nonExistentData[videoId]) {
        // Логируем только в режиме отладки
        if (process.env.NODE_ENV === "development" && Math.random() < 0.01) {
          console.debug(
            `[useYoloData] Пропускаем запрос для видео ${videoId}, данные отсутствуют (из кэша)`,
          )
        }
        return null
      }

      // Если данные уже загружаются, ждем завершения
      if (loading[videoId]) {
        // Логируем только в режиме отладки
        if (process.env.NODE_ENV === "development" && Math.random() < 0.05) {
          console.debug(
            `[useYoloData] Данные для видео ${videoId} уже загружаются, пропускаем запрос`,
          )
        }
        return null
      }

      // Если данные уже загружены, возвращаем их
      if (yoloData[videoId]) {
        // Логируем только в режиме отладки
        if (process.env.NODE_ENV === "development" && Math.random() < 0.05) {
          console.debug(`[useYoloData] Возвращаем кэшированные данные для видео ${videoId}`)
        }
        return yoloData[videoId]
      }

      try {
        // Логируем только в режиме отладки
        if (process.env.NODE_ENV === "development" && Math.random() < 0.1) {
          console.debug(`[useYoloData] Начинаем загрузку данных YOLO для видео ${videoId}`)
        }

        setLoading((prev) => ({ ...prev, [videoId]: true }))
        setError((prev) => ({ ...prev, [videoId]: "" }))

        const data = await yoloService.loadYoloData(videoId)

        // Логируем результат только если данные найдены или в режиме отладки
        if (data || (process.env.NODE_ENV === "development" && Math.random() < 0.1)) {
          console.debug(
            `[useYoloData] Результат загрузки данных YOLO для видео ${videoId}:`,
            data ? `${data.frames?.length || 0} кадров` : "нет данных",
          )
        }

        if (data) {
          setYoloData((prev) => ({ ...prev, [videoId]: data }))
          return data
        } else {
          // Запоминаем, что данных нет, чтобы не делать повторные запросы
          setNonExistentData((prev) => ({ ...prev, [videoId]: true }))
          setError((prev) => ({ ...prev, [videoId]: "Данные YOLO не найдены" }))

          // Увеличиваем счетчик ненайденных данных
          missingDataCountRef.current += 1

          // Логируем предупреждение только для первых 5 видео или с вероятностью 1%
          if (missingDataCountRef.current <= 5 || Math.random() < 0.01) {
            console.debug(
              `[useYoloData] Данные YOLO для видео ${videoId} не найдены (${missingDataCountRef.current} видео без данных)`,
            )
          }

          return null
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Неизвестная ошибка"
        // Запоминаем, что произошла ошибка, чтобы не делать повторные запросы
        console.error(`[useYoloData] Ошибка при загрузке данных YOLO для видео ${videoId}:`, err)
        setNonExistentData((prev) => ({ ...prev, [videoId]: true }))
        setError((prev) => ({ ...prev, [videoId]: errorMessage }))
        return null
      } finally {
        setLoading((prev) => ({ ...prev, [videoId]: false }))
      }
    },
    [loading, yoloData, nonExistentData, yoloService],
  )

  /**
   * Получить данные YOLO для конкретного момента времени
   * @param videoId ID видео
   * @param timestamp Временная метка (в секундах от начала видео)
   * @returns Массив обнаруженных объектов или пустой массив, если данные не найдены
   */
  const getYoloDataAtTimestamp = useCallback(
    async (videoId: string, timestamp: number): Promise<YoloDetection[]> => {
      // Если мы уже знаем, что данных нет, не делаем запрос
      if (nonExistentData[videoId]) {
        return []
      }

      return yoloService.getYoloDataAtTimestamp(videoId, timestamp)
    },
    [yoloService, nonExistentData],
  )

  /**
   * Создать сводную информацию о распознанных объектах в видео
   * @param videoId ID видео
   * @returns Сводная информация или null, если данные не найдены
   */
  const createVideoSummary = useCallback(
    async (videoId: string): Promise<YoloVideoSummary | null> => {
      // Если мы уже знаем, что данных нет, не делаем запрос
      if (nonExistentData[videoId]) {
        return null
      }

      return yoloService.createVideoSummary(videoId)
    },
    [yoloService, nonExistentData],
  )

  /**
   * Генерировать контекст сцены для ИИ
   * @param videoId ID видео
   * @param videoName Название видео
   * @param timestamp Временная метка (в секундах от начала видео)
   * @returns Контекст сцены или null, если данные не найдены
   */
  const generateSceneContext = useCallback(
    async (
      videoId: string,
      videoName: string,
      timestamp: number,
    ): Promise<AISceneContext | null> => {
      // Если мы уже знаем, что данных нет, не делаем запрос
      if (nonExistentData[videoId]) {
        return null
      }

      return sceneContextService.generateSceneContext(videoId, videoName, timestamp)
    },
    [sceneContextService, nonExistentData],
  )

  return {
    yoloData,
    loading,
    error,
    nonExistentData,
    loadYoloDataForVideo,
    getYoloDataAtTimestamp,
    createVideoSummary,
    generateSceneContext,
  }
}
