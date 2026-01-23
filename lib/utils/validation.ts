import { z } from 'zod'

/**
 * Common Validation Schemas
 */

// Email validation
export const emailSchema = z.string().email('Invalid email address')

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID')

// Pagination schemas
export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
})

// Date range schema
export const dateRangeSchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
})

/**
 * User & Auth Schemas
 */

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const registerSchema = z.object({
    email: emailSchema,
    password: z.string().min(8, 'Password must be at least 8 characters'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
})

export const inviteSchema = z.object({
    orgId: uuidSchema,
    email: emailSchema,
    role: z.enum(['org_admin', 'technician']),
    expiresInDays: z.number().int().positive().max(30).default(7),
})

/**
 * Organization Schemas
 */

export const createOrganizationSchema = z.object({
    name: z.string().min(2, 'Organization name must be at least 2 characters'),
    subscriptionTier: z.enum(['basic', 'professional', 'enterprise']).default('basic'),
})

export const updateOrganizationSchema = z.object({
    name: z.string().min(2).optional(),
    status: z.enum(['active', 'suspended']).optional(),
    subscriptionTier: z.enum(['basic', 'professional', 'enterprise']).optional(),
})

/**
 * Manual Schemas
 */

export const uploadManualSchema = z.object({
    title: z.string().min(2, 'Title must be at least 2 characters'),
    machineModel: z.string().min(2, 'Machine model is required'),
    version: z.string().optional().default('1.0'),
})

export const searchManualsSchema = z.object({
    query: z.string().min(1, 'Search query is required'),
    orgId: uuidSchema.optional(),
    limit: z.coerce.number().int().positive().max(50).default(5),
})

/**
 * Incident/Session Schemas
 */

export const createIncidentSchema = z.object({
    machineModel: z.string().min(2, 'Machine model is required'),
    externalTicketId: z.string().optional(),
})

export const updateIncidentSchema = z.object({
    status: z.enum(['open', 'resolved', 'abandoned']),
    resolvedAt: z.string().datetime().optional(),
})

/**
 * Chat Message Schema
 */

export const chatMessageSchema = z.object({
    incidentId: uuidSchema,
    content: z.string().min(1, 'Message content is required'),
    photoUrl: z.string().url().optional(),
})

/**
 * Validation Helper Functions
 */

/**
 * Validate request body against a Zod schema
 */
export async function validateRequest<T>(
    request: Request,
    schema: z.ZodSchema<T>
): Promise<T> {
    try {
        const body = await request.json()
        return schema.parse(body)
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new Error(`Validation failed: ${error.issues.map(e => e.message).join(', ')}`)
        }
        throw error
    }
}

/**
 * Validate URL search params against a Zod schema
 */
export function validateSearchParams<T>(
    searchParams: URLSearchParams,
    schema: z.ZodSchema<T>
): T {
    const params = Object.fromEntries(searchParams.entries())
    return schema.parse(params)
}

/**
 * Type-safe validation that returns result object
 */
export function safeValidate<T>(
    data: unknown,
    schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: z.ZodError } {
    const result = schema.safeParse(data)
    if (result.success) {
        return { success: true, data: result.data }
    }
    return { success: false, error: result.error }
}
