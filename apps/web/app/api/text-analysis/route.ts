import { createResponse, createErrorResponse } from "@repo/ui/lib/api"

export async function POST() {
  try {
    const response: {
      id: string
      timestamp: string
      result: boolean
    } = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      result: false,
    }

    return createResponse(response)
  } catch (error) {
    return createErrorResponse(error as Error)
  }
}
