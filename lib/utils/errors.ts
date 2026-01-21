/**
 * Custom API Error Classes
 */
export class ApiError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public code?: string
    ) {
        super(message)
        this.name = 'ApiError'
    }
}

export class BadRequestError extends ApiError {
    constructor(message: string = 'Bad Request', code?: string) {
        super(400, message, code)
        this.name = 'BadRequestError'
    }
}

export class UnauthorizedError extends ApiError {
    constructor(message: string = 'Unauthorized', code?: string) {
        super(401, message, code)
        this.name = 'UnauthorizedError'
    }
}

export class ForbiddenError extends ApiError {
    constructor(message: string = 'Forbidden', code?: string) {
        super(403, message, code)
        this.name = 'ForbiddenError'
    }
}

export class NotFoundError extends ApiError {
    constructor(message: string = 'Not Found', code?: string) {
        super(404, message, code)
        this.name = 'NotFoundError'
    }
}

export class ConflictError extends ApiError {
    constructor(message: string = 'Conflict', code?: string) {
        super(409, message, code)
        this.name = 'ConflictError'
    }
}

export class ValidationError extends ApiError {
    constructor(message: string = 'Validation Failed', code?: string) {
        super(422, message, code)
        this.name = 'ValidationError'
    }
}

export class InternalServerError extends ApiError {
    constructor(message: string = 'Internal Server Error', code?: string) {
        super(500, message, code)
        this.name = 'InternalServerError'
    }
}

/**
 * Error Response Type
 */
export interface ErrorResponse {
    error: {
        message: string
        code?: string
        statusCode: number
    }
}

/**
 * Handle API errors and return consistent error responses
 */
export function handleApiError(error: unknown): ErrorResponse {
    // Log error for debugging
    console.error('API Error:', error)

    // Handle known API errors
    if (error instanceof ApiError) {
        return {
            error: {
                message: error.message,
                code: error.code,
                statusCode: error.statusCode,
            },
        }
    }

    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
        return {
            error: {
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                statusCode: 422,
            },
        }
    }

    // Handle unknown errors
    return {
        error: {
            message: 'An unexpected error occurred',
            code: 'INTERNAL_ERROR',
            statusCode: 500,
        },
    }
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
    statusCode: number,
    message: string,
    code?: string
): Response {
    return Response.json(
        {
            error: {
                message,
                code,
                statusCode,
            },
        },
        { status: statusCode }
    )
}
