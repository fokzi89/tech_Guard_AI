import { z } from 'zod'

/**
 * Validation schema for profile updates
 */
export const profileUpdateSchema = z.object({
  full_name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
})

/**
 * Validation schema for password changes
 * Requires strong password with:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export const passwordChangeSchema = z.object({
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

/**
 * Validation schema for organization updates
 * Allows alphanumeric characters, spaces, hyphens, underscores, periods, and ampersands
 */
export const organizationUpdateSchema = z.object({
  name: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_.&]+$/, 'Organization name contains invalid characters')
    .trim(),
})

/**
 * Validation schema for account deletion requests
 * Requires explicit confirmation text and password
 */
export const accountDeletionSchema = z.object({
  confirmationText: z.literal('DELETE MY ACCOUNT'),
  password: z.string().min(1, 'Password is required for confirmation'),
}).refine(data => data.confirmationText === 'DELETE MY ACCOUNT', {
  message: 'You must type "DELETE MY ACCOUNT" to confirm',
  path: ['confirmationText'],
})

/**
 * Validation schema for user preferences updates
 * All fields are optional booleans
 */
export const userPreferencesSchema = z.object({
  email_notifications: z.boolean().optional(),
  email_safety_alerts: z.boolean().optional(),
  email_report_ready: z.boolean().optional(),
  email_session_summary: z.boolean().optional(),
  in_app_notifications: z.boolean().optional(),
  in_app_safety_alerts: z.boolean().optional(),
  admin_new_user_alerts: z.boolean().optional(),
  admin_safety_incident_alerts: z.boolean().optional(),
})
