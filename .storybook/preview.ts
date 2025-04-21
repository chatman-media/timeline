import type { Preview, StoryContext } from "@storybook/react"
import { withThemeByClassName } from "@storybook/addon-themes"
import React, { useEffect } from "react"
import "../src/styles/globals.css"

// Расширяем тип Window для включения наших глобальных функций
declare global {
  interface Window {
    __mockModule?: (path: string, mockModule: Record<string, any>) => void
    __restoreModule?: (path: string) => void
    __originalModules?: Record<string, Record<string, any>>
  }
}

// Тип для мокируемых модулей
interface MockModule {
  path: string
  module: Record<string, any>
}

// Декоратор для мокирования модулей
const withMockModules = (Story: React.ComponentType, context: StoryContext) => {
  const { parameters } = context
  const { mockModules } = parameters || {}

  // Создаем компонент-обертку для использования хуков
  const WrapperComponent = () => {
    // Если параметры содержат mockModules, применяем их
    if (mockModules && Array.isArray(mockModules) && window.__mockModule) {
      // Мокируем модули при монтировании
      mockModules.forEach((mockModule: MockModule) => {
        try {
          window.__mockModule?.(mockModule.path, mockModule.module)
        } catch (error) {
          console.error(`Error mocking module ${mockModule.path}:`, error)
        }
      })

      // Очистка при размонтировании
      useEffect(() => {
        return () => {
          if (window.__restoreModule) {
            mockModules.forEach((mockModule: MockModule) => {
              try {
                window.__restoreModule?.(mockModule.path)
              } catch (error) {
                console.error(`Error restoring module ${mockModule.path}:`, error)
              }
            })
          }
        }
      }, [])
    }

    return React.createElement(Story)
  }

  return React.createElement(WrapperComponent)
}

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    withMockModules,
    withThemeByClassName({
      themes: {
        light: "",
        dark: "dark",
      },
      defaultTheme: "dark",
    }),
  ],
}

export default preview
