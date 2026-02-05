/**
 * User notification preferences
 */
export interface UserPreferences {
  id: string
  user_id: string
  email_notifications: boolean
  email_safety_alerts: boolean
  email_report_ready: boolean
  email_session_summary: boolean
  in_app_notifications: boolean
  in_app_safety_alerts: boolean
  admin_new_user_alerts: boolean
  admin_safety_incident_alerts: boolean
  created_at: string
  updated_at: string
}

/**
 * Profile update payload
 */
export interface ProfileUpdate {
  full_name: string
}

/**
 * Password change payload
 */
export interface PasswordChange {
  newPassword: string
  confirmPassword: string
}

/**
 * Organization update payload
 */
export interface OrganizationUpdate {
  name: string
}

/**
 * Account deletion request payload
 */
export interface AccountDeletionRequest {
  confirmationText: string
  password: string
}

/**
 * User session information
 */
export interface UserSession {
  id: string
  device: string
  lastActivity: string
  isCurrent: boolean
}

/**
 * Soft delete information
 */
export interface SoftDeleteInfo {
  deleted_at: string | null
  delete_requested_at: string | null
  delete_requested_by: string | null
}
