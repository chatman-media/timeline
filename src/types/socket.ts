import { NextApiResponse } from "next"
import { Server as NetServer } from "http"
import { Server as SocketIOServer } from "socket.io"

/**
 * Расширение типа NextApiResponse для поддержки Socket.IO
 */
export interface NextApiResponseServerIO extends NextApiResponse {
  socket: {
    server: NetServer & {
      io?: SocketIOServer
    }
  }
}

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
 * Интерфейс для данных о файле
 */
export interface FileWatcherData {
  path: string
  name: string
  timestamp: number
}
