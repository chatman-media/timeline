import { get, set } from "idb-keyval"
import { assign, createMachine } from "xstate"

export const PREVIEW_SIZES = [60, 80, 100, 125, 150, 200, 250, 300, 400] as const
export const DEFAULT_SIZE = 100
export const MIN_SIZE = 60
export const MIN_SIZE_THUMBNAILS = 100

// Определяем размеры по умолчанию для разных режимов
export const DEFAULT_SIZE_GRID = 60
export const DEFAULT_SIZE_THUMBNAILS = 125
export const DEFAULT_SIZE_LIST = 80

export const STORAGE_KEYS = {
  MEDIA: "timeline-media-preview-size",
  TRANSITIONS: "timeline-transitions-preview-size",
  EFFECTS_AND_FILTERS: "timeline-effects-and-filters-preview-size",
  MEDIA_VIEW_MODE: "timeline-view-mode",
  MEDIA_GROUP_BY: "timeline-group-by",
  MEDIA_SORT_BY: "timeline-sort-by",
  MEDIA_SORT_ORDER: "timeline-sort-order",
  MEDIA_FILTER_TYPE: "timeline-filter-type",
  MEDIA_PREVIEW_SIZE_GRID: "timeline-preview-size-grid",
  MEDIA_PREVIEW_SIZE_THUMBNAILS: "timeline-preview-size-thumbnails",
  MEDIA_PREVIEW_SIZE_LIST: "timeline-preview-size-list",
} as const

export type ViewMode = "list" | "grid" | "thumbnails"
export type SortOrder = "asc" | "desc"
export type GroupBy = "none" | "date" | "type" | "duration"
export type FilterType = "all" | "video" | "audio" | "image"
type PreviewSize = (typeof PREVIEW_SIZES)[number]
type StorageKey = keyof typeof STORAGE_KEYS

interface MediaListSettings {
  viewMode: ViewMode
  groupBy: GroupBy
  sortBy: string
  sortOrder: SortOrder
  filterType: FilterType
  previewSizes: {
    grid: PreviewSize
    thumbnails: PreviewSize
    list: PreviewSize
  }
}

interface UserSettingsContext {
  previewSizes: Record<StorageKey, PreviewSize>
  mediaList: MediaListSettings
  isLoaded: boolean
}

const defaultMediaListSettings: MediaListSettings = {
  viewMode: "grid",
  groupBy: "date",
  sortBy: "date",
  sortOrder: "desc",
  filterType: "all",
  previewSizes: {
    grid: DEFAULT_SIZE_GRID,
    thumbnails: DEFAULT_SIZE_THUMBNAILS,
    list: DEFAULT_SIZE_LIST,
  },
}

type LoadUserSettingsEvent = { type: "LOAD_SETTINGS" }
type UserSettingsLoadedEvent = {
  type: "SETTINGS_LOADED"
  previewSizes: Record<StorageKey, PreviewSize>
  mediaList: MediaListSettings
}
type UpdatePreviewSizeEvent = { type: "UPDATE_PREVIEW_SIZE"; key: StorageKey; size: PreviewSize }
type UpdateMediaListSettingsEvent = {
  type: "UPDATE_MEDIA_LIST_SETTINGS"
  settings: Partial<MediaListSettings>
}
type UpdateMediaPreviewSizeEvent = {
  type: "UPDATE_MEDIA_PREVIEW_SIZE"
  mode: ViewMode
  size: PreviewSize
}

type UserSettingsEvent =
  | LoadUserSettingsEvent
  | UserSettingsLoadedEvent
  | UpdatePreviewSizeEvent
  | UpdateMediaListSettingsEvent
  | UpdateMediaPreviewSizeEvent

export const userSettingsMachine = createMachine(
  {
    id: "userSettings",
    initial: "loading",
    context: {
      previewSizes: {
        MEDIA: DEFAULT_SIZE,
        TRANSITIONS: DEFAULT_SIZE,
        EFFECTS_AND_FILTERS: DEFAULT_SIZE,
      },
      mediaList: defaultMediaListSettings,
      isLoaded: false,
    } satisfies UserSettingsContext,
    types: {
      context: {} as UserSettingsContext,
      events: {} as UserSettingsEvent,
    },
    states: {
      loading: {
        entry: "loadSettings",
        on: {
          SETTINGS_LOADED: {
            target: "idle",
            actions: "updateSettings",
          },
        },
      },
      idle: {
        on: {
          UPDATE_PREVIEW_SIZE: {
            actions: ["updatePreviewSize", "saveToStorage"],
          },
          UPDATE_MEDIA_LIST_SETTINGS: {
            actions: ["updateMediaListSettings", "saveMediaListSettings"],
          },
          UPDATE_MEDIA_PREVIEW_SIZE: {
            actions: ["updateMediaPreviewSize", "saveMediaPreviewSize"],
          },
        },
      },
    },
  },
  {
    actions: {
      loadSettings: () => {
        get(SETTINGS_STORAGE_KEY).then((settings: MediaListSettings | undefined) => {
          self.send({
            type: "SETTINGS_LOADED",
            mediaList: settings || defaultMediaListSettings,
          })
        })
      },
      updateSettings: assign({
        previewSizes: (_, event) => {
          if (event.type !== "SETTINGS_LOADED") return {}
          return event.previewSizes
        },
        mediaList: (_, event) => {
          if (event.type !== "SETTINGS_LOADED") return defaultMediaListSettings
          return event.mediaList
        },
        isLoaded: () => true,
      }),
      updatePreviewSize: assign({
        previewSizes: (context, event) => {
          if (event.type !== "UPDATE_PREVIEW_SIZE") return context.previewSizes
          return {
            ...context.previewSizes,
            [event.key]: event.size,
          }
        },
      }),
      updateMediaListSettings: assign({
        mediaList: (context, event) => {
          if (event.type !== "UPDATE_MEDIA_LIST_SETTINGS") return context.mediaList
          return {
            ...context.mediaList,
            ...event.settings,
          }
        },
      }),
      updateMediaPreviewSize: assign({
        mediaList: (context, event) => {
          if (event.type !== "UPDATE_MEDIA_PREVIEW_SIZE") return context.mediaList
          return {
            ...context.mediaList,
            previewSizes: {
              ...context.mediaList.previewSizes,
              [event.mode]: event.size,
            },
          }
        },
      }),
      saveToStorage: (_, event) => {
        if (event.type !== "UPDATE_PREVIEW_SIZE") return
        try {
          localStorage.setItem(STORAGE_KEYS[event.key], event.size.toString())
        } catch (error) {
          console.error(`Error saving settings for ${event.key}:`, error)
        }
      },
      saveMediaListSettings: (context) => {
        set(SETTINGS_STORAGE_KEY, context.mediaList)
      },
      saveMediaPreviewSize: (context, event) => {
        if (event.type !== "UPDATE_MEDIA_PREVIEW_SIZE") return
        try {
          const storageKey =
            event.mode === "grid"
              ? STORAGE_KEYS.MEDIA_PREVIEW_SIZE_GRID
              : event.mode === "thumbnails"
                ? STORAGE_KEYS.MEDIA_PREVIEW_SIZE_THUMBNAILS
                : STORAGE_KEYS.MEDIA_PREVIEW_SIZE_LIST
          localStorage.setItem(storageKey, context.mediaList.previewSizes[event.mode].toString())
        } catch (error) {
          console.error("Error saving media preview size:", error)
        }
      },
    },
  },
)
