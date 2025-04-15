import { TimeRange } from "@/types/time-range"
import type { MediaFile, Track } from "@/types/videos"

export interface StateSnapshot {
  id?: number
  state: any // Состояние может быть Partial<StateContext> при сохранении
  timestamp: number
}

// --- Новое: Схема Монтажа ---
export interface MontageSegmentSettings {
  filters?: string[]
  luts?: string[]
  titles?: { text: string; position: string; startOffset: number; endOffset: number }[]
  // ... другие настройки ...
}

export interface MontageSegment {
  id: string
  sourceTrackIds: string[]
  startTime: number
  endTime: number | null
  settings?: MontageSegmentSettings
}
// --- Конец: Схема Монтажа ---

// Состояние для редактора (UI, выбранные файлы, макет и т.д.)
export interface EditorState {
  // UI состояние
  layoutMode: string
  isLoading: boolean
  isPlaying: boolean
  currentTime: number
  scale: number
  volume: number
  trackVolumes: Record<string, number>
  isSeeking: boolean
  isChangingCamera: boolean

  // Медиатека
  media: MediaFile[]
  hasMedia: boolean
  hasFetched?: boolean | undefined
  metadataCache: Record<string, any>
  thumbnailCache: Record<string, string>

  // Отметки о добавленных файлах
  addedFiles: Set<string>

  // Активные элементы
  activeVideo: MediaFile | null
  activeTrackId: string | null
  videoRefs: { [key: string]: HTMLVideoElement }
  tracks: Track[]
  isRecordingSchema: boolean
  currentRecordingSegmentId: string | null
  historySnapshotIds: number[]
  currentHistoryIndex: number
}

// Состояние для таймлайна (треки, схема монтажа и история)
export interface TimelineState {
  tracks: Track[]
  timeRanges: Record<string, TimeRange[]>
  montageSchema: MontageSegment[]
  isRecordingSchema: boolean
  currentRecordingSegmentId: string | null
  historySnapshotIds: number[]
  currentHistoryIndex: number
  isDirty: boolean
  isSaved: boolean
}

// Полное состояние приложения
export interface StateContext extends EditorState, TimelineState {}

// Сохраняемое EditorState (для IndexedDB)
export type StorableEditorState = Omit<
  EditorState,
  | "isLoading"
  | "isPlaying"
  | "isSeeking"
  | "isChangingCamera"
  | "isDirty"
  | "hasFetched"
  | "videoRefs"
  | "metadataCache"
  | "thumbnailCache"
> & {
  addedFiles: string[] // Конвертируем Set в Array для хранения
}

// Комбинированное сохраняемое состояние
export type StorableStateContext = StorableEditorState

// Убираем временные поля, так как теперь не сохраняем состояние
export const TEMPORARY_FIELDS = new Set<keyof StateContext>([
  "videoRefs",
  "isSeeking",
  "isChangingCamera",
  "isPlaying",
  "isDirty",
  "isLoading",
  "hasFetched",
  "isRecordingSchema",
  "currentRecordingSegmentId",
  "metadataCache",
  "thumbnailCache",
  "media",
  "tracks",
  "timeRanges",
  "montageSchema",
])

// Типы действий, которые не требуют сохранения состояния
export const TEMPORARY_ACTIONS = new Set([
  "setIsSeeking",
  "setIsChangingCamera",
  "setIsPlaying",
  "setVolume",
  "setTrackVolume",
  "setScale",
  "setCurrentTime",
])

// Типы действий, которые требуют немедленного сохранения
export const CRITICAL_ACTIONS = new Set([
  "setTracks",
  "addNewTracks",
  "setActiveTrack",
  "setActiveVideo",
  "setScreenLayout",
  "setLayoutMode",
  "setPanelLayout",
  "startRecordingSchema",
  "stopRecordingSchema",
  "endSeeking",
])

export type EnqueueObject = {
  effect: (callback: () => void | Promise<void>) => void
}

export type EventHandlerArgs = {
  enqueue?: EnqueueObject
}

export type StoreAssigner<TContext, TEvent, TEnqueue> = (
  context: TContext,
  event: TEvent,
  enq: TEnqueue,
) => TContext | void

export type EventPayloadMap = {
  setLoadingState: { isLoading: boolean }
  setState: { state: Partial<StateContext> }
  setHistoryState: { state: Partial<StateContext> }
  setMedia: { media: MediaFile[] }
  setActiveVideo: { videoId: string }
  setActiveTrack: { trackId: string }
  setTracks: { tracks: Track[] }
  addNewTracks: { media: MediaFile[] }
  setLayoutMode: { mode: string }
  setPanelLayout: { id: string; sizes: number[] }
  createHistoryPoint: { stateForHistory: StateContext }
  fetchVideos: {}
  initializeHistory: {}
  stopRecordingSchema: {}
  startRecordingSchema: { trackId: string; startTime: number }
  clearHistory: {}
  saveState: {}
  markAsSaved: {}
  setIsPlaying: { isPlaying: boolean }
  setCurrentTime: { time: number; source?: "playback" | "user" }
  setScale: { scale: number }
  addToMetadataCache: { key: string; data: any }
  addToThumbnailCache: { key: string; data: string }
  addToAddedFiles: { data: string[] }
  removeFromAddedFiles: { data: string[] }
  setVolume: { volume: number }
  setTrackVolume: { trackId: string; volume: number }
  setIsSeeking: { isSeeking: boolean }
  resetChangingCamera: {}
  undo: {}
  redo: {}
  addMediaFiles: { files: File[] }
  removeMediaFile: { id: string }
  clearCache: {}
}

export type Effect = (callback: () => void | Promise<void>) => void

export type StoreEffect = {
  effect: Effect
}
