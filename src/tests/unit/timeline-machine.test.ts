import { createModel } from "@xstate/test"
import { describe, expect, it } from "vitest"

import { timelineMachine } from "@/timeline/services"

const model = createModel(timelineMachine).withEvents({
  PLAY: {
    exec: (service) => {
      service.send({ type: "PLAY" })
    },
  },
  PAUSE: {
    exec: (service) => {
      service.send({ type: "PAUSE" })
    },
  },
  LOAD_MEDIA: {
    exec: (service) => {
      service.send({
        type: "LOAD_MEDIA",
        media: {
          url: "test.mp4",
          duration: 100,
          type: "video",
          name: "Test Video",
        },
      })
    },
  },
  SEEK: {
    exec: (service) => {
      service.send({
        type: "SEEK",
        time: 50,
      })
    },
  },
  ERROR: {
    exec: (service) => {
      service.send({
        type: "ERROR",
        error: new Error("Test error"),
      })
    },
  },
})

describe("Timeline Machine", () => {
  const testPlans = model.getShortestPathPlans({
    filter: (state) => {
      // Фильтруем состояния, которые не должны быть достигнуты
      return !state.context.error
    },
  })

  testPlans.forEach((plan) => {
    describe(plan.description, () => {
      plan.paths.forEach((path) => {
        it(path.description, async () => {
          const service = path.test({
            events: {
              PLAY: () => {
                expect(service.getSnapshot().value).toBe("playing")
              },
              PAUSE: () => {
                expect(service.getSnapshot().value).toBe("paused")
              },
              LOAD_MEDIA: () => {
                expect(service.getSnapshot().context.media).toBeDefined()
                expect(service.getSnapshot().context.media?.url).toBe("test.mp4")
              },
              SEEK: () => {
                expect(service.getSnapshot().context.currentTime).toBe(50)
              },
              ERROR: () => {
                expect(service.getSnapshot().value).toBe("error")
                expect(service.getSnapshot().context.error).toBeDefined()
              },
            },
          })
        })
      })
    })
  })

  it("should cover all states", () => {
    return model.testCoverage()
  })
})
