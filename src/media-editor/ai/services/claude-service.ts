/**
 * Специализированный сервис для работы с Claude API
 */
import { STORAGE_KEYS } from "@/media-editor/browser/machines/user-settings-machine"
import { StorageService } from "@/media-editor/browser/services/storage-service"

import { AiMessage } from "./ai-service"

// Доступные модели Claude
export const CLAUDE_MODELS = {
  CLAUDE_3_SONNET: "claude-3-sonnet-20240229",
  CLAUDE_3_HAIKU: "claude-3-haiku-20240307",
  CLAUDE_3_OPUS: "claude-3-opus-20240229",
  CLAUDE_3_5_SONNET: "claude-3-5-sonnet-20240620",
}

// Интерфейс для инструмента Claude
export interface ClaudeTool {
  name: string
  description: string
  input_schema: {
    type: string
    properties: Record<string, any>
    required?: string[]
  }
}

// Интерфейс для вызова инструмента
export interface ClaudeToolUse {
  name: string
  input: Record<string, any>
}

// Интерфейс для запроса к Claude API
interface ClaudeApiRequest {
  model: string
  messages: AiMessage[]
  system?: string
  temperature?: number
  max_tokens?: number
  tools?: ClaudeTool[]
  tool_choice?: "auto" | "any" | { name: string }
}

// Интерфейс для ответа от Claude API
interface ClaudeApiResponse {
  id: string
  type: string
  role: string
  content: {
    type: string
    text: string
  }[]
  model: string
  stop_reason: string
  stop_sequence: string | null
  usage: {
    input_tokens: number
    output_tokens: number
  }
  tool_use?: {
    id: string
    name: string
    input: Record<string, any>
  }
}

/**
 * Класс для работы с Claude API
 */
export class ClaudeService {
  private static instance: ClaudeService
  private apiKey: string = ""
  private storageService: StorageService
  private apiUrl: string = "https://api.anthropic.com/v1/messages"
  private apiVersion: string = "2023-06-01"

  private constructor() {
    this.storageService = StorageService.getInstance()
    this.loadApiKey()
  }

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): ClaudeService {
    if (!ClaudeService.instance) {
      ClaudeService.instance = new ClaudeService()
    }
    return ClaudeService.instance
  }

  /**
   * Загрузить API ключ из хранилища
   */
  private loadApiKey(): void {
    this.apiKey = this.storageService.get(STORAGE_KEYS.AI_API_KEY, "")
    console.log("Claude API key loaded:", this.apiKey ? "***" : "(empty)")
  }

  /**
   * Установить API ключ
   * @param apiKey Новый API ключ
   */
  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey
    this.storageService.set(STORAGE_KEYS.AI_API_KEY, apiKey)
    console.log("Claude API key updated:", apiKey ? "***" : "(empty)")
  }

  /**
   * Проверить, установлен ли API ключ
   */
  public hasApiKey(): boolean {
    return !!this.apiKey
  }

  /**
   * Отправить запрос к Claude API
   * @param model Модель Claude
   * @param messages Сообщения для отправки
   * @param options Дополнительные опции
   */
  public async sendRequest(
    model: string,
    messages: AiMessage[],
    options: {
      system?: string
      temperature?: number
      max_tokens?: number
      tools?: ClaudeTool[]
      tool_choice?: "auto" | "any" | { name: string }
    } = {},
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error("API ключ не установлен. Пожалуйста, добавьте API ключ в настройках.")
    }

    try {
      const requestBody: ClaudeApiRequest = {
        model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
      }

      // Добавляем системное сообщение, если оно есть
      if (options.system) {
        requestBody.system = options.system
      }

      // Добавляем инструменты, если они есть
      if (options.tools && options.tools.length > 0) {
        requestBody.tools = options.tools
        requestBody.tool_choice = options.tool_choice || "auto"
      }

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": this.apiVersion,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Ошибка Claude API: ${response.status} ${errorText}`)
      }

      const data = (await response.json()) as ClaudeApiResponse

      // Проверяем, использовал ли Claude инструмент
      if (data.tool_use) {
        return `[Использован инструмент: ${data.tool_use.name}]\n\nВходные данные: ${JSON.stringify(data.tool_use.input, null, 2)}`
      }

      // Возвращаем текст ответа
      return data.content[0].text
    } catch (error) {
      console.error("Ошибка при отправке запроса к Claude API:", error)
      throw error
    }
  }

  /**
   * Отправить запрос к Claude API с поддержкой инструментов
   * @param model Модель Claude
   * @param messages Сообщения для отправки
   * @param tools Инструменты для использования
   * @param options Дополнительные опции
   */
  public async sendRequestWithTools(
    model: string,
    messages: AiMessage[],
    tools: ClaudeTool[],
    options: {
      system?: string
      temperature?: number
      max_tokens?: number
      tool_choice?: "auto" | "any" | { name: string }
    } = {},
  ): Promise<{ text: string; tool_use?: ClaudeToolUse }> {
    if (!this.apiKey) {
      throw new Error("API ключ не установлен. Пожалуйста, добавьте API ключ в настройках.")
    }

    try {
      const requestBody: ClaudeApiRequest = {
        model,
        messages,
        tools,
        tool_choice: options.tool_choice || "auto",
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
      }

      // Добавляем системное сообщение, если оно есть
      if (options.system) {
        requestBody.system = options.system
      }

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": this.apiVersion,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Ошибка Claude API: ${response.status} ${errorText}`)
      }

      const data = (await response.json()) as ClaudeApiResponse

      // Проверяем, использовал ли Claude инструмент
      if (data.tool_use) {
        return {
          text: data.content[0].text,
          tool_use: {
            name: data.tool_use.name,
            input: data.tool_use.input,
          },
        }
      }

      // Возвращаем только текст ответа, если инструмент не использовался
      return { text: data.content[0].text }
    } catch (error) {
      console.error("Ошибка при отправке запроса к Claude API с инструментами:", error)
      throw error
    }
  }
}
