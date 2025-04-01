import { NextResponse } from "next/server"

import { generateTransition } from "@/server/transitions"
import { transitions } from "@/types/transitions"

export async function POST(request: Request) {
  try {
    const { sourceVideo, targetVideo, transitionId, customParams } = await request.json()

    // Находим переход по ID
    const transition = transitions.find((t) => t.id === transitionId)
    if (!transition) {
      return NextResponse.json(
        {
          status: "error",
          error: "Transition not found",
        },
        { status: 404 },
      )
    }

    // Генерируем переход
    const result = await generateTransition(
      sourceVideo,
      targetVideo,
      transition,
      customParams || {},
    )

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error?.message,
      },
      { status: 500 },
    )
  }
}
