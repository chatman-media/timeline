export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

export type ApiResponse<T, E = unknown> =
  | { success: true; data: T; error?: never }
  | {
      success: false
      data?: never
      error: { code: string; message: string; details?: E }
    }

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export function createResponse<T>(data: T, status = HttpStatus.OK): Response {
  if (data === undefined || data === null) {
    throw new Error("Response data cannot be null or undefined")
  }

  const body: ApiResponse<T> = {
    success: true,
    data,
  }

  return Response.json(body, {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  })
}

export function createErrorResponse(error: Error | ApiError): Response {
  const apiError =
    error instanceof ApiError
      ? error
      : new ApiError(
          HttpStatus.INTERNAL_SERVER_ERROR,
          "INTERNAL_SERVER_ERROR",
          "An unexpected error occurred",
        )

  const body: ApiResponse<never> = {
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      details: apiError.details,
    },
  }

  return Response.json(body, {
    status: apiError.statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  })
}

export function isSuccessResponse<T, E>(
  response: ApiResponse<T, E>,
): response is ApiResponse<T, E> & { success: true } {
  return response.success === true
}

export async function parseApiResponse<T, E = unknown>(
  response: Response,
): Promise<ApiResponse<T, E>> {
  const data = await response.json()
  if (!response.ok) {
    const error = data.error || {
      code: "UNKNOWN_ERROR",
      message: "Unknown error occurred",
    }
    throw new ApiError(response.status, error.code, error.message, error.details)
  }
  return data as ApiResponse<T, E>
}
