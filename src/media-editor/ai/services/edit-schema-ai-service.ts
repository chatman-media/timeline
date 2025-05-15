/**
 * Сервис для работы с ИИ в контексте схемы монтажа
 */
import { EditSegment, EditTrack } from "@/types/edit-schema"

import { AI_MODELS, AiMessage, AiService } from "./ai-service"

/**
 * Класс для работы с ИИ в контексте схемы монтажа
 */
export class EditSchemaAiService {
  private static instance: EditSchemaAiService
  private aiService: AiService

  private constructor() {
    this.aiService = AiService.getInstance()
  }

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): EditSchemaAiService {
    if (!EditSchemaAiService.instance) {
      EditSchemaAiService.instance = new EditSchemaAiService()
    }
    return EditSchemaAiService.instance
  }

  /**
   * Проверить, установлен ли API ключ
   */
  public hasApiKey(): boolean {
    return this.aiService.hasApiKey()
  }

  /**
   * Установить API ключ
   * @param apiKey Новый API ключ
   */
  public setApiKey(apiKey: string): void {
    this.aiService.setApiKey(apiKey)
  }

  /**
   * Создать системное сообщение с контекстом схемы монтажа
   * @param editSegments Сегменты схемы монтажа
   */
  private createSystemMessage(editSegments: EditSegment[]): AiMessage {
    // Создаем описание схемы монтажа для ИИ
    const schemaDescription =
      editSegments.length > 0
        ? `Текущая схема монтажа состоит из ${editSegments.length} сегментов:\n\n` +
          editSegments
            .map((segment, index) => {
              const tracksSummary = segment.tracks
                .map(
                  (track) =>
                    `    - ${track.name} (${track.type}, длительность: ${track.duration}с)`,
                )
                .join("\n")

              return (
                `Сегмент ${index + 1}: "${segment.name}"\n` +
                `  Начало: ${segment.startTime}с, Длительность: ${segment.duration}с\n` +
                `  Дорожки (${segment.tracks.length}):\n${tracksSummary}`
              )
            })
            .join("\n\n")
        : "Схема монтажа пуста. Вы можете помочь создать новые сегменты и дорожки."

    return {
      role: "system",
      content: `Вы - ассистент по видеомонтажу. Вы помогаете пользователю работать со схемой монтажа видео.

${schemaDescription}

Вы можете помочь пользователю с:
1. Созданием новых сегментов
2. Добавлением дорожек в сегменты
3. Применением шаблонов к сегментам
4. Генерацией команд FFmpeg для сборки финального видео
5. Анализом существующей схемы монтажа и предложением улучшений

Отвечайте кратко и по существу. Если пользователь просит выполнить конкретное действие со схемой монтажа, предложите конкретные шаги.`,
    }
  }

  /**
   * Отправить запрос к ИИ в контексте схемы монтажа
   * @param message Сообщение пользователя
   * @param editSegments Сегменты схемы монтажа
   * @param model Модель ИИ (по умолчанию Claude 3 Sonnet)
   */
  public async sendRequest(
    message: string,
    editSegments: EditSegment[],
    model: string = AI_MODELS.CLAUDE_3_SONNET,
  ): Promise<string> {
    const systemMessage = this.createSystemMessage(editSegments)
    const userMessage: AiMessage = { role: "user", content: message }

    const messages: AiMessage[] = [systemMessage, userMessage]

    return this.aiService.sendRequest(model, messages, {
      temperature: 0.7,
      max_tokens: 2000,
    })
  }

  /**
   * Отправить запрос к ИИ с историей сообщений
   * @param messages История сообщений
   * @param editSegments Сегменты схемы монтажа
   * @param model Модель ИИ (по умолчанию Claude 3 Sonnet)
   */
  public async sendRequestWithHistory(
    messages: AiMessage[],
    editSegments: EditSegment[],
    model: string = AI_MODELS.CLAUDE_3_SONNET,
  ): Promise<string> {
    const systemMessage = this.createSystemMessage(editSegments)

    const allMessages: AiMessage[] = [systemMessage, ...messages]

    return this.aiService.sendRequest(model, allMessages, {
      temperature: 0.7,
      max_tokens: 2000,
    })
  }

  /**
   * Анализировать схему монтажа и предложить улучшения
   * @param editSegments Сегменты схемы монтажа
   * @param model Модель ИИ (по умолчанию Claude 3 Sonnet)
   */
  public async analyzeEditSchema(
    editSegments: EditSegment[],
    model: string = AI_MODELS.CLAUDE_3_SONNET,
  ): Promise<string> {
    const systemMessage = this.createSystemMessage(editSegments)
    const userMessage: AiMessage = {
      role: "user",
      content:
        "Проанализируй мою текущую схему монтажа и предложи улучшения. Обрати внимание на длительность сегментов, переходы между ними и общую структуру.",
    }

    const messages: AiMessage[] = [systemMessage, userMessage]

    return this.aiService.sendRequest(model, messages, {
      temperature: 0.7,
      max_tokens: 2000,
    })
  }

  /**
   * Предложить команду FFmpeg для сборки финального видео
   * @param editSegments Сегменты схемы монтажа
   * @param outputPath Путь для сохранения результата
   * @param model Модель ИИ (по умолчанию Claude 3 Sonnet)
   */
  public async suggestFfmpegCommand(
    editSegments: EditSegment[],
    outputPath: string,
    model: string = AI_MODELS.CLAUDE_3_SONNET,
  ): Promise<string> {
    const systemMessage = this.createSystemMessage(editSegments)
    const userMessage: AiMessage = {
      role: "user",
      content: `Предложи команду FFmpeg для сборки финального видео на основе моей схемы монтажа. Результат должен быть сохранен в файл "${outputPath}".`,
    }

    const messages: AiMessage[] = [systemMessage, userMessage]

    return this.aiService.sendRequest(model, messages, {
      temperature: 0.7,
      max_tokens: 2000,
    })
  }
}
