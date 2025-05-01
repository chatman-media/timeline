import { describe, expect, it } from "vitest"

import { mockMediaFiles, mockVideoData } from "@/tests/mocks/video.data"
import type { MediaFile } from "@/types/media"

import { createTracksFromFiles, getGroupedFiles } from "../media-files"

describe("createTracksFromFiles", () => {
  const mockVideoFile = (name: string, startTime: number, duration: number): MediaFile => ({
    id: `test-${name}`,
    name,
    path: `/path/to/${name}`,
    startTime,
    duration,
    probeData: {
      streams: [{ codec_type: "video", index: 0 }],
      format: {
        duration,
        size: 1000,
      },
    },
  })

  const mockAudioFile = (name: string, startTime: number, duration: number): MediaFile => ({
    id: `test-${name}`,
    name,
    path: `/path/to/${name}`,
    startTime,
    duration,
    probeData: {
      streams: [{ codec_type: "audio", index: 0 }],
      format: {
        duration,
        size: 1000,
      },
    },
  })

  it("should create sectors for different days using real data", () => {
    // Используем реальные данные из mockMediaFiles
    const files = mockMediaFiles.map((file) => ({
      ...file,
      startTime: new Date(file.probeData.format.tags.creation_time).getTime() / 1000,
    }))

    const sectors = createTracksFromFiles(files)

    // Проверяем что создались разные сектора для разных дней
    const uniqueDays = new Set(
      files.map(
        (file) => new Date(file.probeData.format.tags.creation_time).toISOString().split("T")[0],
      ),
    )

    expect(sectors.length).toBe(uniqueDays.size)

    // Проверяем что каждый сектор содержит файлы только своего дня
    sectors.forEach((sector) => {
      const sectorDate = sector.name.split(" ")[1] // Предполагаем формат "Сектор YYYY-MM-DD"
      const sectorFiles = sector.tracks.flatMap((track) => track.videos || [])

      sectorFiles.forEach((file) => {
        const fileDate = new Date(file.probeData.format.tags.creation_time)
          .toISOString()
          .split("T")[0]
        expect(fileDate).toBe(sectorDate)
      })
    })
  })

  it("should correctly handle video types from real data", () => {
    const files = mockMediaFiles.map((file) => ({
      ...file,
      startTime: new Date(file.probeData.format.tags.creation_time).getTime() / 1000,
    }))

    const sectors = createTracksFromFiles(files)

    sectors.forEach((sector) => {
      sector.tracks.forEach((track) => {
        // Проверяем что тип трека соответствует типу файлов в нем
        const hasVideo = track.videos?.some((video) =>
          video.probeData.streams.some((stream) => stream.codec_type === "video"),
        )
        expect(track.type).toBe(hasVideo ? "video" : "audio")
      })
    })
  })

  it("should maintain correct time ranges within sectors using real data", () => {
    const files = mockMediaFiles.map((file) => ({
      ...file,
      startTime: new Date(file.probeData.format.tags.creation_time).getTime() / 1000,
    }))

    const sectors = createTracksFromFiles(files)

    sectors.forEach((sector) => {
      const sectorFiles = sector.tracks.flatMap((track) => track.videos || [])

      // Проверяем что timeRanges сектора покрывают все файлы в нем
      const minStartTime = Math.min(...sectorFiles.map((f) => f.startTime || 0))
      const maxEndTime = Math.max(
        ...sectorFiles.map((f) => (f.startTime || 0) + (f.probeData.format.duration || 0)),
      )

      expect(sector.timeRanges[0].start).toBe(minStartTime)
      expect(sector.timeRanges[0].end).toBe(maxEndTime)
    })
  })

  // Оставляем базовые тесты для простых случаев
  it("should create sectors and tracks from video files", () => {
    const files = [mockVideoFile("video1.mp4", 1000, 100), mockVideoFile("video2.mp4", 1200, 100)]

    const sectors = createTracksFromFiles(files)

    expect(sectors).toHaveLength(1)
    expect(sectors[0].tracks).toHaveLength(2)
    expect(sectors[0].timeRanges).toBeDefined()
    expect(sectors[0].tracks[0].type).toBe("video")
    expect(sectors[0].tracks[0].startTime).toBe(1000)
    expect(sectors[0].tracks[0].endTime).toBe(1100)
  })

  it("should handle existing tracks when creating new ones", () => {
    const existingTracks = [
      {
        id: "existing-track",
        type: "video" as const,
        index: 1,
        videos: [mockVideoFile("existing.mp4", 1000, 100)],
      },
    ]

    const newFiles = [mockVideoFile("new_video.mp4", 1200, 100)]

    const sectors = createTracksFromFiles(newFiles, existingTracks)

    expect(sectors).toHaveLength(1)
    expect(sectors[0].tracks[0].index).toBeGreaterThan(1)
  })
})

describe("getGroupedFiles", () => {
  it("should group files by base name", () => {
    const files = [
      { name: "scene_1.mp4" },
      { name: "scene_2.mp4" },
      { name: "other_1.mp4" },
    ] as MediaFile[]

    const grouped = getGroupedFiles(files)

    expect(Object.keys(grouped)).toHaveLength(2)
    expect(grouped["scene"]).toHaveLength(2)
    expect(grouped["other"]).toHaveLength(1)
  })

  it("should sort files within groups by startTime", () => {
    const files = [
      { name: "scene_1.mp4", startTime: 200 },
      { name: "scene_2.mp4", startTime: 100 },
    ] as MediaFile[]

    const grouped = getGroupedFiles(files)

    expect(grouped["scene"][0].startTime).toBe(100)
    expect(grouped["scene"][1].startTime).toBe(200)
  })
})
