import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { PlayerControls } from "./player-controls"

// Мокируем useRootStore
vi.mock("@/hooks/use-root-store", () => ({
  useRootStore: vi.fn(() => ({
    isPlaying: false,
    setIsPlaying: vi.fn(),
    activeVideo: {
      id: "test-video",
      startTime: 0,
      duration: 100,
      probeData: {
        streams: [
          {
            r_frame_rate: "30/1",
          },
        ],
      },
    },
    setCurrentTime: vi.fn(),
    volume: 0.5,
    setVolume: vi.fn(),
    isSeeking: false,
    setIsSeeking: vi.fn(),
    tracks: [],
    activeTrackId: "track-1",
    timeRanges: [],
    initializeHistory: vi.fn(),
    isRecordingSchema: false,
    startRecordingSchema: vi.fn(),
    stopRecordingSchema: vi.fn(),
  })),
}))

describe("PlayerControls", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен корректно рендериться с переданным currentTime", () => {
    render(<PlayerControls currentTime={50} />)

    // Проверяем, что время отображается
    expect(screen.getByText("00:00:50.000")).toBeInTheDocument()
    expect(screen.getByText("00:01:40.000")).toBeInTheDocument() // Длительность видео 100 сек
  })

  it("должен показывать иконку Play, когда видео не воспроизводится", () => {
    render(<PlayerControls currentTime={10} />)

    // Найдем кнопку с title "Воспроизвести"
    const playButton = screen.getByTitle("Воспроизвести")
    expect(playButton).toBeInTheDocument()
  })

  it("должен отключать кнопки перехода к первому/предыдущему кадру при isPlaying=true", () => {
    // Переопределяем мок для этого теста
    vi.mocked(useRootStore).mockReturnValue({
      ...vi.mocked(useRootStore)(),
      isPlaying: true,
    })

    render(<PlayerControls currentTime={10} />)

    const prevFrameButton = screen.getByTitle("Предыдущий кадр")
    const firstFrameButton = screen.getByTitle("Первый кадр")

    expect(prevFrameButton).toBeDisabled()
    expect(firstFrameButton).toBeDisabled()
  })

  it("должен отключать кнопку перехода к первому кадру, когда находится на первом кадре", () => {
    // Переопределяем мок для этого теста
    vi.mocked(useRootStore).mockReturnValue({
      ...vi.mocked(useRootStore)(),
      isPlaying: false,
    })

    render(<PlayerControls currentTime={0} />)

    const firstFrameButton = screen.getByTitle("Первый кадр")
    expect(firstFrameButton).toBeDisabled()
  })

  it("должен менять громкость при перемещении слайдера громкости", () => {
    const setVolumeMock = vi.fn()
    vi.mocked(useRootStore).mockReturnValue({
      ...vi.mocked(useRootStore)(),
      setVolume: setVolumeMock,
    })

    render(<PlayerControls currentTime={10} />)

    // Находим слайдер громкости (это может быть сложно в зависимости от реализации)
    // Обычно мы используем data-testid или другие атрибуты для упрощения поиска
    // Но здесь просто имитируем изменение с помощью fireEvent
    const volumeSlider = screen.getAllByRole("slider")[1] // предполагаем, что это второй слайдер

    fireEvent.change(volumeSlider, { target: { value: 0.8 } })

    expect(setVolumeMock).toHaveBeenCalled()
  })
})
