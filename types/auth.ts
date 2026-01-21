export type UserRole = 'super_admin' | 'org_admin' | 'technician'

export type SubscriptionTier = 'basic' | 'professional' | 'enterprise'

export type OrganizationStatus = 'active' | 'suspended'

export interface Organization {
    id: string
    name: string
    status: OrganizationStatus
    subscription_tier: SubscriptionTier
    created_at: string
    updated_at: string
}

export interface Profile {
    id: string
    org_id: string | null
    role: UserRole
    full_name: string
    created_at: string
    updated_at: string
}

export interface InviteToken {
    id: string
    org_id: string
    role: UserRole
    email: string
    token: string
    expires_at: string
    used: boolean
    created_by: string
    created_at: string
}

export interface AuthUser {
    id: string
    email: string
    profile: Profile
    organization?: Organization
}
