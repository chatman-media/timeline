import { create } from "zustand"
import { persist } from "zustand/middleware"

/**
 * Интерфейс для настроек компиляции видео
 */
interface CompilationSettings {
  targetDuration: number // Целевая длительность итогового видео в секундах
  averageSceneDuration: number // Средняя длительность сцены (0-1)
  cameraChangeFrequency: number // Частота смены камеры (0-1)
  mainCameraPriority: number // Приоритет главной камеры (0-100)
  mainCamera?: string // ID главной камеры
}

/**
 * Интерфейс хранилища настроек компиляции
 */
interface CompilationSettingsStore {
  settings: CompilationSettings // Текущие настройки
  updateSettings: (updates: Partial<CompilationSettings>) => void // Метод обновления настроек
}

/**
 * Настройки по умолчанию
 */
const DEFAULT_SETTINGS: CompilationSettings = {
  targetDuration: 60, // 1 минута
  averageSceneDuration: 0.5, // Средняя длительность
  cameraChangeFrequency: 0.5, // Средняя частота
  mainCameraPriority: 50, // 50% приоритет
  mainCamera: undefined,
}

/**
 * Хук для управления настройками компиляции
 * Использует Zustand для управления состоянием и persist middleware для сохранения в localStorage
 */
export const useCompilationSettings = create<CompilationSettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      // Обновляет главную камеру как в store, так и в настройках
      // Частичное обновление настроек
      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),
    }),
    {
      name: "compilation-settings", // Ключ для localStorage
    },
  ),
)
