import { Server as NetServer } from "http"
import { NextApiRequest } from "next"
import { Server as SocketIOServer } from "socket.io"

import { fileWatcherService } from "@/server/services/file-watcher-service"
import { NextApiResponseServerIO } from "@/types/socket"

/**
 * Глобальная переменная для хранения Socket.IO сервера
 */
let io: SocketIOServer | null = null

/**
 * API-маршрут для инициализации Socket.IO сервера
 */
export default function handler(req: NextApiRequest, res: NextApiResponseServerIO): void {
  // Если сервер уже инициализирован, возвращаем успешный ответ
  if (res.socket.server.io) {
    console.log("[API] Socket.IO сервер уже инициализирован")
    res.status(200).json({ success: true, message: "Socket.IO server already initialized" })
    return
  }

  // Получаем HTTP сервер из объекта ответа
  const httpServer: NetServer = res.socket.server as any

  // Создаем Socket.IO сервер
  io = new SocketIOServer(httpServer, {
    path: "/api/socketio",
    addTrailingSlash: false,
  })

  // Сохраняем Socket.IO сервер в объекте ответа
  res.socket.server.io = io

  // Обрабатываем подключение клиентов
  io.on("connection", (socket) => {
    console.log(`[API] Клиент подключен: ${socket.id}`)

    // Обрабатываем отключение клиентов
    socket.on("disconnect", () => {
      console.log(`[API] Клиент отключен: ${socket.id}`)
    })
  })

  // Инициализируем сервис отслеживания файлов
  fileWatcherService.initialize(io)
  fileWatcherService.startWatching()

  console.log("[API] Socket.IO сервер инициализирован")
  res.status(200).json({ success: true, message: "Socket.IO server initialized" })
}
