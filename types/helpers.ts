import { Database } from './database'

/**
 * Type aliases for database tables
 * 
 * These helpers provide convenient access to table types without
 * having to write the full Database['public']['Tables'][...] path.
 */

// ============================================================================
// TABLE ROW TYPES (data returned from SELECT queries)
// ============================================================================

export type Organization = Database['public']['Tables']['organizations']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Incident = Database['public']['Tables']['incidents']['Row']
export type Manual = Database['public']['Tables']['manuals']['Row']
export type SafetyBlacklist = Database['public']['Tables']['safety_blacklist']['Row']
export type ConversationMessage = Database['public']['Tables']['conversation_messages']['Row']
export type ServiceReport = Database['public']['Tables']['service_reports']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']
export type Visitor = Database['public']['Tables']['visitor']['Row']

// ============================================================================
// TABLE INSERT TYPES (data for INSERT operations)
// ============================================================================

export type OrganizationInsert = Database['public']['Tables']['organizations']['Insert']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type IncidentInsert = Database['public']['Tables']['incidents']['Insert']
export type ManualInsert = Database['public']['Tables']['manuals']['Insert']
export type SafetyBlacklistInsert = Database['public']['Tables']['safety_blacklist']['Insert']
export type ConversationMessageInsert = Database['public']['Tables']['conversation_messages']['Insert']
export type ServiceReportInsert = Database['public']['Tables']['service_reports']['Insert']
export type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert']
export type VisitorInsert = Database['public']['Tables']['visitor']['Insert']

// ============================================================================
// TABLE UPDATE TYPES (data for UPDATE operations)
// ============================================================================

export type OrganizationUpdate = Database['public']['Tables']['organizations']['Update']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type IncidentUpdate = Database['public']['Tables']['incidents']['Update']
export type ManualUpdate = Database['public']['Tables']['manuals']['Update']
export type SafetyBlacklistUpdate = Database['public']['Tables']['safety_blacklist']['Update']
export type ConversationMessageUpdate = Database['public']['Tables']['conversation_messages']['Update']
export type ServiceReportUpdate = Database['public']['Tables']['service_reports']['Update']
export type AuditLogUpdate = Database['public']['Tables']['audit_logs']['Update']
export type VisitorUpdate = Database['public']['Tables']['visitor']['Update']

// ============================================================================
// JOINED/COMPOSITE TYPES (for queries with relationships)
// ============================================================================

/**
 * Profile with organization data joined
 * Used in getCurrentUser and similar queries
 */
export type ProfileWithOrganization = Profile & {
    organization: Organization | null
}

/**
 * Incident with related messages
 * Used in troubleshooting session pages
 */
export type IncidentWithMessages = Incident & {
    messages: ConversationMessage[]
}

/**
 * Incident with full details (messages and user profile)
 */
export type IncidentWithDetails = Incident & {
    messages: ConversationMessage[]
    profile: Profile
}

// ============================================================================
// RPC FUNCTION TYPES
// ============================================================================

export type CheckSafetyBlacklistArgs = Database['public']['Functions']['check_safety_blacklist']['Args']
export type CheckSafetyBlacklistResult = Database['public']['Functions']['check_safety_blacklist']['Returns'][number]

export type SearchManualsArgs = Database['public']['Functions']['search_manuals']['Args']
export type SearchManualsResult = Database['public']['Functions']['search_manuals']['Returns'][number]

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extract the JSON type for type-safe JSON column handling
 */
export type Json = Database['public']['Tables']['audit_logs']['Row']['details']

/**
 * Role types for authorization
 */
export type UserRole = Profile['role']

/**
 * Status types
 */
export type IncidentStatus = Incident['status']
export type OrganizationStatus = Organization['status']
export type ManualStatus = Manual['status']
export type SafetySeverity = SafetyBlacklist['severity']
