/**
 * Сервис для создания нарративной схемы монтажа на основе анализа видео
 */
import { v4 as uuidv4 } from "uuid"

import { createEditSegment, createEditTrack, EditSegment, EditTrack } from "@/types/edit-schema"
import { SimpleVideoAnalysis, Subtitle } from "@/types/video-analysis"

import { AiMessage } from "./ai-service"
import { CLAUDE_MODELS, ClaudeService } from "./claude-service"
import { VideoAnalysisService } from "./video-analysis-service"

/**
 * Класс для создания нарративной схемы монтажа
 */
export class NarrativeEditService {
  private static instance: NarrativeEditService
  private claudeService: ClaudeService
  private videoAnalysisService: VideoAnalysisService

  private constructor() {
    this.claudeService = ClaudeService.getInstance()
    this.videoAnalysisService = VideoAnalysisService.getInstance()
  }

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): NarrativeEditService {
    if (!NarrativeEditService.instance) {
      NarrativeEditService.instance = new NarrativeEditService()
    }
    return NarrativeEditService.instance
  }

  /**
   * Проверить, установлен ли API ключ
   */
  public hasApiKey(): boolean {
    return this.claudeService.hasApiKey()
  }

  /**
   * Установить API ключ
   * @param apiKey Новый API ключ
   */
  public setApiKey(apiKey: string): void {
    this.claudeService.setApiKey(apiKey)
    this.videoAnalysisService.setApiKey(apiKey)
  }

  /**
   * Создать системный промпт для нарративного монтажа
   * @param videoAnalysis Анализ видео
   */
  private createSystemPrompt(videoAnalysis: SimpleVideoAnalysis): string {
    return `Вы - ассистент по нарративному видеомонтажу. Ваша задача - создать схему монтажа на основе анализа видео, которая подчеркивает нарративную структуру.

Анализ видео содержит:
1. Ключевые кадры с распознанными объектами
2. Субтитры
3. Сцены

Создайте схему монтажа, которая:
1. Выделяет ключевые моменты повествования
2. Создает логическую последовательность сцен
3. Подчеркивает важные объекты и диалоги
4. Создает эмоциональное воздействие

Схема монтажа должна состоять из сегментов, каждый из которых имеет:
- Название
- Время начала и длительность
- Нарративную роль (вступление, развитие, кульминация, заключение и т.д.)
- Дорожки (видео, аудио, субтитры)
- Фокусные объекты (если есть)

Ответ должен быть в формате JSON.`
  }

  /**
   * Создать нарративную схему монтажа на основе анализа видео
   * @param videoId ID видео
   * @param videoAnalysis Анализ видео
   */
  public async createNarrativeEditSchema(
    videoId: string,
    videoAnalysis: SimpleVideoAnalysis,
  ): Promise<EditSegment[]> {
    if (!this.hasApiKey()) {
      throw new Error("API ключ не установлен. Пожалуйста, добавьте API ключ в настройках.")
    }

    const systemPrompt = this.createSystemPrompt(videoAnalysis)

    const userMessage: AiMessage = {
      role: "user",
      content: `Создайте нарративную схему монтажа для видео с ID ${videoId}.
      
Длительность видео: ${videoAnalysis.duration} секунд.

Ключевые кадры: ${JSON.stringify(videoAnalysis.keyFrames, null, 2)}

Субтитры: ${JSON.stringify(videoAnalysis.subtitles, null, 2)}

Сцены: ${JSON.stringify(videoAnalysis.scenes, null, 2)}

Пожалуйста, создайте схему монтажа, которая подчеркивает нарративную структуру видео.`,
    }

    const messages: AiMessage[] = [userMessage]

    try {
      const response = await this.claudeService.sendRequest(
        CLAUDE_MODELS.CLAUDE_3_5_SONNET,
        messages,
        {
          system: systemPrompt,
          temperature: 0.7,
          max_tokens: 4000,
        },
      )

      // Извлекаем JSON из ответа
      const jsonMatch =
        response.match(/```json\n([\s\S]*?)\n```/) || response.match(/```\n([\s\S]*?)\n```/)
      if (!jsonMatch) {
        throw new Error("Не удалось извлечь JSON из ответа Claude")
      }

      const jsonStr = jsonMatch[1]
      const schemaData = JSON.parse(jsonStr)

      // Преобразуем данные в схему монтажа
      return this.convertToEditSchema(schemaData, videoId)
    } catch (error) {
      console.error("Ошибка при создании нарративной схемы монтажа:", error)
      throw error
    }
  }

  /**
   * Преобразовать данные от Claude в схему монтажа
   * @param schemaData Данные схемы от Claude
   * @param videoId ID видео
   */
  private convertToEditSchema(schemaData: any, videoId: string): EditSegment[] {
    const segments: EditSegment[] = []

    // Проверяем формат данных
    if (!Array.isArray(schemaData.segments) && !Array.isArray(schemaData)) {
      throw new Error("Неверный формат данных схемы монтажа")
    }

    // Получаем массив сегментов
    const segmentsData = Array.isArray(schemaData.segments) ? schemaData.segments : schemaData

    // Преобразуем каждый сегмент
    for (const segmentData of segmentsData) {
      const tracks: EditTrack[] = []

      // Создаем дорожки
      if (Array.isArray(segmentData.tracks)) {
        for (const trackData of segmentData.tracks) {
          const track = createEditTrack(
            trackData.name,
            trackData.type,
            videoId,
            trackData.startTime || 0,
            trackData.duration || segmentData.duration,
            trackData.position,
            trackData.volume || 1,
            {
              focusObjects: trackData.focusObjects,
              subtitleData: trackData.subtitleData,
              audioAnalysis: trackData.audioAnalysis,
              videoAnalysis: trackData.videoAnalysis,
            },
          )
          tracks.push(track)
        }
      }

      // Создаем сегмент
      const segment = createEditSegment(
        segmentData.name,
        segmentData.startTime,
        segmentData.duration,
        tracks,
        {
          detectedObjects: segmentData.detectedObjects,
          subtitles: segmentData.subtitles,
          audioBeats: segmentData.audioBeats,
          sceneType: segmentData.sceneType,
          tags: segmentData.tags,
          importance: segmentData.importance,
          narrative: segmentData.narrative,
        },
      )

      segments.push(segment)
    }

    return segments
  }

  /**
   * Создать схему монтажа на основе субтитров
   * @param videoId ID видео
   * @param duration Длительность видео
   * @param subtitles Субтитры
   */
  public createSubtitleBasedEditSchema(
    videoId: string,
    duration: number,
    subtitles: Subtitle[],
  ): EditSegment[] {
    const segments: EditSegment[] = []

    // Создаем сегменты на основе субтитров
    for (const subtitle of subtitles) {
      // Создаем дорожку субтитров
      const subtitleTrack = createEditTrack(
        "Субтитры",
        "subtitle",
        videoId,
        subtitle.startTime,
        subtitle.endTime - subtitle.startTime,
        undefined,
        1,
        {
          subtitleData: {
            text: subtitle.text,
            speaker: subtitle.speaker,
            language: subtitle.language,
          },
        },
      )

      // Создаем видеодорожку
      const videoTrack = createEditTrack(
        "Видео",
        "video",
        videoId,
        subtitle.startTime,
        subtitle.endTime - subtitle.startTime,
      )

      // Создаем аудиодорожку
      const audioTrack = createEditTrack(
        "Аудио",
        "audio",
        videoId,
        subtitle.startTime,
        subtitle.endTime - subtitle.startTime,
      )

      // Создаем сегмент
      const segment = createEditSegment(
        `Сегмент ${subtitle.startTime.toFixed(1)}-${subtitle.endTime.toFixed(1)}`,
        subtitle.startTime,
        subtitle.endTime - subtitle.startTime,
        [videoTrack, audioTrack, subtitleTrack],
        {
          subtitles: [subtitle],
          tags: subtitle.keywords,
          importance: subtitle.sentiment?.score || 0.5,
        },
      )

      segments.push(segment)
    }

    return segments
  }

  /**
   * Объединить перекрывающиеся сегменты
   * @param segments Сегменты
   */
  public mergeOverlappingSegments(segments: EditSegment[]): EditSegment[] {
    if (segments.length <= 1) {
      return segments
    }

    // Сортируем сегменты по времени начала
    const sortedSegments = [...segments].sort((a, b) => a.startTime - b.startTime)
    const mergedSegments: EditSegment[] = []
    let currentSegment = sortedSegments[0]

    for (let i = 1; i < sortedSegments.length; i++) {
      const nextSegment = sortedSegments[i]

      // Проверяем перекрытие
      if (nextSegment.startTime <= currentSegment.startTime + currentSegment.duration) {
        // Объединяем сегменты
        const endTime = Math.max(
          currentSegment.startTime + currentSegment.duration,
          nextSegment.startTime + nextSegment.duration,
        )

        currentSegment = {
          ...currentSegment,
          name: `${currentSegment.name} + ${nextSegment.name}`,
          duration: endTime - currentSegment.startTime,
          tracks: [...currentSegment.tracks, ...nextSegment.tracks],
          subtitles: [...(currentSegment.subtitles || []), ...(nextSegment.subtitles || [])],
          detectedObjects: [
            ...(currentSegment.detectedObjects || []),
            ...(nextSegment.detectedObjects || []),
          ],
          tags: [...(currentSegment.tags || []), ...(nextSegment.tags || [])],
        }
      } else {
        // Добавляем текущий сегмент и переходим к следующему
        mergedSegments.push(currentSegment)
        currentSegment = nextSegment
      }
    }

    // Добавляем последний сегмент
    mergedSegments.push(currentSegment)

    return mergedSegments
  }
}
