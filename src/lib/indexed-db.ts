import Dexie, { Table } from "dexie"

import { StateContext, StateSnapshot, StorableStateContext } from "./state-types"

class HistoryDatabase extends Dexie {
  // Таблица хранит снимки, где state - это StorableStateContext
  states!: Table<{ id?: number; timestamp: number; state: StorableStateContext }, number>

  constructor() {
    super("timeline-history")
    this.version(1).stores({
      // Первичный ключ 'id' (автоинкремент) и индекс 'timestamp'
      states: "++id, timestamp",
    })
    // MapToClass не нужен, структура соответствует объекту
  }

  // При сохранении принимаем УЖЕ ОЧИЩЕННЫЙ StorableStateContext
  async saveState(state: StorableStateContext): Promise<number> {
    const snapshot = {
      // id будет добавлен Dexie автоматически
      state, // Сохраняем StorableStateContext
      timestamp: Date.now(),
    }
    // put возвращает первичный ключ добавленного/обновленного объекта
    return this.states.put(snapshot)
  }

  // При получении возвращаем объект со StorableStateContext
  async getLatestState(): Promise<{
    id: number
    timestamp: number
    state: StorableStateContext
  } | null> {
    const latestSnapshot = await this.states.orderBy("timestamp").last()
    // Явно типизируем возвращаемое значение, Dexie может вернуть id
    return latestSnapshot
      ? ({ ...latestSnapshot, id: latestSnapshot.id! } as {
          id: number
          timestamp: number
          state: StorableStateContext
        })
      : null
  }

  // Возвращаем массив объектов со StorableStateContext
  async getAllStatesSorted(): Promise<
    { id: number; timestamp: number; state: StorableStateContext }[]
    > {
    const snapshots = await this.states.orderBy("timestamp").toArray()
    // Убеждаемся, что id не undefined
    return snapshots.filter((s) => s.id !== undefined).map((s) => ({ ...s, id: s.id! })) as {
      id: number
      timestamp: number
      state: StorableStateContext
    }[]
  }

  // Возвращаем конкретный объект со StorableStateContext или undefined
  async getStateById(
    id: number,
  ): Promise<{ id: number; timestamp: number; state: StorableStateContext } | undefined> {
    const snapshot = await this.states.get(id)
    return snapshot
      ? ({ ...snapshot, id: snapshot.id! } as {
          id: number
          timestamp: number
          state: StorableStateContext
        })
      : undefined
  }

  // Удаляем состояния новее указанного ID
  async deleteStatesAfterId(id: number): Promise<void> {
    // Получаем все первичные ключи состояний с ID > id
    const keysToDelete = await this.states.where("id").above(id).primaryKeys()
    if (keysToDelete.length > 0) {
      console.log("HistoryDB: Deleting states after ID:", keysToDelete)
      await this.states.bulkDelete(keysToDelete)
    }
  }

  // НОВЫЙ МЕТОД: Удаление конкретного состояния по ID
  async deleteState(id: number): Promise<void> {
    console.log("HistoryDB: Deleting state with ID:", id)
    await this.states.delete(id)
  }

  async clearHistory(): Promise<void> {
    console.log("HistoryDB: Clearing all history states.")
    return this.states.clear()
  }
}

export const historyDB = new HistoryDatabase()
