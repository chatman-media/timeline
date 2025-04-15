import React, { createContext, ReactNode, useContext } from "react"

// Мок для useRootStore
import { useStore as originalUseRootStore } from "@/hooks/use-store"

// Создаем контекст для представления стора
type StoreProviderProps = {
  children: ReactNode
  mockState: any
}

// Создаем контекст с дефолтным значением null
const MockRootStoreContext = createContext<any>(null)

/**
 * Хук для использования мок-состояния стора
 */
export function useMockStore() {
  const mockState = useContext(MockRootStoreContext)

  // Если контекст не предоставлен, используем оригинальный хук
  if (mockState === null) {
    return originalUseRootStore()
  }

  return mockState
}

/**
 * Провайдер для мокирования RootStore в тестах и Storybook
 */
export function StoreProvider({ children, mockState }: StoreProviderProps) {
  return <MockRootStoreContext.Provider value={mockState}>{children}</MockRootStoreContext.Provider>
}
