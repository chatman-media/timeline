import { historyDB } from "./indexed-db"

/**
 * Полностью очищает все базы данных и пересоздает их
 */
export async function resetDatabases(): Promise<void> {
  console.log("Начинаем полный сброс баз данных...")

  try {
    // 1. Удаляем все данные из historyDB
    await historyDB.clearHistory()
    console.log("История очищена")

    // 2. Закрываем соединения с базами
    historyDB.close()
    console.log("Соединения с базами закрыты")

    // 3. Удаляем базы данных полностью
    await Promise.all([deleteDatabase("timeline-history")])
    console.log("Базы данных удалены")

    // 4. Пересоздаем базы (произойдет автоматически при следующем обращении)
    console.log("Базы будут пересозданы при следующем обращении")

    return Promise.resolve()
  } catch (error) {
    console.error("Ошибка при сбросе баз данных:", error)
    return Promise.reject(error)
  }
}

/**
 * Удаляет базу данных IndexedDB
 */
async function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.deleteDatabase(name)

    request.onerror = () => {
      console.error(`Ошибка при удалении базы данных ${name}:`, request.error)
      reject(request.error)
    }

    request.onsuccess = () => {
      console.log(`База данных ${name} успешно удалена`)
      resolve()
    }
  })
}
