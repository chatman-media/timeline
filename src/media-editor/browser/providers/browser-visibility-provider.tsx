import { createContext, useContext, useEffect, useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"

// Ключ для хранения состояния видимости браузера в localStorage
const STORAGE_KEY = "browser-visible"

// Интерфейс контекста видимости браузера
interface BrowserVisibilityContextType {
  isBrowserVisible: boolean
  toggleBrowserVisibility: () => void
}

// Создаем контекст
const BrowserVisibilityContext = createContext<BrowserVisibilityContextType | undefined>(undefined)

/**
 * Провайдер для управления видимостью браузера
 */
export function BrowserVisibilityProvider({ children }: { children: React.ReactNode }) {
  // Инициализируем состояние с значением по умолчанию (true - браузер виден)
  const [isBrowserVisible, setIsBrowserVisible] = useState(true)

  // Загружаем сохраненное состояние из localStorage при монтировании
  useEffect(() => {
    try {
      const savedValue = localStorage.getItem(STORAGE_KEY)
      if (savedValue !== null) {
        setIsBrowserVisible(savedValue === "true")
      }
    } catch (error) {
      // Игнорируем ошибки при чтении из localStorage
    }
  }, [])

  // Функция для переключения видимости браузера
  const toggleBrowserVisibility = () => {
    const newValue = !isBrowserVisible
    setIsBrowserVisible(newValue)

    // Сохраняем новое значение в localStorage
    try {
      localStorage.setItem(STORAGE_KEY, newValue.toString())
    } catch (error) {
      // Игнорируем ошибки при записи в localStorage
    }
  }

  // Добавляем обработчик горячих клавиш Cmd+B/Ctrl+B
  useHotkeys(
    "mod+b",
    (event) => {
      event.preventDefault()
      toggleBrowserVisibility()
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
    },
  )

  // Создаем значение контекста
  const value = {
    isBrowserVisible,
    toggleBrowserVisibility,
  }

  return (
    <BrowserVisibilityContext.Provider value={value}>{children}</BrowserVisibilityContext.Provider>
  )
}

/**
 * Хук для использования контекста видимости браузера
 */
export function useBrowserVisibility() {
  const context = useContext(BrowserVisibilityContext)
  if (context === undefined) {
    throw new Error("useBrowserVisibility must be used within a BrowserVisibilityProvider")
  }
  return context
}
