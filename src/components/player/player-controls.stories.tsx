// Подключаем стили для корректного отображения в Storybook
import "../../../src/styles/globals.css"

import { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"

import { StoreProvider } from "../mocks/store-provider"
import { PlayerControls } from "./player-controls"

const meta: Meta<typeof PlayerControls> = {
  title: "Компоненты/Плеер/Элементы управления",
  component: PlayerControls,
  parameters: {
    layout: "centered",
    // Добавляем параметры тем для всех историй
    themes: {
      default: "dark",
      list: [
        { name: "light", class: "", color: "#ffffff" },
        { name: "dark", class: "dark", color: "#1a1a1a" },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-4xl">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof PlayerControls>

// Мок-данные, используемые в историях
const mockStoreData = {
  isPlaying: false,
  setIsPlaying: fn(),
  activeVideo: {
    id: "video-1",
    startTime: 0,
    duration: 120,
    probeData: {
      streams: [
        {
          r_frame_rate: "30/1",
        },
      ],
    },
  },
  setCurrentTime: fn(),
  volume: 0.75,
  setVolume: fn(),
  isSeeking: false,
  setIsSeeking: fn(),
  tracks: [],
  activeTrackId: "track-1",
  timeRanges: [],
  initializeHistory: fn(),
  isRecordingSchema: false,
  startRecordingSchema: fn(),
  stopRecordingSchema: fn(),
}

// Основная история
export const Обычное: Story = {
  args: {
    currentTime: 10,
  },
  decorators: [
    (Story) => (
      <StoreProvider mockState={mockStoreData}>
        <Story />
      </StoreProvider>
    ),
  ],
}

// История с воспроизведением
export const Воспроизведение: Story = {
  args: {
    currentTime: 35.5,
  },
  decorators: [
    (Story) => (
      <StoreProvider
        mockState={{
          ...mockStoreData,
          isPlaying: true,
        }}
      >
        <Story />
      </StoreProvider>
    ),
  ],
}

// История с записью
export const Запись: Story = {
  args: {
    currentTime: 50,
  },
  decorators: [
    (Story) => (
      <StoreProvider
        mockState={{
          ...mockStoreData,
          isRecordingSchema: true,
        }}
      >
        <Story />
      </StoreProvider>
    ),
  ],
}

// История с без звука
export const БезЗвука: Story = {
  args: {
    currentTime: 75,
  },
  decorators: [
    (Story) => (
      <StoreProvider
        mockState={{
          ...mockStoreData,
          volume: 0,
        }}
      >
        <Story />
      </StoreProvider>
    ),
  ],
}

// История со светлой темой по умолчанию
export const СветлаяТема: Story = {
  args: {
    currentTime: 60,
  },
  parameters: {
    themes: {
      default: "light",
    },
  },
  decorators: [
    (Story) => (
      <StoreProvider mockState={mockStoreData}>
        <Story />
      </StoreProvider>
    ),
  ],
}
