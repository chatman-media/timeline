import "@testing-library/jest-dom"

import { beforeEach, vi } from "vitest"

// Мок для localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
  length: 0,
  key: vi.fn(),
}

global.localStorage = localStorageMock

// Мок для fetch
global.fetch = vi.fn()

// Мок для ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Очистка всех моков перед каждым тестом
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})
