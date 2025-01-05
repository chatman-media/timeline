interface TransitionRequest {
  sourceVideo: string
  targetVideo: string
  transitionId: string
  customParams?: Record<string, any>
}

interface TransitionResponse {
  status: "success" | "error"
  outputPath?: string
  error?: string
}

export async function generateTransition(params: TransitionRequest): Promise<TransitionResponse> {
  const response = await fetch("/api/transitions/generate", {
    method: "POST",
    body: JSON.stringify(params),
  })
  return response.json()
}
