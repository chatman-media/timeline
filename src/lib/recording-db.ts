import { RecordingComposition, RecordingSession, RecordingTrack } from "@/types/recording"

const DB_NAME = "timeline-recordings"
const SESSIONS_STORE = "sessions"
const COMPOSITIONS_STORE = "compositions"
const TRACKS_STORE = "tracks"
const DB_VERSION = 1

class RecordingDB {
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

        if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
          const sessionsStore = db.createObjectStore(SESSIONS_STORE, { keyPath: "id" })
          sessionsStore.createIndex("timestamp", "timestamp", { unique: false })
        }

        if (!db.objectStoreNames.contains(COMPOSITIONS_STORE)) {
          const compositionsStore = db.createObjectStore(COMPOSITIONS_STORE, { keyPath: "id" })
          compositionsStore.createIndex("sessionId", "sessionId", { unique: false })
          compositionsStore.createIndex("timestamp", "timestamp", { unique: false })
        }

        if (!db.objectStoreNames.contains(TRACKS_STORE)) {
          const tracksStore = db.createObjectStore(TRACKS_STORE, { keyPath: "id" })
          tracksStore.createIndex("compositionId", "compositionId", { unique: false })
          tracksStore.createIndex("cameraId", "cameraId", { unique: false })
        }
      }
    })
  }

  private async ensureDB(): Promise<void> {
    if (!this.db) {
      await this.init()
    }
  }

  // Сессии
  async saveSession(session: RecordingSession): Promise<void> {
    await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(SESSIONS_STORE, "readwrite")
      const store = transaction.objectStore(SESSIONS_STORE)
      const request = store.put(session)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getSession(id: string): Promise<RecordingSession | null> {
    await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(SESSIONS_STORE, "readonly")
      const store = transaction.objectStore(SESSIONS_STORE)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllSessions(): Promise<RecordingSession[]> {
    await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(SESSIONS_STORE, "readonly")
      const store = transaction.objectStore(SESSIONS_STORE)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Композиции
  async saveComposition(composition: RecordingComposition, sessionId: string): Promise<void> {
    await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(COMPOSITIONS_STORE, "readwrite")
      const store = transaction.objectStore(COMPOSITIONS_STORE)
      const request = store.put({
        ...composition,
        sessionId,
      })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getCompositionsBySession(sessionId: string): Promise<RecordingComposition[]> {
    await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(COMPOSITIONS_STORE, "readonly")
      const store = transaction.objectStore(COMPOSITIONS_STORE)
      const index = store.index("sessionId")
      const request = index.getAll(sessionId)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Дорожки
  async saveTrack(track: RecordingTrack, compositionId: string): Promise<void> {
    await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(TRACKS_STORE, "readwrite")
      const store = transaction.objectStore(TRACKS_STORE)
      const request = store.put({
        ...track,
        compositionId,
      })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getTracksByComposition(compositionId: string): Promise<RecordingTrack[]> {
    await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(TRACKS_STORE, "readonly")
      const store = transaction.objectStore(TRACKS_STORE)
      const index = store.index("compositionId")
      const request = index.getAll(compositionId)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getTracksByCamera(cameraId: string): Promise<RecordingTrack[]> {
    await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(TRACKS_STORE, "readonly")
      const store = transaction.objectStore(TRACKS_STORE)
      const index = store.index("cameraId")
      const request = index.getAll(cameraId)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
}

export const recordingDB = new RecordingDB()
