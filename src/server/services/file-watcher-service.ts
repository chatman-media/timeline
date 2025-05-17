import path from "node:path"

import chokidar from "chokidar"
import { Server as SocketIOServer } from "socket.io"

/**
 * Типы событий файлового наблюдателя
 */
export enum FileWatcherEvent {
  MEDIA_ADDED = "media:added",
  MEDIA_CHANGED = "media:changed",
  MEDIA_REMOVED = "media:removed",
  MUSIC_ADDED = "music:added",
  MUSIC_CHANGED = "music:changed",
  MUSIC_REMOVED = "music:removed",
}

/**
 * Сервис для отслеживания изменений в директориях с медиафайлами
 */
export class FileWatcherService {
  private static instance: FileWatcherService
  private mediaWatcher: ReturnType<typeof chokidar.watch> | null = null
  private musicWatcher: ReturnType<typeof chokidar.watch> | null = null
  private io: SocketIOServer | null = null
  private isInitialized = false

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): FileWatcherService {
    if (!FileWatcherService.instance) {
      FileWatcherService.instance = new FileWatcherService()
    }
    return FileWatcherService.instance
  }

  /**
   * Инициализировать сервис с Socket.IO сервером
   * @param io Socket.IO сервер
   */
  public initialize(io: SocketIOServer): void {
    if (this.isInitialized) {
      console.log("[FileWatcherService] Сервис уже инициализирован")
      return
    }

    this.io = io
    this.isInitialized = true
    console.log("[FileWatcherService] Сервис инициализирован")
  }

  /**
   * Запустить отслеживание изменений в директориях
   */
  public startWatching(): void {
    if (!this.io) {
      console.error("[FileWatcherService] Socket.IO сервер не инициализирован")
      return
    }

    this.watchMediaDirectory()
    this.watchMusicDirectory()
    console.log("[FileWatcherService] Отслеживание изменений запущено")
  }

  /**
   * Остановить отслеживание изменений в директориях
   */
  public stopWatching(): void {
    if (this.mediaWatcher) {
      this.mediaWatcher.close()
      this.mediaWatcher = null
    }

    if (this.musicWatcher) {
      this.musicWatcher.close()
      this.musicWatcher = null
    }

    console.log("[FileWatcherService] Отслеживание изменений остановлено")
  }

  /**
   * Отслеживать изменения в директории с медиафайлами
   */
  private watchMediaDirectory(): void {
    const mediaDir = path.join(process.cwd(), "public", "media")

    // Создаем наблюдатель для директории с медиафайлами
    this.mediaWatcher = chokidar.watch(mediaDir, {
      ignored: /(^|[\/\\])\../, // Игнорируем скрытые файлы
      persistent: true,
      ignoreInitial: false, // Отправляем события для существующих файлов при запуске
      awaitWriteFinish: {
        stabilityThreshold: 2000, // Ждем 2 секунды после последнего изменения файла
        pollInterval: 100, // Проверяем каждые 100 мс
      },
    })

    // Обрабатываем события добавления файлов
    this.mediaWatcher?.on("add", (filePath: string) => {
      const relativePath = path.relative(mediaDir, filePath)
      console.log(`[FileWatcherService] Медиафайл добавлен: ${relativePath}`)
      this.io?.emit(FileWatcherEvent.MEDIA_ADDED, {
        path: `/media/${relativePath}`,
        name: path.basename(filePath),
        timestamp: Date.now(),
      })
    })

    // Обрабатываем события изменения файлов
    this.mediaWatcher?.on("change", (filePath: string) => {
      const relativePath = path.relative(mediaDir, filePath)
      console.log(`[FileWatcherService] Медиафайл изменен: ${relativePath}`)
      this.io?.emit(FileWatcherEvent.MEDIA_CHANGED, {
        path: `/media/${relativePath}`,
        name: path.basename(filePath),
        timestamp: Date.now(),
      })
    })

    // Обрабатываем события удаления файлов
    this.mediaWatcher?.on("unlink", (filePath: string) => {
      const relativePath = path.relative(mediaDir, filePath)
      console.log(`[FileWatcherService] Медиафайл удален: ${relativePath}`)
      this.io?.emit(FileWatcherEvent.MEDIA_REMOVED, {
        path: `/media/${relativePath}`,
        name: path.basename(filePath),
        timestamp: Date.now(),
      })
    })

    console.log(`[FileWatcherService] Отслеживание директории ${mediaDir} запущено`)
  }

  /**
   * Отслеживать изменения в директории с музыкой
   */
  private watchMusicDirectory(): void {
    const musicDir = path.join(process.cwd(), "public", "music")

    // Создаем наблюдатель для директории с музыкой
    this.musicWatcher = chokidar.watch(musicDir, {
      ignored: /(^|[\/\\])\../, // Игнорируем скрытые файлы
      persistent: true,
      ignoreInitial: false, // Отправляем события для существующих файлов при запуске
      awaitWriteFinish: {
        stabilityThreshold: 2000, // Ждем 2 секунды после последнего изменения файла
        pollInterval: 100, // Проверяем каждые 100 мс
      },
    })

    // Обрабатываем события добавления файлов
    this.musicWatcher?.on("add", (filePath: string) => {
      const relativePath = path.relative(musicDir, filePath)
      console.log(`[FileWatcherService] Музыкальный файл добавлен: ${relativePath}`)
      this.io?.emit(FileWatcherEvent.MUSIC_ADDED, {
        path: `/music/${relativePath}`,
        name: path.basename(filePath),
        timestamp: Date.now(),
      })
    })

    // Обрабатываем события изменения файлов
    this.musicWatcher?.on("change", (filePath: string) => {
      const relativePath = path.relative(musicDir, filePath)
      console.log(`[FileWatcherService] Музыкальный файл изменен: ${relativePath}`)
      this.io?.emit(FileWatcherEvent.MUSIC_CHANGED, {
        path: `/music/${relativePath}`,
        name: path.basename(filePath),
        timestamp: Date.now(),
      })
    })

    // Обрабатываем события удаления файлов
    this.musicWatcher?.on("unlink", (filePath: string) => {
      const relativePath = path.relative(musicDir, filePath)
      console.log(`[FileWatcherService] Музыкальный файл удален: ${relativePath}`)
      this.io?.emit(FileWatcherEvent.MUSIC_REMOVED, {
        path: `/music/${relativePath}`,
        name: path.basename(filePath),
        timestamp: Date.now(),
      })
    })

    console.log(`[FileWatcherService] Отслеживание директории ${musicDir} запущено`)
  }
}

// Экспортируем экземпляр сервиса
export const fileWatcherService = FileWatcherService.getInstance()
