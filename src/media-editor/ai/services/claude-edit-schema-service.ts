/**
 * Сервис для работы с Claude в контексте схемы монтажа
 */
import { EditSegment, EditTrack } from "@/types/edit-schema"

import { AiMessage } from "./ai-service"
import { CLAUDE_MODELS, ClaudeService, ClaudeTool } from "./claude-service"

// Инструменты для работы со схемой монтажа
const EDIT_SCHEMA_TOOLS: ClaudeTool[] = [
  {
    name: "create_composite_track",
    description: "Создать сборную дорожку из нескольких параллельных дорожек в сегменте",
    input_schema: {
      type: "object",
      properties: {
        segmentId: {
          type: "string",
          description: "ID сегмента, для которого создается сборная дорожка",
        },
        switchInterval: {
          type: "number",
          description: "Интервал переключения между дорожками в секундах (по умолчанию 3 секунды)",
        },
        trackTypes: {
          type: "array",
          items: {
            type: "string",
            enum: ["video", "audio", "title", "subtitle"],
          },
          description: "Типы дорожек для включения в сборную дорожку",
        },
        includeTransitions: {
          type: "boolean",
          description: "Включать ли переходы между дорожками",
        },
        transitionDuration: {
          type: "number",
          description: "Длительность перехода в секундах (по умолчанию 0.5 секунды)",
        },
      },
      required: ["segmentId"],
    },
  },
  {
    name: "create_segment",
    description: "Создать новый сегмент в схеме монтажа",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Название сегмента",
        },
        startTime: {
          type: "number",
          description: "Время начала сегмента в секундах",
        },
        duration: {
          type: "number",
          description: "Длительность сегмента в секундах",
        },
        sceneType: {
          type: "string",
          description: "Тип сцены (крупный план, средний план, общий план и т.д.)",
        },
        tags: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Теги, описывающие сегмент",
        },
        narrative: {
          type: "object",
          properties: {
            role: {
              type: "string",
              description:
                "Роль в повествовании (вступление, развитие, кульминация, заключение и т.д.)",
            },
            description: {
              type: "string",
              description: "Описание роли в повествовании",
            },
          },
          description: "Нарративная информация о сегменте",
        },
      },
      required: ["name", "startTime", "duration"],
    },
  },
  {
    name: "add_track",
    description: "Добавить дорожку в сегмент",
    input_schema: {
      type: "object",
      properties: {
        segmentId: {
          type: "string",
          description: "ID сегмента, в который нужно добавить дорожку",
        },
        name: {
          type: "string",
          description: "Название дорожки",
        },
        type: {
          type: "string",
          description: "Тип дорожки (video, audio, subtitle, effect)",
        },
        duration: {
          type: "number",
          description: "Длительность дорожки в секундах",
        },
        subtitleData: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "Текст субтитра",
            },
            speaker: {
              type: "string",
              description: "Говорящий",
            },
          },
          description: "Данные субтитров (для дорожек типа subtitle)",
        },
        focusObjects: {
          type: "array",
          items: {
            type: "string",
          },
          description: "ID объектов, на которых фокусируется дорожка",
        },
      },
      required: ["segmentId", "name", "type"],
    },
  },
  {
    name: "apply_template",
    description: "Применить шаблон к сегменту",
    input_schema: {
      type: "object",
      properties: {
        segmentId: {
          type: "string",
          description: "ID сегмента, к которому нужно применить шаблон",
        },
        templateName: {
          type: "string",
          description: "Название шаблона (split-screen, picture-in-picture, side-by-side)",
        },
      },
      required: ["segmentId", "templateName"],
    },
  },
  {
    name: "generate_ffmpeg_command",
    description: "Сгенерировать команду FFmpeg для сборки финального видео",
    input_schema: {
      type: "object",
      properties: {
        outputPath: {
          type: "string",
          description: "Путь для сохранения результата",
        },
        format: {
          type: "string",
          description: "Формат выходного файла (mp4, mov, avi)",
        },
        quality: {
          type: "string",
          description: "Качество выходного файла (low, medium, high)",
        },
      },
      required: ["outputPath"],
    },
  },
  {
    name: "analyze_video",
    description: "Анализировать видео и создать схему монтажа на основе анализа",
    input_schema: {
      type: "object",
      properties: {
        videoId: {
          type: "string",
          description: "ID видео для анализа",
        },
        analyzeObjects: {
          type: "boolean",
          description: "Анализировать объекты в кадре",
        },
        analyzeSubtitles: {
          type: "boolean",
          description: "Анализировать субтитры",
        },
        analyzeAudio: {
          type: "boolean",
          description: "Анализировать аудио",
        },
      },
      required: ["videoId"],
    },
  },
  {
    name: "create_narrative_schema",
    description: "Создать нарративную схему монтажа на основе анализа видео",
    input_schema: {
      type: "object",
      properties: {
        videoId: {
          type: "string",
          description: "ID видео",
        },
        narrativeType: {
          type: "string",
          description: "Тип нарратива (хронологический, тематический, эмоциональный)",
        },
        focusObjects: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Объекты, на которых нужно сфокусироваться",
        },
      },
      required: ["videoId"],
    },
  },
]

/**
 * Класс для работы с Claude в контексте схемы монтажа
 */
export class ClaudeEditSchemaService {
  private static instance: ClaudeEditSchemaService
  private claudeService: ClaudeService

  private constructor() {
    this.claudeService = ClaudeService.getInstance()
  }

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): ClaudeEditSchemaService {
    if (!ClaudeEditSchemaService.instance) {
      ClaudeEditSchemaService.instance = new ClaudeEditSchemaService()
    }
    return ClaudeEditSchemaService.instance
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
   * Создать системное сообщение с контекстом схемы монтажа
   * @param editSegments Сегменты схемы монтажа
   */
  private createSystemPrompt(editSegments: EditSegment[]): string {
    // Создаем описание схемы монтажа для Claude
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
                `Сегмент ${index + 1}: "${segment.name}" (ID: ${segment.id})\n` +
                `  Начало: ${segment.startTime}с, Длительность: ${segment.duration}с\n` +
                `  Дорожки (${segment.tracks.length}):\n${tracksSummary}`
              )
            })
            .join("\n\n")
        : "Схема монтажа пуста. Вы можете помочь создать новые сегменты и дорожки."

    return `Вы - ассистент по видеомонтажу. Вы помогаете пользователю работать со схемой монтажа видео.

${schemaDescription}

Вы можете помочь пользователю с:
1. Созданием новых сегментов
2. Добавлением дорожек в сегменты
3. Применением шаблонов к сегментам
4. Генерацией команд FFmpeg для сборки финального видео
5. Анализом существующей схемы монтажа и предложением улучшений

У вас есть доступ к инструментам для работы со схемой монтажа:
- create_segment: создать новый сегмент
- add_track: добавить дорожку в сегмент
- apply_template: применить шаблон к сегменту
- generate_ffmpeg_command: сгенерировать команду FFmpeg

Отвечайте кратко и по существу. Если пользователь просит выполнить конкретное действие со схемой монтажа, используйте соответствующий инструмент.`
  }

  /**
   * Отправить запрос к Claude в контексте схемы монтажа
   * @param message Сообщение пользователя
   * @param editSegments Сегменты схемы монтажа
   * @param model Модель Claude (по умолчанию Claude 3 Sonnet)
   */
  public async sendRequest(
    message: string,
    editSegments: EditSegment[],
    model: string = CLAUDE_MODELS.CLAUDE_3_SONNET,
  ): Promise<string> {
    const systemPrompt = this.createSystemPrompt(editSegments)
    const userMessage: AiMessage = { role: "user", content: message }

    const messages: AiMessage[] = [userMessage]

    return this.claudeService.sendRequest(model, messages, {
      system: systemPrompt,
      temperature: 0.7,
      max_tokens: 2000,
    })
  }

  /**
   * Отправить запрос к Claude с инструментами
   * @param message Сообщение пользователя
   * @param editSegments Сегменты схемы монтажа
   * @param model Модель Claude (по умолчанию Claude 3 Sonnet)
   */
  public async sendRequestWithTools(
    message: string,
    editSegments: EditSegment[],
    model: string = CLAUDE_MODELS.CLAUDE_3_SONNET,
  ): Promise<{ text: string; toolUse?: any }> {
    const systemPrompt = this.createSystemPrompt(editSegments)
    const userMessage: AiMessage = { role: "user", content: message }

    const messages: AiMessage[] = [userMessage]

    const response = await this.claudeService.sendRequestWithTools(
      model,
      messages,
      EDIT_SCHEMA_TOOLS,
      {
        system: systemPrompt,
        temperature: 0.7,
        max_tokens: 2000,
      },
    )

    return {
      text: response.text,
      toolUse: response.tool_use,
    }
  }

  /**
   * Отправить запрос к Claude с историей сообщений
   * @param messages История сообщений
   * @param editSegments Сегменты схемы монтажа
   * @param model Модель Claude (по умолчанию Claude 3 Sonnet)
   */
  public async sendRequestWithHistory(
    messages: AiMessage[],
    editSegments: EditSegment[],
    model: string = CLAUDE_MODELS.CLAUDE_3_SONNET,
  ): Promise<string> {
    const systemPrompt = this.createSystemPrompt(editSegments)

    return this.claudeService.sendRequest(model, messages, {
      system: systemPrompt,
      temperature: 0.7,
      max_tokens: 2000,
    })
  }

  /**
   * Анализировать схему монтажа и предложить улучшения
   * @param editSegments Сегменты схемы монтажа
   * @param model Модель Claude (по умолчанию Claude 3 Sonnet)
   */
  public async analyzeEditSchema(
    editSegments: EditSegment[],
    model: string = CLAUDE_MODELS.CLAUDE_3_SONNET,
  ): Promise<string> {
    const systemPrompt = this.createSystemPrompt(editSegments)
    const userMessage: AiMessage = {
      role: "user",
      content:
        "Проанализируй мою текущую схему монтажа и предложи улучшения. Обрати внимание на длительность сегментов, переходы между ними и общую структуру.",
    }

    const messages: AiMessage[] = [userMessage]

    return this.claudeService.sendRequest(model, messages, {
      system: systemPrompt,
      temperature: 0.7,
      max_tokens: 2000,
    })
  }
}
