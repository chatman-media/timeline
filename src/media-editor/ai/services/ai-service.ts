/**
 * Сервис для работы с API ИИ
 */
import { STORAGE_KEYS } from "@/media-editor/browser/machines/user-settings-machine"
import { StorageService } from "@/media-editor/browser/services/storage-service"

// Типы сообщений
export interface AiMessage {
  role: "user" | "assistant" | "system"
  content: string
}

// Интерфейс для запроса к API
interface AiApiRequest {
  model: string
  messages: AiMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

// Интерфейс для ответа от API
interface AiApiResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// Доступные модели
export const AI_MODELS = {
  CLAUDE_3_SONNET: "claude-3-sonnet-20240229",
  CLAUDE_3_HAIKU: "claude-3-haiku-20240307",
  CLAUDE_3_OPUS: "claude-3-opus-20240229",
  GPT_4: "gpt-4-turbo-preview",
  GPT_3_5: "gpt-3.5-turbo",
}

// Базовые URL для API
const API_URLS = {
  ANTHROPIC: "https://api.anthropic.com/v1/messages",
  OPENAI: "https://api.openai.com/v1/chat/completions",
}

/**
 * Класс для работы с API ИИ
 */
export class AiService {
  private static instance: AiService
  private apiKey: string = ""
  private storageService: StorageService

  private constructor() {
    this.storageService = StorageService.getInstance()
    this.loadApiKey()
  }

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): AiService {
    if (!AiService.instance) {
      AiService.instance = new AiService()
    }
    return AiService.instance
  }

  /**
   * Загрузить API ключ из хранилища
   */
  private loadApiKey(): void {
    this.apiKey = this.storageService.get(STORAGE_KEYS.AI_API_KEY, "")
    console.log("AI API key loaded:", this.apiKey ? "***" : "(empty)")
  }

  /**
   * Установить API ключ
   * @param apiKey Новый API ключ
   */
  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey
    this.storageService.set(STORAGE_KEYS.AI_API_KEY, apiKey)
    console.log("AI API key updated:", apiKey ? "***" : "(empty)")
  }

  /**
   * Проверить, установлен ли API ключ
   */
  public hasApiKey(): boolean {
    return !!this.apiKey
  }

  /**
   * Определить провайдера API по модели
   * @param model Модель ИИ
   */
  private getProviderByModel(model: string): "anthropic" | "openai" {
    if (model.startsWith("claude")) {
      return "anthropic"
    }
    return "openai"
  }

  /**
   * Отправить запрос к API ИИ
   * @param model Модель ИИ
   * @param messages Сообщения для отправки
   * @param options Дополнительные опции
   */
  public async sendRequest(
    model: string,
    messages: AiMessage[],
    options: { temperature?: number; max_tokens?: number } = {},
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error("API ключ не установлен. Пожалуйста, добавьте API ключ в настройках.")
    }

    const provider = this.getProviderByModel(model)

    if (provider === "anthropic") {
      return this.sendAnthropicRequest(model, messages, options)
    } else {
      return this.sendOpenAIRequest(model, messages, options)
    }
  }

  /**
   * Отправить запрос к API Anthropic (Claude)
   */
  private async sendAnthropicRequest(
    model: string,
    messages: AiMessage[],
    options: { temperature?: number; max_tokens?: number } = {},
  ): Promise<string> {
    try {
      const response = await fetch(API_URLS.ANTHROPIC, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 1000,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Ошибка API Anthropic: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      return data.content[0].text
    } catch (error) {
      console.error("Ошибка при отправке запроса к API Anthropic:", error)
      throw error
    }
  }

  /**
   * Отправить запрос к API OpenAI (GPT)
   */
  private async sendOpenAIRequest(
    model: string,
    messages: AiMessage[],
    options: { temperature?: number; max_tokens?: number } = {},
  ): Promise<string> {
    try {
      const response = await fetch(API_URLS.OPENAI, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 1000,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Ошибка API OpenAI: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      return data.choices[0].message.content
    } catch (error) {
      console.error("Ошибка при отправке запроса к API OpenAI:", error)
      throw error
    }
  }
}
