import React, { ReactNode, createContext, useContext } from "react"

// Мок для useRootStore
import { useRootStore as originalUseRootStore } from "@/hooks/use-root-store"

// Создаем контекст для представления стора
type RootStoreProviderProps = {
  children: ReactNode
  mockState: any
}

// Создаем контекст с дефолтным значением null
const MockRootStoreContext = createContext<any>(null)

/**
 * Хук для использования мок-состояния стора
 */
export function useMockRootStore() {
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
export function RootStoreProvider({ children, mockState }: RootStoreProviderProps) {
  return (
    <MockRootStoreContext.Provider value={mockState}>
      {children}
    </MockRootStoreContext.Provider>
  )
} 