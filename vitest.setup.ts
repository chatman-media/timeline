import '@testing-library/jest-dom'

// Добавляем глобальное определение React для Vitest, чтобы можно было использовать vi.spyOn(React, 'useState')
import * as React from 'react'
import { vi } from 'vitest'
global.React = React

// Мокируем matchMedia, если он не определен
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

// Мокируем screen, если он не определен
if (typeof window !== 'undefined' && !window.screen) {
  Object.defineProperty(window, 'screen', {
    writable: true,
    value: {
      width: 1440,
      height: 900,
    },
  })
}

// Мокируем devicePixelRatio, если он не определен
if (typeof window !== 'undefined' && !window.devicePixelRatio) {
  Object.defineProperty(window, 'devicePixelRatio', {
    writable: true,
    value: 1,
  })
} 