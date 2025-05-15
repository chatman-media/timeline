/**
 * Сервис для анализа видео с использованием ИИ
 */
import {
  AudioAnalysis,
  createEmptySimpleVideoAnalysis,
  createEmptyVideoAnalysis,
  DetectedObject,
  FrameAnalysis,
  ObjectTrack,
  SimpleVideoAnalysis,
  Subtitle,
  VideoAnalysis,
} from "@/types/video-analysis"

import { AiMessage } from "./ai-service"
import { CLAUDE_MODELS, ClaudeService } from "./claude-service"

/**
 * Класс для анализа видео с использованием ИИ
 */
export class VideoAnalysisService {
  private static instance: VideoAnalysisService
  private claudeService: ClaudeService
  private analysisCache: Map<string, SimpleVideoAnalysis> = new Map()

  private constructor() {
    this.claudeService = ClaudeService.getInstance()
  }

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): VideoAnalysisService {
    if (!VideoAnalysisService.instance) {
      VideoAnalysisService.instance = new VideoAnalysisService()
    }
    return VideoAnalysisService.instance
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
  }

  /**
   * Получить анализ видео из кэша
   * @param videoId ID видео
   */
  public getCachedAnalysis(videoId: string): SimpleVideoAnalysis | undefined {
    return this.analysisCache.get(videoId)
  }

  /**
   * Сохранить анализ видео в кэш
   * @param videoId ID видео
   * @param analysis Анализ видео
   */
  public cacheAnalysis(videoId: string, analysis: SimpleVideoAnalysis): void {
    this.analysisCache.set(videoId, analysis)
  }

  /**
   * Очистить кэш анализа видео
   */
  public clearCache(): void {
    this.analysisCache.clear()
  }

  /**
   * Анализировать кадр видео с использованием Claude
   * @param frameData Base64-кодированные данные кадра
   * @param timestamp Временная метка кадра в секундах
   */
  public async analyzeFrame(frameData: string, timestamp: number): Promise<FrameAnalysis> {
    if (!this.hasApiKey()) {
      throw new Error("API ключ не установлен. Пожалуйста, добавьте API ключ в настройках.")
    }

    const systemPrompt = `Вы - система компьютерного зрения. Ваша задача - анализировать кадры видео и определять объекты, сцены и другие визуальные элементы.
    
Проанализируйте предоставленный кадр и определите:
1. Все видимые объекты, их положение (координаты x, y, ширина, высота в диапазоне 0-1) и уверенность распознавания
2. Тип сцены (крупный план, средний план, общий план и т.д.)
3. Доминирующие цвета
4. Общую яркость и резкость кадра
5. Уровень движения (если возможно определить)
6. Теги, описывающие кадр

Ответ должен быть в формате JSON.`

    const userMessage: AiMessage = {
      role: "user",
      content: `Анализ кадра видео на временной метке ${timestamp} секунд.
      
Данные кадра: ${frameData.substring(0, 100)}... [данные обрезаны]

Пожалуйста, предоставьте подробный анализ этого кадра в формате JSON.`,
    }

    const messages: AiMessage[] = [userMessage]

    try {
      const response = await this.claudeService.sendRequest(
        CLAUDE_MODELS.CLAUDE_3_5_SONNET,
        messages,
        {
          system: systemPrompt,
          temperature: 0.2,
          max_tokens: 2000,
        },
      )

      // Извлекаем JSON из ответа
      const jsonMatch =
        response.match(/```json\n([\s\S]*?)\n```/) || response.match(/```\n([\s\S]*?)\n```/)
      if (!jsonMatch) {
        throw new Error("Не удалось извлечь JSON из ответа Claude")
      }

      const jsonStr = jsonMatch[1]
      const frameAnalysis = JSON.parse(jsonStr) as FrameAnalysis

      // Добавляем номер кадра и временную метку, если их нет
      if (!frameAnalysis.frameNumber) {
        frameAnalysis.frameNumber = Math.round(timestamp * 30) // Предполагаем 30 кадров в секунду
      }
      if (!frameAnalysis.timestamp) {
        frameAnalysis.timestamp = timestamp
      }

      return frameAnalysis
    } catch (error) {
      console.error("Ошибка при анализе кадра:", error)
      throw error
    }
  }

  /**
   * Анализировать субтитры с использованием Claude
   * @param subtitlesText Текст субтитров
   */
  public async analyzeSubtitles(subtitlesText: string): Promise<Subtitle[]> {
    if (!this.hasApiKey()) {
      throw new Error("API ключ не установлен. Пожалуйста, добавьте API ключ в настройках.")
    }

    const systemPrompt = `Вы - система анализа субтитров. Ваша задача - анализировать субтитры и определять их структуру, говорящих и эмоциональную окраску.
    
Проанализируйте предоставленные субтитры и определите:
1. Временные метки начала и конца каждого субтитра
2. Текст субтитра
3. Говорящего (если возможно определить)
4. Эмоциональную окраску (позитивная, негативная, нейтральная)
5. Ключевые слова в субтитре

Ответ должен быть в формате JSON.`

    const userMessage: AiMessage = {
      role: "user",
      content: `Анализ субтитров:
      
${subtitlesText}

Пожалуйста, предоставьте подробный анализ этих субтитров в формате JSON.`,
    }

    const messages: AiMessage[] = [userMessage]

    try {
      const response = await this.claudeService.sendRequest(
        CLAUDE_MODELS.CLAUDE_3_5_SONNET,
        messages,
        {
          system: systemPrompt,
          temperature: 0.2,
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
      const subtitles = JSON.parse(jsonStr) as Subtitle[]

      return subtitles
    } catch (error) {
      console.error("Ошибка при анализе субтитров:", error)
      throw error
    }
  }

  /**
   * Создать упрощенный анализ видео на основе ключевых кадров и субтитров
   * @param videoId ID видео
   * @param duration Длительность видео в секундах
   * @param keyFrames Ключевые кадры (например, каждые 5 секунд)
   * @param subtitles Субтитры
   */
  public async createSimpleVideoAnalysis(
    videoId: string,
    duration: number,
    keyFrames: FrameAnalysis[],
    subtitles: Subtitle[],
  ): Promise<SimpleVideoAnalysis> {
    // Создаем базовый анализ
    const analysis = createEmptySimpleVideoAnalysis(videoId, duration)

    // Добавляем анализ ключевых кадров
    analysis.keyFrames = keyFrames.map((frame) => ({
      timestamp: frame.timestamp,
      objects: Object.entries(
        frame.objects.reduce(
          (acc, obj) => {
            acc[obj.label] = (acc[obj.label] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        ),
      ).map(([label, count]) => ({ label, count })),
      sceneType: frame.sceneType,
      tags: frame.tags,
    }))

    // Добавляем субтитры
    analysis.subtitles = subtitles.map((subtitle) => ({
      startTime: subtitle.startTime,
      endTime: subtitle.endTime,
      text: subtitle.text,
    }))

    // Определяем сцены на основе ключевых кадров
    analysis.scenes = this.detectScenes(keyFrames)

    // Кэшируем анализ
    this.cacheAnalysis(videoId, analysis)

    return analysis
  }

  /**
   * Определить сцены на основе ключевых кадров
   * @param keyFrames Ключевые кадры
   */
  private detectScenes(
    keyFrames: FrameAnalysis[],
  ): { startTime: number; endTime: number; type: string }[] {
    const scenes: { startTime: number; endTime: number; type: string }[] = []
    let currentScene: { startTime: number; endTime: number; type: string } | null = null

    for (let i = 0; i < keyFrames.length; i++) {
      const frame = keyFrames[i]

      if (!currentScene) {
        // Начинаем новую сцену
        currentScene = {
          startTime: frame.timestamp,
          endTime: frame.timestamp,
          type: frame.sceneType || "unknown",
        }
      } else if (currentScene.type !== frame.sceneType) {
        // Завершаем текущую сцену и начинаем новую
        currentScene.endTime = frame.timestamp
        scenes.push(currentScene)

        currentScene = {
          startTime: frame.timestamp,
          endTime: frame.timestamp,
          type: frame.sceneType || "unknown",
        }
      } else {
        // Продолжаем текущую сцену
        currentScene.endTime = frame.timestamp
      }
    }

    // Добавляем последнюю сцену
    if (currentScene) {
      scenes.push(currentScene)
    }

    return scenes
  }
}
