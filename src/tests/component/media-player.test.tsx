import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { MediaPlayer } from "@/media-player"

describe("MediaPlayer", () => {
  it("should render play button", () => {
    render(<MediaPlayer />)
    expect(screen.getByRole("button", { name: /play/i })).toBeInTheDocument()
  })

  it("should handle play/pause", async () => {
    render(<MediaPlayer />)
    const playButton = screen.getByRole("button", { name: /play/i })

    fireEvent.click(playButton)
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument()
  })
})
