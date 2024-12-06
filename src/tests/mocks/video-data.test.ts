import { renderHook, waitFor } from "@testing-library/react"
import { createMocks } from "node-mocks-http"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useMedia } from "@/hooks/use-media"
import handler from "@/pages/api/media"
import { mockVideoData } from "@/tests/mocks/video-data"

// Мокаем fs и ffprobe
vi.mock("fs", () => ({
  promises: {
    readdir: vi.fn().mockResolvedValue(["test1.mp4", "test2.mp4"]),
    mkdir: vi.fn().mockResolvedValue(undefined),
    stat: vi.fn().mockResolvedValue({ isDirectory: () => false }),
  },
}))

vi.mock("fluent-ffmpeg", () => ({
  ffprobe: (_, callback) => callback(null, mockVideoData[0]),
}))

describe("Video API Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should handle API request and return media files", async () => {
    const { req, res } = createMocks({
      method: "GET",
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data).toHaveProperty("media")
    expect(Array.isArray(data.media)).toBe(true)
  })

  it("should integrate with useMedia hook", async () => {
    // Мокаем fetch для useMedia
    globalThis.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            media: mockVideoData.map((data) => ({
              id: `V${Math.floor(Math.random() * 1000)}`,
              name: data.format.filename.split("/").pop() || "",
              path: `/media/${data.format.filename.split("/").pop()}`,
              thumbnail: null,
              probeData: data,
              isVideo: data.streams.some((stream) => stream.codec_type === "video"),
            })),
          }),
      })
    )

    const { result } = renderHook(() => useMedia())

    await waitFor(() => {
      expect(result.current.media).toBeDefined()
      expect(Array.isArray(result.current.media)).toBe(true)
      expect(result.current.media.length).toBeGreaterThan(0)

      // Проверяем структуру данных
      result.current.media.forEach((item) => {
        expect(item).toHaveProperty("id")
        expect(item).toHaveProperty("name")
        expect(item).toHaveProperty("path")
        expect(item).toHaveProperty("probeData")
        expect(item).toHaveProperty("isVideo")
      })

      // Проверяем соответствие данных из API с данными в хуке
      expect(result.current.media[0].probeData.format).toHaveProperty("duration")
      expect(result.current.media[0].probeData.streams).toHaveLength(
        mockVideoData[0].streams.length,
      )
    })
  })

  it("should handle API errors gracefully", async () => {
    const { req, res } = createMocks({
      method: "GET",
    })

    // Симулируем ошибку файловой системы
    const fsPromises = require("fs").promises
    fsPromises.readdir.mockRejectedValueOnce(new Error("File system error"))

    await handler(req, res)

    expect(res._getStatusCode()).toBe(500)
    const data = JSON.parse(res._getData())
    expect(data.media).toEqual([])
  })
})
