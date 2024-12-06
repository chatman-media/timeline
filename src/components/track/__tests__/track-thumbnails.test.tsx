import { act, render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { TrackThumbnails } from "../track-thumbnails"

describe("TrackThumbnails", () => {
  const mockTrack = {
    allVideos: [{
      id: "video1",
      name: "test.mp4",
      probeData: {
        format: {
          duration: 60,
          tags: { creation_time: "2024-01-01T00:00:00Z" },
        },
      },
    }],
    cameraKey: "V1",
    index: 1,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("should not regenerate thumbnails when only timeline position changes", async () => {
    const { rerender } = render(
      <TrackThumbnails
        track={{
          ...mockTrack,
          video: {
            ...mockTrack.allVideos[0],
            path: "/test/path.mp4",
            isVideo: true,
            probeData: {
              format: {
                duration: 60,
                tags: { creation_time: "2024-01-01T00:00:00Z" },
              },
              streams: [],
              chapters: [],
            },
          },
          isActive: true,
          combinedDuration: 60,
          continuousSegments: [mockTrack.allVideos[0]],
        }}
        trackStartTime={0}
        trackEndTime={60}
        scale={1}
      />,
    )

    // Ждем выполнения debounced функции
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Теперь fetch должен быть вызван
    expect(fetch).toHaveBeenCalled()
    const initialFetchCount = fetch.mock.calls.length

    // Имитируем движение временной линии без изменения масштаба
    act(() => {
      rerender(
        <TrackThumbnails
          track={mockTrack}
          trackStartTime={10}
          trackEndTime={70}
          scale={1}
        />,
      )
      vi.advanceTimersByTime(300)
    })

    // Проверяем, что новых запросов не было
    expect(fetch.mock.calls.length).toBe(initialFetchCount)
  })
})
