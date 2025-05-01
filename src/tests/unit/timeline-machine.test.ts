import { beforeEach, describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"

import { timelineMachine } from "@/timeline/services"
import { MediaFile } from "@/types/media"
import { Track } from "@/types/media"

// Мок для localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
  length: 0,
  key: vi.fn(),
}

Object.defineProperty(window, "localStorage", { value: localStorageMock })

describe("Timeline Machine", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should start in idle state with initial context", () => {
    const actor = createActor(timelineMachine)
    actor.start()

    expect(actor.getSnapshot().value).toBe("idle")
    expect(actor.getSnapshot().context.previousStates).toEqual([])
    expect(actor.getSnapshot().context.currentStateIndex).toBe(-1)
    expect(actor.getSnapshot().context.canUndo).toBe(false)
    expect(actor.getSnapshot().context.canRedo).toBe(false)
  })

  it("should transition to playing state on PLAY event", () => {
    const actor = createActor(timelineMachine)
    actor.start()

    actor.send({ type: "PLAY" })
    expect(actor.getSnapshot().value).toBe("playing")
  })

  it("should transition to paused state on PAUSE event", () => {
    const actor = createActor(timelineMachine)
    actor.start()

    actor.send({ type: "PLAY" })
    actor.send({ type: "PAUSE" })
    expect(actor.getSnapshot().value).toBe("paused")
  })

  describe("History Management", () => {
    it("should update zoom level and save history", () => {
      const actor = createActor(timelineMachine)
      actor.start()

      actor.send({ type: "ZOOM", level: 2 })
      const snapshot = actor.getSnapshot().context

      expect(snapshot.zoomLevel).toBe(2)
      expect(snapshot.isDirty).toBe(true)
      expect(snapshot.previousStates.length).toBe(1)
      expect(snapshot.currentStateIndex).toBe(0)
      expect(snapshot.canUndo).toBe(true)
      expect(snapshot.canRedo).toBe(false)
      expect(localStorage.setItem).toHaveBeenCalledWith("timeline-state", expect.any(String))
    })

    it("should handle multiple history states", () => {
      const actor = createActor(timelineMachine)
      actor.start()

      // Первое изменение
      actor.send({ type: "ZOOM", level: 2 })
      expect(actor.getSnapshot().context.previousStates.length).toBe(1)

      // Второе изменение
      actor.send({ type: "ZOOM", level: 3 })
      const snapshot = actor.getSnapshot().context

      expect(snapshot.previousStates.length).toBe(2)
      expect(snapshot.currentStateIndex).toBe(1)
      expect(snapshot.canUndo).toBe(true)
      expect(snapshot.canRedo).toBe(false)
    })

    it("should handle undo/redo correctly", () => {
      const actor = createActor(timelineMachine)
      actor.start()

      // Создаем историю
      actor.send({ type: "ZOOM", level: 2 })
      actor.send({ type: "ZOOM", level: 3 })

      // Отменяем
      actor.send({ type: "UNDO" })
      let snapshot = actor.getSnapshot().context
      expect(snapshot.zoomLevel).toBe(2)
      expect(snapshot.currentStateIndex).toBe(0)
      expect(snapshot.canUndo).toBe(true)
      expect(snapshot.canRedo).toBe(true)

      // Отменяем еще раз
      actor.send({ type: "UNDO" })
      snapshot = actor.getSnapshot().context
      expect(snapshot.zoomLevel).toBe(1)
      expect(snapshot.currentStateIndex).toBe(-1)
      expect(snapshot.canUndo).toBe(false)
      expect(snapshot.canRedo).toBe(true)

      // Повторяем
      actor.send({ type: "REDO" })
      snapshot = actor.getSnapshot().context
      expect(snapshot.zoomLevel).toBe(2)
      expect(snapshot.currentStateIndex).toBe(0)
      expect(snapshot.canUndo).toBe(true)
      expect(snapshot.canRedo).toBe(true)
    })

    it("should clear redo history on new action", () => {
      const actor = createActor(timelineMachine)
      actor.start()

      // Создаем историю и отменяем
      actor.send({ type: "ZOOM", level: 2 })
      actor.send({ type: "ZOOM", level: 3 })
      actor.send({ type: "UNDO" })

      // Делаем новое действие
      actor.send({ type: "ZOOM", level: 4 })
      const snapshot = actor.getSnapshot().context

      expect(snapshot.zoomLevel).toBe(4)
      expect(snapshot.previousStates.length).toBe(2)
      expect(snapshot.currentStateIndex).toBe(1)
      expect(snapshot.canUndo).toBe(true)
      expect(snapshot.canRedo).toBe(false)
    })
  })

  describe("Media Management", () => {
    const testFile: MediaFile = {
      id: "test-1",
      name: "test.mp4",
      path: "/test/test.mp4",
      isVideo: true,
      isAudio: false,
      isImage: false,
      size: 1000,
      duration: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    it("should add media files", () => {
      const actor = createActor(timelineMachine)
      actor.start()

      actor.send({ type: "ADD_MEDIA_FILES", files: [testFile] })
      const snapshot = actor.getSnapshot().context

      const hasSectorWithFile = snapshot.sectors.some((sector) =>
        sector.tracks.some((track) => track.id === testFile.id),
      )
      expect(hasSectorWithFile).toBe(true)
      expect(snapshot.isDirty).toBe(true)
      expect(localStorage.setItem).toHaveBeenCalledWith("timeline-state", expect.any(String))
    })

    it("should remove media files", () => {
      const actor = createActor(timelineMachine)
      actor.start()

      actor.send({ type: "ADD_MEDIA_FILES", files: [testFile] })
      actor.send({ type: "REMOVE_MEDIA_FILE", fileId: "test-1" })
      const snapshot = actor.getSnapshot().context

      const hasSectorWithFile = snapshot.sectors.some((sector) =>
        sector.tracks.some((track) => track.id === testFile.id),
      )
      expect(hasSectorWithFile).toBe(false)
      expect(snapshot.isDirty).toBe(true)
      expect(localStorage.setItem).toHaveBeenCalledWith("timeline-state", expect.any(String))
    })

    it("should update tracks", () => {
      const actor = createActor(timelineMachine)
      actor.start()

      const testTrack: Track = {
        id: "test-1",
        name: "Test Track",
        type: "video",
        index: 0,
      }

      actor.send({ type: "SET_TRACKS", tracks: [testTrack] })
      const snapshot = actor.getSnapshot().context

      expect(snapshot.tracks).toEqual([testTrack])
      expect(snapshot.isDirty).toBe(true)
      expect(localStorage.setItem).toHaveBeenCalledWith("timeline-state", expect.any(String))
    })

    it("should set active track", () => {
      const actor = createActor(timelineMachine)
      actor.start()

      actor.send({ type: "SET_ACTIVE_TRACK", trackId: "test-1" })
      expect(actor.getSnapshot().context.activeTrackId).toBe("test-1")
    })

    it("should set track volume and save to localStorage", () => {
      const actor = createActor(timelineMachine)
      actor.start()

      actor.send({ type: "SET_TRACK_VOLUME", trackId: "test-1", volume: 0.5 })
      const snapshot = actor.getSnapshot().context

      expect(snapshot.trackVolumes["test-1"]).toBe(0.5)
      expect(snapshot.isDirty).toBe(true)
      expect(localStorage.setItem).toHaveBeenCalledWith("timeline-state", expect.any(String))
    })

    it("should preload all videos", () => {
      const actor = createActor(timelineMachine)
      actor.start()

      // Имитируем наличие видео-рефов
      actor.send({ type: "SET_VIDEO_REF", fileId: "test-1", video: {} as HTMLVideoElement })
      actor.send({ type: "PRELOAD_ALL_VIDEOS" })

      expect(actor.getSnapshot().context.loadedVideos["test-1"]).toBe(true)
    })
  })

  describe("Time Range Management", () => {
    it("should set time ranges and save history", () => {
      const actor = createActor(timelineMachine)
      actor.start()

      const testRanges = {
        "test-1": [{ start: 0, end: 10 }],
      }

      actor.send({ type: "SET_TIME_RANGES", ranges: testRanges })
      const snapshot = actor.getSnapshot().context

      expect(snapshot.timeRanges).toEqual(testRanges)
      expect(snapshot.isDirty).toBe(true)
      expect(snapshot.previousStates.length).toBe(1)
      expect(snapshot.canUndo).toBe(true)
      expect(snapshot.canRedo).toBe(false)
      expect(localStorage.setItem).toHaveBeenCalledWith("timeline-state", expect.any(String))
    })
  })

  describe("State Persistence", () => {
    it("should persist and restore state", () => {
      const actor = createActor(timelineMachine)
      actor.start()

      const testState = {
        isDirty: true,
        zoomLevel: 2,
        timeRanges: { test: [{ start: 0, end: 10 }] },
        activeTrackId: "test-1",
        trackVolumes: { "test-1": 0.5 },
        isSeeking: false,
        isChangingCamera: false,
        tracks: [
          {
            id: "test-1",
            name: "Test Track",
            type: "video" as const,
            index: 0,
          },
        ],
        sectors: [
          {
            id: "test-1",
            name: "Test Sector",
            timeRanges: [],
            tracks: [
              {
                id: "test-1",
                name: "Test Track",
                type: "video" as const,
                index: 0,
              },
            ],
          },
        ],
        videoRefs: {},
        loadedVideos: {},
        previousStates: [],
        currentStateIndex: -1,
        canUndo: false,
        canRedo: false,
      }

      actor.send({ type: "RESTORE_STATE", state: testState })
      const snapshot = actor.getSnapshot().context

      expect(snapshot.zoomLevel).toBe(2)
      expect(snapshot.timeRanges).toEqual({ test: [{ start: 0, end: 10 }] })
      expect(snapshot.activeTrackId).toBe("test-1")
      expect(snapshot.trackVolumes["test-1"]).toBe(0.5)
      expect(snapshot.tracks).toEqual([
        {
          id: "test-1",
          name: "Test Track",
          type: "video",
          index: 0,
        },
      ])
      expect(snapshot.sectors).toEqual([
        {
          id: "test-1",
          name: "Test Sector",
          timeRanges: [],
          tracks: [
            {
              id: "test-1",
              name: "Test Track",
              type: "video",
              index: 0,
            },
          ],
        },
      ])
      expect(snapshot.previousStates).toEqual([])
      expect(snapshot.currentStateIndex).toBe(-1)
      expect(snapshot.canUndo).toBe(false)
      expect(snapshot.canRedo).toBe(false)
    })

    it("should persist state to localStorage", () => {
      const actor = createActor(timelineMachine)
      actor.start()

      actor.send({ type: "PERSIST_STATE" })

      expect(localStorage.setItem).toHaveBeenCalledWith("timeline-state", expect.any(String))
    })
  })
})
