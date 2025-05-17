import { io, Socket } from "socket.io-client"

import { FileWatcherData,FileWatcherEvent } from "@/types/socket"

/**
 * Тип обработчика событий Socket.IO
 */
type EventHandler = (data: FileWatcherData) => void

/**
 * Сервис для работы с Socket.IO на клиенте
 */
export class SocketService {
  private static instance: SocketService
  private socket: Socket | null = null
  private eventHandlers: Map<string, EventHandler[]> = new Map()
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService()
    }
    return SocketService.instance
  }

  /**
   * Подключиться к Socket.IO серверу
   */
  public connect(): void {
    if (this.socket) {
      console.log("[SocketService] Уже подключен к Socket.IO серверу")
      return
    }

    // Инициализируем Socket.IO сервер
    fetch("/api/socket")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Ошибка инициализации Socket.IO сервера: ${response.status}`)
        }
        return response.json()
      })
      .then(() => {
        // Создаем Socket.IO клиент
        this.socket = io({
          path: "/api/socketio",
          reconnectionAttempts: this.maxReconnectAttempts,
        })

        // Обрабатываем подключение
        this.socket.on("connect", () => {
          console.log(`[SocketService] Подключен к Socket.IO серверу: ${this.socket?.id}`)
          this.isConnected = true
          this.reconnectAttempts = 0
        })

        // Обрабатываем отключение
        this.socket.on("disconnect", (reason) => {
          console.log(`[SocketService] Отключен от Socket.IO сервера: ${reason}`)
          this.isConnected = false
        })

        // Обрабатываем ошибки
        this.socket.on("connect_error", (error) => {
          console.error(`[SocketService] Ошибка подключения: ${error.message}`)
          this.reconnectAttempts++

          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error(
              `[SocketService] Превышено количество попыток подключения (${this.maxReconnectAttempts})`,
            )
            this.socket?.disconnect()
          }
        })

        // Регистрируем обработчики событий
        this.registerEventHandlers()
      })
      .catch((error) => {
        console.error("[SocketService] Ошибка при инициализации Socket.IO сервера:", error)
      })
  }

  /**
   * Отключиться от Socket.IO сервера
   */
  public disconnect(): void {
    if (!this.socket) {
      console.log("[SocketService] Не подключен к Socket.IO серверу")
      return
    }

    this.socket.disconnect()
    this.socket = null
    this.isConnected = false
    console.log("[SocketService] Отключен от Socket.IO сервера")
  }

  /**
   * Зарегистрировать обработчик события
   * @param event Событие
   * @param handler Обработчик
   */
  public on(event: FileWatcherEvent, handler: EventHandler): void {
    // Получаем список обработчиков для события
    const handlers = this.eventHandlers.get(event) || []

    // Добавляем обработчик
    handlers.push(handler)

    // Обновляем список обработчиков
    this.eventHandlers.set(event, handlers)

    // Если подключены, регистрируем обработчик
    if (this.socket) {
      this.socket.on(event, handler)
    }
  }

  /**
   * Удалить обработчик события
   * @param event Событие
   * @param handler Обработчик
   */
  public off(event: FileWatcherEvent, handler: EventHandler): void {
    // Получаем список обработчиков для события
    const handlers = this.eventHandlers.get(event) || []

    // Удаляем обработчик
    const index = handlers.indexOf(handler)
    if (index !== -1) {
      handlers.splice(index, 1)

      // Обновляем список обработчиков
      this.eventHandlers.set(event, handlers)

      // Если подключены, удаляем обработчик
      if (this.socket) {
        this.socket.off(event, handler)
      }
    }
  }

  /**
   * Проверить, подключен ли к Socket.IO серверу
   */
  public isConnectedToServer(): boolean {
    return this.isConnected
  }

  /**
   * Зарегистрировать обработчики событий
   */
  private registerEventHandlers(): void {
    if (!this.socket) {
      return
    }

    // Регистрируем обработчики для всех событий
    this.eventHandlers.forEach((handlers, event) => {
      handlers.forEach((handler) => {
        this.socket?.on(event, handler)
      })
    })
  }
}

// Экспортируем экземпляр сервиса
export const socketService = SocketService.getInstance()
