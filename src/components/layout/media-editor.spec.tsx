import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import * as React from "react"
import { MediaEditor } from "./media-editor"

// Мокируем хук useRootStore
vi.mock("@/hooks/use-root-store", () => ({
  useRootStore: vi.fn(() => ({
    activeVideo: null,
    videoRefs: {},
    layoutMode: "default",
    setLayoutMode: vi.fn(),
  })),
}))

// Получаем доступ к мокированной функции useRootStore из импорта
import { useRootStore } from "@/hooks/use-root-store"

// Мокируем компоненты лейаутов для упрощения тестирования
vi.mock("./editor/layouts/default-layout", () => ({
  DefaultMediaEditor: () => <div data-testid="default-layout">Стандартный лейаут</div>,
}))

vi.mock("./editor/layouts/classic-layout", () => ({
  ClassicMediaEditor: () => <div data-testid="classic-layout">Классический лейаут</div>,
}))

vi.mock("./editor/layouts/vertical-layout", () => ({
  VerticalMediaEditor: () => <div data-testid="vertical-layout">Вертикальный лейаут</div>,
}))

vi.mock("./editor/layouts/dual-layout", () => ({
  DualMediaEditor: () => <div data-testid="dual-layout">Двойной лейаут</div>,
}))

vi.mock("./editor/top-nav-bar", () => ({
  TopNavBar: ({ onLayoutChange, layoutMode, hasExternalDisplay }) => (
    <div data-testid="top-nav-bar">
      <button data-testid="change-to-classic" onClick={() => onLayoutChange("classic")}>
        К классическому
      </button>
      <span data-testid="current-layout">{layoutMode}</span>
      <span data-testid="has-external-display">
        {hasExternalDisplay ? "Есть внешний дисплей" : "Нет внешнего дисплея"}
      </span>
    </div>
  ),
}))

describe("MediaEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Мокируем matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
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

    // Мокируем screen
    Object.defineProperty(window, "screen", {
      writable: true,
      value: {
        width: 1440,
        height: 900,
      },
    })

    // Мокируем devicePixelRatio
    Object.defineProperty(window, "devicePixelRatio", {
      writable: true,
      value: 1,
    })
  })

  it("должен показывать экран загрузки перед рендерингом контента", () => {
    // Перезаписываем useState для первого вызова, чтобы isLoaded был false
    const isLoadedSpy = vi.spyOn(React, "useState")
    isLoadedSpy.mockImplementationOnce(() => [false, vi.fn()])

    render(<MediaEditor />)

    expect(screen.getByText("Загрузка...")).toBeInTheDocument()

    // Восстанавливаем оригинальный useState
    isLoadedSpy.mockRestore()
  })

  it("должен отображать лейаут по умолчанию, если layoutMode='default'", () => {
    // Переопределяем мок для этого теста
    vi.mocked(useRootStore).mockReturnValue({
      activeVideo: null,
      videoRefs: {},
      layoutMode: "default",
      setLayoutMode: vi.fn(),
    })

    render(<MediaEditor />)

    expect(screen.getByTestId("default-layout")).toBeInTheDocument()
    expect(screen.queryByTestId("classic-layout")).not.toBeInTheDocument()
    expect(screen.queryByTestId("vertical-layout")).not.toBeInTheDocument()
    expect(screen.queryByTestId("dual-layout")).not.toBeInTheDocument()
  })

  it("должен отображать классический лейаут, если layoutMode='classic'", () => {
    // Переопределяем мок для этого теста
    vi.mocked(useRootStore).mockReturnValue({
      activeVideo: null,
      videoRefs: {},
      layoutMode: "classic",
      setLayoutMode: vi.fn(),
    })

    render(<MediaEditor />)

    expect(screen.queryByTestId("default-layout")).not.toBeInTheDocument()
    expect(screen.getByTestId("classic-layout")).toBeInTheDocument()
    expect(screen.queryByTestId("vertical-layout")).not.toBeInTheDocument()
    expect(screen.queryByTestId("dual-layout")).not.toBeInTheDocument()
  })

  it("должен определять наличие внешнего дисплея", () => {
    // Устанавливаем широкий экран
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(min-width: 1920px)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    // Устанавливаем большой размер экрана
    window.screen.width = 2560

    render(<MediaEditor />)

    expect(screen.getByTestId("has-external-display").textContent).toBe("Есть внешний дисплей")
  })

  it("не должен показывать dual layout если нет внешнего дисплея", () => {
    // Переопределяем мок для этого теста
    vi.mocked(useRootStore).mockReturnValue({
      activeVideo: null,
      videoRefs: {},
      layoutMode: "dual",
      setLayoutMode: vi.fn(),
    })

    // Устанавливаем узкий экран
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    // Устанавливаем обычный размер экрана
    window.screen.width = 1440

    render(<MediaEditor />)

    expect(screen.queryByTestId("dual-layout")).not.toBeInTheDocument()
    expect(screen.getByTestId("has-external-display").textContent).toBe("Нет внешнего дисплея")
  })
})
