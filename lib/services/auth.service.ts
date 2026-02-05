import { createClient } from '@/lib/supabase/client'
import type { AuthUser, UserRole, Profile } from '@/types/auth'

export class AuthService {
    private supabase = createClient()

    /**
     * Super Admin Registration - REMOVED
     * Use server action registerSuperAdmin() from @/lib/actions/auth.actions instead
     * This ensures proper security and admin client usage
     */

    /**
     * Create Organization - Super admin only
     */
    async createOrganization(name: string, subscriptionTier: 'basic' | 'professional' | 'enterprise' = 'basic') {
        try {
            const { data, error } = await this.supabase
                .from('organizations')
                .insert({
                    name,
                    subscription_tier: subscriptionTier,
                    status: 'active',
                } as any)
                .select()
                .single()

            if (error) throw error

            return { success: true, organization: data }
        } catch (error) {
            console.error('Organization creation error:', error)
            return { success: false, error: error instanceof Error ? error.message : 'Organization creation failed' }
        }
    }

    /**
     * Generate Invite Token - Super admin or org admin
     */
    async generateInviteToken(
        orgId: string,
        email: string,
        role: 'org_admin' | 'technician',
        expiresInDays: number = 7
    ) {
        try {
            // Get current user
            const { data: { user } } = await this.supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Generate a secure random token
            const token = crypto.randomUUID() + '-' + Date.now().toString(36)

            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + expiresInDays)

            const { data, error } = await this.supabase
                .from('invite_tokens')
                .insert({
                    org_id: orgId,
                    email,
                    role,
                    token,
                    expires_at: expiresAt.toISOString(),
                    created_by: user.id,
                } as any)
                .select()
                .single()

            if (error) throw error

            // Generate invite link
            const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`

            return { success: true, inviteToken: data, inviteLink }
        } catch (error) {
            console.error('Invite token generation error:', error)
            return { success: false, error: error instanceof Error ? error.message : 'Invite generation failed' }
        }
    }

    /**
     * Verify Invite Token
     */
    async verifyInviteToken(token: string) {
        try {
            const { data, error } = await this.supabase
                .from('invite_tokens')
                .select(`
          *,
          organization:organizations!invite_tokens_org_id_fkey(*)
        `)
                .eq('token', token)
                .eq('used', false)
                .gt('expires_at', new Date().toISOString())
                .single()

            if (error) throw error
            if (!data) throw new Error('Invalid or expired invite token')

            return { success: true, invite: data }
        } catch (error) {
            console.error('Invite verification error:', error)
            return { success: false, error: error instanceof Error ? error.message : 'Invalid invite token' }
        }
    }

    /**
     * Register with Invite Token - REMOVED
     * Use server action registerWithInvite() from @/lib/actions/auth.actions instead
     * This ensures proper security and admin client usage
     */

    /**
     * Sign In
     */
    async signIn(email: string, password: string) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            return { success: true, user: data.user, session: data.session }
        } catch (error) {
            console.error('Sign in error:', error)
            return { success: false, error: error instanceof Error ? error.message : 'Sign in failed' }
        }
    }

    /**
     * Sign Out
     */
    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut()
            if (error) throw error

            return { success: true }
        } catch (error) {
            console.error('Sign out error:', error)
            return { success: false, error: error instanceof Error ? error.message : 'Sign out failed' }
        }
    }

    /**
     * Get Current User with Profile
     */
    async getCurrentUser(): Promise<AuthUser | null> {
        try {
            const { data: { user } } = await this.supabase.auth.getUser()
            if (!user) return null

            const { data: profileData, error } = await this.supabase
                .from('profiles')
                .select(`
          *,
          organization:organizations!profiles_org_id_fkey(*)
        `)
                .eq('id', user.id)
                .maybeSingle()

            if (error) {
                console.error('Profile fetch error:', error)
                return null
            }

            if (!profileData) return null
            const profile = profileData as any;

            return {
                id: user.id,
                email: user.email!,
                profile: profile as Profile,
                organization: profile.organization || undefined,
            }
        } catch (error) {
            console.error('Get current user error:', error)
            return null
        }
    }

    /**
     * Get All Organizations - Super admin only
     */
    async getAllOrganizations() {
        try {
            const { data, error } = await this.supabase
                .from('organizations')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            return { success: true, organizations: data }
        } catch (error) {
            console.error('Get organizations error:', error)
            return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch organizations' }
        }
    }

    /**
     * Get Organization Users - Super admin or org admin
     */
    async getOrganizationUsers(orgId: string) {
        try {
            const { data, error } = await this.supabase
                .from('profiles')
                .select('*')
                .eq('org_id', orgId)
                .order('created_at', { ascending: false })

            if (error) throw error

            return { success: true, users: data }
        } catch (error) {
            console.error('Get organization users error:', error)
            return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch users' }
        }
    }

    /**
     * Get Pending Invites for Organization
     */
    async getPendingInvites(orgId: string) {
        try {
            const { data, error } = await this.supabase
                .from('invite_tokens')
                .select('*')
                .eq('org_id', orgId)
                .eq('used', false)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false })

            if (error) throw error

            return { success: true, invites: data }
        } catch (error) {
            console.error('Get pending invites error:', error)
            return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch invites' }
        }
    }

    /**
     * Request Password Reset - Send password reset email
     */
    async requestPasswordReset(email: string) {
        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
            })

            if (error) throw error

            return { success: true }
        } catch (error) {
            console.error('Password reset request error:', error)
            return { success: false, error: error instanceof Error ? error.message : 'Password reset request failed' }
        }
    }

    /**
     * Reset Password - Update user password after clicking email link
     */
    async resetPassword(newPassword: string) {
        try {
            const { error } = await this.supabase.auth.updateUser({
                password: newPassword,
            })

            if (error) throw error

            return { success: true }
        } catch (error) {
            console.error('Password reset error:', error)
            return { success: false, error: error instanceof Error ? error.message : 'Password reset failed' }
        }
    }
}

// Export singleton instance
export const authService = new AuthService()
