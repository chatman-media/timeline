// Импортируем необходимые модули
import { createServer } from "http"
import { Server as SocketIOServer } from "socket.io"

import { fileWatcherService } from "./services/file-watcher-service"

// Функция для создания Socket.IO сервера
function createSocketServer(): void {
  // Создаем HTTP сервер
  const httpServer = createServer()

  // Инициализируем Socket.IO сервер
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  })

  // Обрабатываем подключение клиентов
  io.on("connection", (socket) => {
    console.log(`[SocketServer] Клиент подключен: ${socket.id}`)

    // Обрабатываем отключение клиентов
    socket.on("disconnect", () => {
      console.log(`[SocketServer] Клиент отключен: ${socket.id}`)
    })
  })

  // Инициализируем сервис отслеживания файлов
  fileWatcherService.initialize(io)
  fileWatcherService.startWatching()

  // Запускаем HTTP сервер на порту 3002
  httpServer.listen(3002, () => {
    console.log("[SocketServer] Socket.IO сервер запущен на порту 3002")
  })
}

/**
 * Запускает сервер отслеживания файлов
 */
function startFileWatcherServer() {
  console.log("[FileWatcherServer] Запуск сервера отслеживания файлов...")
  createSocketServer()
}

// Запускаем сервер, если файл запущен напрямую
if (require.main === module) {
  startFileWatcherServer()
}

export { startFileWatcherServer }
