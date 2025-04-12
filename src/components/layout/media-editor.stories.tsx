import React from "react"
import { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import { MediaEditor } from "./media-editor"

// Подключаем стили для корректного отображения в Storybook
import "../../../src/styles/globals.css"
import { RootStoreProvider } from "../mocks/root-store-provider"

// Определяем типы для параметров компонентов
type TopNavBarProps = {
  onLayoutChange: (mode: string) => void
  layoutMode: string
  hasExternalDisplay: boolean
}

// Мок-компоненты для визуализации в Storybook
const MockDefaultLayout = () => (
  <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900 text-black dark:text-white p-4">
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Стандартный лейаут</h2>
      <p>Используется для обычной работы с таймлайном</p>
    </div>
  </div>
)

const MockClassicLayout = () => (
  <div className="flex h-screen w-full items-center justify-center bg-blue-100 dark:bg-blue-900 text-black dark:text-white p-4">
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Классический лейаут</h2>
      <p>Традиционный вид редактора видео</p>
    </div>
  </div>
)

const MockVerticalLayout = () => (
  <div className="flex h-screen w-full items-center justify-center bg-green-100 dark:bg-green-900 text-black dark:text-white p-4">
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Вертикальный лейаут</h2>
      <p>Оптимизирован для вертикального контента</p>
    </div>
  </div>
)

const MockDualLayout = () => (
  <div className="flex h-screen w-full items-center justify-center bg-purple-100 dark:bg-purple-900 text-black dark:text-white p-4">
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Двойной лейаут</h2>
      <p>Для работы с двумя мониторами</p>
    </div>
  </div>
)

const MockTopNavBar = ({ onLayoutChange, layoutMode, hasExternalDisplay }: TopNavBarProps) => (
  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
    <div className="text-xl font-bold">Timeline Editor</div>
    <div className="flex gap-2">
      <button 
        className={`px-3 py-1 rounded ${layoutMode === 'default' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
        onClick={() => onLayoutChange("default")}
      >
        Стандартный
      </button>
      <button 
        className={`px-3 py-1 rounded ${layoutMode === 'classic' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
        onClick={() => onLayoutChange("classic")}
      >
        Классический
      </button>
      <button 
        className={`px-3 py-1 rounded ${layoutMode === 'vertical' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
        onClick={() => onLayoutChange("vertical")}
      >
        Вертикальный
      </button>
      <button 
        className={`px-3 py-1 rounded ${layoutMode === 'dual' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
        onClick={() => onLayoutChange("dual")}
        disabled={!hasExternalDisplay}
      >
        Двойной {!hasExternalDisplay && "(недоступно)"}
      </button>
    </div>
    <div className="text-sm text-gray-500">
      {hasExternalDisplay ? "Внешний дисплей подключен" : "Нет внешнего дисплея"}
    </div>
  </div>
)

// Создаем моки для модулей
// Вместо использования jest, переопределяем компоненты через React.createElement
const DefaultMediaEditorMock = MockDefaultLayout;
const ClassicMediaEditorMock = MockClassicLayout;
const VerticalMediaEditorMock = MockVerticalLayout;
const DualMediaEditorMock = MockDualLayout;
const TopNavBarMock = MockTopNavBar;

// Мок для обертывания компонентов лейаутов
const LayoutWrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;

const meta: Meta<typeof MediaEditor> = {
  title: "Компоненты/Лейаут/MediaEditor",
  component: MediaEditor,
  parameters: {
    layout: "fullscreen",
    mockModules: [
      {
        path: "./editor/layouts/default-layout",
        module: { DefaultMediaEditor: DefaultMediaEditorMock },
      },
      {
        path: "./editor/layouts/classic-layout",
        module: { ClassicMediaEditor: ClassicMediaEditorMock },
      },
      {
        path: "./editor/layouts/vertical-layout",
        module: { VerticalMediaEditor: VerticalMediaEditorMock },
      },
      {
        path: "./editor/layouts/dual-layout",
        module: { DualMediaEditor: DualMediaEditorMock },
      },
      {
        path: "./editor/top-nav-bar",
        module: { TopNavBar: TopNavBarMock },
      },
    ],
  },
}

export default meta
type Story = StoryObj<typeof MediaEditor>

// Базовые мок-данные для всех историй
const mockStoreData = {
  activeVideo: null,
  videoRefs: {},
  layoutMode: "default",
  setLayoutMode: fn(),
  // Неполная реализация, только для тестирования
}

// Настраиваем окружение с экранами для историй
const setupScreenEnvironment = (hasExternalDisplay: boolean) => {
  // Мокируем matchMedia для истории
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query === "(min-width: 1920px)" && hasExternalDisplay,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  })
  
  // Устанавливаем размер экрана в зависимости от hasExternalDisplay
  Object.defineProperty(window, 'screen', {
    writable: true,
    value: {
      width: hasExternalDisplay ? 2560 : 1440,
      height: hasExternalDisplay ? 1440 : 900
    }
  })
}

// Стандартный лейаут
export const Стандартный: Story = {
  decorators: [
    (Story) => {
      setupScreenEnvironment(false)
      return (
        <div className="dark">
          <RootStoreProvider mockState={{
            ...mockStoreData,
            layoutMode: "default",
          }}>
            <LayoutWrapper>
              <Story />
            </LayoutWrapper>
          </RootStoreProvider>
        </div>
      )
    },
  ],
}

// Классический лейаут
export const Классический: Story = {
  decorators: [
    (Story) => {
      setupScreenEnvironment(false)
      return (
        <div className="dark">
          <RootStoreProvider mockState={{
            ...mockStoreData,
            layoutMode: "classic",
          }}>
            <LayoutWrapper>
              <Story />
            </LayoutWrapper>
          </RootStoreProvider>
        </div>
      )
    },
  ],
}

// Вертикальный лейаут
export const Вертикальный: Story = {
  decorators: [
    (Story) => {
      setupScreenEnvironment(false)
      return (
        <div className="dark">
          <RootStoreProvider mockState={{
            ...mockStoreData,
            layoutMode: "vertical",
          }}>
            <LayoutWrapper>
              <Story />
            </LayoutWrapper>
          </RootStoreProvider>
        </div>
      )
    },
  ],
}

// Двойной лейаут с внешним дисплеем
export const ДвойнойСВнешнимДисплеем: Story = {
  decorators: [
    (Story) => {
      setupScreenEnvironment(true)
      return (
        <div className="dark">
          <RootStoreProvider mockState={{
            ...mockStoreData,
            layoutMode: "dual",
          }}>
            <LayoutWrapper>
              <Story />
            </LayoutWrapper>
          </RootStoreProvider>
        </div>
      )
    },
  ],
}

// Двойной лейаут без внешнего дисплея (не должен отображаться)
export const ДвойнойБезВнешнегоДисплея: Story = {
  decorators: [
    (Story) => {
      setupScreenEnvironment(false)
      return (
        <div className="dark">
          <RootStoreProvider mockState={{
            ...mockStoreData,
            layoutMode: "dual",
          }}>
            <LayoutWrapper>
              <Story />
            </LayoutWrapper>
          </RootStoreProvider>
        </div>
      )
    },
  ],
} 