import { TimeRange } from "@/types/time-range"
import type { MediaFile, ScreenLayout, Track } from "@/types/videos"

// Убираем Action, если он больше нигде не используется
/*
export interface Action {
  id: number
  type: string
  data: any
  timestamp: number
}
*/

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

export interface StateContext {
  media: MediaFile[]
  isLoading: boolean
  hasMedia: boolean
  isPlaying: boolean
  currentTime: number
  timeRanges: Record<string, TimeRange[]>
  tracks: Track[]
  videoRefs: { [key: string]: HTMLVideoElement }
  activeVideo: MediaFile | null
  hasFetched: boolean
  activeTrackId: string | null
  isChangingCamera: boolean
  metadataCache: Record<string, any>
  thumbnailCache: Record<string, string>
  currentLayout: ScreenLayout
  addedFiles: Set<string>
  isSaved: boolean
  scale: number
  volume: number
  trackVolumes: Record<string, number>
  isSeeking: boolean
  layoutMode: string
  panelLayouts: Record<string, number[]>
  isDirty: boolean
  montageSchema: MontageSegment[]
  isRecordingSchema: boolean
  currentRecordingSegmentId: string | null
  historySnapshotIds: number[]
  currentHistoryIndex: number
}

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

// Тип для хранения в IndexedDB (Set преобразуется в Array, временные поля исключены)
export type StorableStateContext = Omit<
  StateContext,
  Exclude<keyof typeof TEMPORARY_FIELDS, "currentTime"> | "addedFiles"
> & {
  addedFiles: string[]
}

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
  setScreenLayout: { layout: ScreenLayout }
  setActiveVideo: { videoId: string }
  setActiveTrack: { trackId: string }
  setTracks: { tracks: Track[] }
  addNewTracks: { media: MediaFile[] }
  setLayoutMode: { mode: string }
  setPanelLayout: { id: string; sizes: number[] }
  createHistoryPoint: { stateForHistory: StateContext }
  fetchVideos: never
  initializeHistory: never
  stopRecordingSchema: never
  startRecordingSchema: { trackId: string; startTime: number }
  clearHistory: never
  saveState: never
  markAsSaved: never
  setIsPlaying: { isPlaying: boolean }
  setCurrentTime: { time: number; source?: "playback" | "user" }
  setScale: { scale: number }
  addToMetadataCache: { key: string; data: any }
  addToThumbnailCache: { key: string; data: string }
  addToAddedFiles: { filePaths: string[] }
  setVolume: { volume: number }
  setTrackVolume: { trackId: string; volume: number }
  setIsSeeking: { isSeeking: boolean }
  undo: never
  redo: never
}

export type Effect = (callback: () => void | Promise<void>) => void

export type StoreEffect = {
  effect: Effect
}
