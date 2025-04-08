const DB_NAME = 'timeline-history'
const STORE_NAME = 'actions'
const STATE_STORE_NAME = 'state'
const DB_VERSION = 1

interface Action {
  id: number
  type: string
  data: any
  timestamp: number
}

interface StateSnapshot {
  id: number
  state: any
  timestamp: number
}

class IndexedDBHistory {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
        }
        if (!db.objectStoreNames.contains(STATE_STORE_NAME)) {
          db.createObjectStore(STATE_STORE_NAME, { keyPath: 'id', autoIncrement: true })
        }
      }
    })
  }

  private async ensureStoreExists(storeName: string): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(storeName)) {
          // Закрываем текущее соединение
          db.close()
          
          // Открываем новое соединение с увеличенной версией
          const upgradeRequest = indexedDB.open(DB_NAME, DB_VERSION + 1)
          
          upgradeRequest.onerror = () => reject(upgradeRequest.error)
          upgradeRequest.onupgradeneeded = (event) => {
            const upgradeDB = (event.target as IDBOpenDBRequest).result
            upgradeDB.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true })
          }
          upgradeRequest.onsuccess = () => {
            this.db = upgradeRequest.result
            resolve()
          }
        } else {
          resolve()
        }
      }
    })
  }

  async addAction(action: Omit<Action, 'id'>): Promise<number> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.add(action)

      request.onsuccess = () => resolve(request.result as number)
      request.onerror = () => reject(request.error)
    })
  }

  async getActions(limit: number = 100): Promise<Action[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        const actions = request.result as Action[]
        // Сортируем по времени и берем последние limit действий
        const sortedActions = actions
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, limit)
        resolve(sortedActions)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async clearHistory(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async deleteActions(ids: number[]): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const requests = ids.map(id => store.delete(id))
      Promise.all(requests.map(req => 
        new Promise((res, rej) => {
          req.onsuccess = () => res(undefined)
          req.onerror = () => rej(req.error)
        })
      ))
        .then(() => resolve())
        .catch(reject)
    })
  }

  async saveState(state: any): Promise<number> {
    await this.ensureStoreExists(STATE_STORE_NAME)

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STATE_STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STATE_STORE_NAME)
      const request = store.add({
        state,
        timestamp: Date.now()
      })

      request.onsuccess = () => resolve(request.result as number)
      request.onerror = () => reject(request.error)
    })
  }

  async getLatestState(): Promise<any> {
    await this.ensureStoreExists(STATE_STORE_NAME)

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STATE_STORE_NAME, 'readonly')
      const store = transaction.objectStore(STATE_STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        const states = request.result as StateSnapshot[]
        if (states.length === 0) {
          resolve(null)
          return
        }
        // Берем последнее состояние
        const latestState = states.sort((a, b) => b.timestamp - a.timestamp)[0]
        resolve(latestState.state)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async clearState(): Promise<void> {
    await this.ensureStoreExists(STATE_STORE_NAME)

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STATE_STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STATE_STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

export const historyDB = new IndexedDBHistory() 