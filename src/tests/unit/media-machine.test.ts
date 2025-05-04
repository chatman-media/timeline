import { beforeEach, describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"

import { mediaMachine } from "@/media-editor/browser/machines/media-machine"
import { MediaFile } from "@/types/media"

// Мок для fetch
global.fetch = vi.fn()

describe("Media Machine", () => {
  const mockMediaFile: MediaFile = {
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

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should start in idle state with empty context", () => {
    const actor = createActor(mediaMachine)
    actor.start()

    expect(actor.getSnapshot().value).toBe("idle")
    expect(actor.getSnapshot().context.allMediaFiles).toEqual([])
    expect(actor.getSnapshot().context.includedFiles).toEqual([])
    expect(actor.getSnapshot().context.error).toBeNull()
    expect(actor.getSnapshot().context.isLoading).toBe(false)
  })

  describe("Loading State", () => {
    it("should transition to loading state on FETCH_MEDIA", () => {
      const actor = createActor(mediaMachine)
      actor.start()

      actor.send({ type: "FETCH_MEDIA" })
      expect(actor.getSnapshot().value).toBe("loading")
      expect(actor.getSnapshot().context.isLoading).toBe(true)
    })

    it("should handle successful media fetch", () => {
      const actor = createActor(mediaMachine)
      actor.start()

      actor.send({ type: "FETCH_MEDIA" })
      actor.send({ type: "setAllMediaFiles", files: [mockMediaFile] })

      expect(actor.getSnapshot().context.allMediaFiles).toEqual([mockMediaFile])
      expect(actor.getSnapshot().context.isLoading).toBe(false)
    })

    it("should handle fetch error", () => {
      const actor = createActor(mediaMachine)
      actor.start()

      actor.send({ type: "FETCH_MEDIA" })
      actor.send({ type: "setLoading", loading: false })

      expect(actor.getSnapshot().context.isLoading).toBe(false)
    })
  })

  describe("Loaded State", () => {
    it("should include files", () => {
      const actor = createActor(mediaMachine)
      actor.start()

      actor.send({ type: "FETCH_MEDIA" })
      actor.send({ type: "setAllMediaFiles", files: [mockMediaFile] })
      actor.send({ type: "INCLUDE_FILES", files: [mockMediaFile] })

      expect(actor.getSnapshot().context.includedFiles).toEqual([mockMediaFile])
    })

    it("should remove file", () => {
      const actor = createActor(mediaMachine)
      actor.start()

      actor.send({ type: "FETCH_MEDIA" })
      actor.send({ type: "setAllMediaFiles", files: [mockMediaFile] })
      actor.send({ type: "INCLUDE_FILES", files: [mockMediaFile] })
      actor.send({ type: "REMOVE_FILE", path: mockMediaFile.path })

      expect(actor.getSnapshot().context.includedFiles).toEqual([])
    })

    it("should clear files", () => {
      const actor = createActor(mediaMachine)
      actor.start()

      actor.send({ type: "FETCH_MEDIA" })
      actor.send({ type: "setAllMediaFiles", files: [mockMediaFile] })
      actor.send({ type: "INCLUDE_FILES", files: [mockMediaFile] })
      actor.send({ type: "CLEAR_FILES" })

      expect(actor.getSnapshot().context.includedFiles).toEqual([])
    })

    it("should add media files", () => {
      const actor = createActor(mediaMachine)
      actor.start()

      actor.send({ type: "FETCH_MEDIA" })
      actor.send({ type: "addMediaFiles", files: [mockMediaFile] })

      expect(actor.getSnapshot().context.allMediaFiles).toEqual([mockMediaFile])
    })

    it("should remove media files", () => {
      const actor = createActor(mediaMachine)
      actor.start()

      actor.send({ type: "FETCH_MEDIA" })
      actor.send({ type: "setAllMediaFiles", files: [mockMediaFile] })
      actor.send({ type: "removeMediaFiles", files: [mockMediaFile] })

      expect(actor.getSnapshot().context.allMediaFiles).toEqual([])
    })

    it("should set unavailable files", () => {
      const actor = createActor(mediaMachine)
      actor.start()

      actor.send({ type: "FETCH_MEDIA" })
      actor.send({ type: "setUnavailableFiles", files: [mockMediaFile] })

      expect(actor.getSnapshot().context.unavailableFiles).toEqual([mockMediaFile])
    })
  })

  describe("Error State", () => {
    it("should allow retry from error state", () => {
      const actor = createActor(mediaMachine)
      actor.start()

      actor.send({ type: "FETCH_MEDIA" })
      actor.send({ type: "RELOAD" })

      expect(actor.getSnapshot().value).toBe("loading")
      expect(actor.getSnapshot().context.isLoading).toBe(true)
    })
  })
})
