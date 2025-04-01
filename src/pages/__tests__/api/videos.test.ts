import { renderHook, waitFor } from "@testing-library/react"
import { createMocks } from "node-mocks-http"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useMedia } from "@/hooks/use-media"
import handler from "@/pages/api/media"
import { mockVideoData } from "@/tests/mocks/video-data"

// Объявляем моки в начале файла
const mockReaddir = vi.fn()
const mockMkdir = vi.fn()
const mockStat = vi.fn()

// Мокаем модули
vi.mock("fs", () => {
  return {
    promises: {
      readdir: mockReaddir,
      mkdir: mockMkdir,
      stat: mockStat,
    },
  }
})

vi.mock("fluent-ffmpeg", () => ({
  default: {},
  ffprobe: (_, callback) => callback(null, mockVideoData[0]),
}))

describe("Video API Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Устанавливаем успешные значения по умолчанию
    mockReaddir.mockResolvedValue(["test1.mp4", "test2.mp4"])
    mockMkdir.mockResolvedValue(undefined)
    mockStat.mockResolvedValue({ isDirectory: () => false })
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
      }),
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
    mockReaddir.mockRejectedValue(new Error("File system error"))

    await handler(req, res)

    expect(res._getStatusCode()).toBe(500)
    const data = JSON.parse(res._getData())
    expect(data.media).toEqual([])
  })
})
