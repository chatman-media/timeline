import { act, fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useMedia } from "@/hooks/use-media"
import { mockAssembledTracks, mockMediaFiles } from "@/tests/mocks/video-data"

import Home from "../index"

// Mock components
vi.mock("@/components/media-player", () => ({
  MediaEditor: () => <div data-testid="media-player">Media Player</div>,
}))

vi.mock("@/components/loading-state", () => ({
  LoadingState: () => <div data-testid="loading-state">Loading...</div>,
}))

vi.mock("@/components/no-files", () => ({
  NoFiles: () => <div>Файлы не найдены</div>,
}))

vi.mock("@/components/compilation-settings", () => ({
  CompilationSettings: () => <div data-testid="compilation-settings">Settings</div>,
}))

// Mock the useMedia hook
vi.mock("@/hooks/use-media", () => ({
  useMedia: vi.fn(),
}))

describe("Home Page", () => {
  const mockUseMedia = {
    isLoading: false,
    hasMedia: true,
    play: vi.fn(),
    setActiveCamera: vi.fn(),
    isChangingCamera: false,
    assembledTracks: mockAssembledTracks,
    videos: mockMediaFiles,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useMedia as any).mockReturnValue(mockUseMedia)
  })

  it("renders MediaEditor when hasMedia is true", () => {
    render(<Home />)
    expect(screen.getByTestId("media-player")).toBeInTheDocument()
  })

  it("renders LoadingState when isLoading is true", () => {
    ;(useMedia as any).mockReturnValue({ ...mockUseMedia, isLoading: true })
    render(<Home />)
    expect(screen.getByTestId("loading-state")).toBeInTheDocument()
  })

  it("renders NoFiles when hasMedia is false", () => {
    ;(useMedia as any).mockReturnValue({ ...mockUseMedia, hasMedia: false })
    render(<Home />)
    expect(screen.getByText(/Файлы не найдены/)).toBeInTheDocument()
  })

  describe("Keyboard Controls", () => {
    it("switches camera when number keys 1-9 are pressed", () => {
      render(<Home />)

      // Press "1" key
      act(() => {
        fireEvent.keyDown(window, { key: "1" })
      })
      expect(mockUseMedia.setActiveCamera).toHaveBeenCalledWith("V1")

      // Press "2" key
      act(() => {
        fireEvent.keyDown(window, { key: "2" })
      })
      expect(mockUseMedia.setActiveCamera).toHaveBeenCalledWith("V2")

      // Press invalid camera number
      act(() => {
        fireEvent.keyDown(window, { key: "9" })
      })
      expect(mockUseMedia.setActiveCamera).not.toHaveBeenCalledWith("V9")
    })

    it("toggles play/pause when space or P key is pressed", () => {
      render(<Home />)

      // Press space
      act(() => {
        fireEvent.keyDown(window, { key: " " })
      })
      expect(mockUseMedia.play).toHaveBeenCalled()

      // Press "p" key
      act(() => {
        fireEvent.keyDown(window, { key: "p" })
      })
      expect(mockUseMedia.play).toHaveBeenCalled()

      // Press "P" key (uppercase)
      act(() => {
        fireEvent.keyDown(window, { key: "P" })
      })
      expect(mockUseMedia.play).toHaveBeenCalled()
    })
  })

  it("cleans up event listeners on unmount", () => {
    const { unmount } = render(<Home />)
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener")

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function))
  })
})
