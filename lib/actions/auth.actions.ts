'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function registerSuperAdmin(email: string, password: string, fullName: string) {
    try {
        const adminClient = createAdminClient()

        // Create the auth user using admin client (auto-confirms email)
        const { data: authData, error: signUpError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                full_name: fullName,
            },
        })

        if (signUpError) throw signUpError
        if (!authData.user) throw new Error('User creation failed')

        // Create profile (bypasses RLS)
        const { error: profileError } = await adminClient
            .from('profiles')
            .insert({
                id: authData.user.id,
                org_id: null,
                role: 'super_admin',
                full_name: fullName,
            })

        if (profileError) {
            // If profile creation fails, try to delete the auth user
            await adminClient.auth.admin.deleteUser(authData.user.id)
            throw profileError
        }

        return { success: true, user: authData.user }
    } catch (error) {
        console.error('Super admin registration error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Registration failed'
        }
    }
}

export async function registerWithInvite(token: string, password: string, fullName: string) {
    try {
        const supabase = await createClient()
        const adminClient = createAdminClient()

        // Verify the invite token
        const { data: invite, error: inviteError } = await supabase
            .from('invite_tokens')
            .select('*')
            .eq('token', token)
            .eq('used', false)
            .gt('expires_at', new Date().toISOString())
            .single()

        if (inviteError || !invite) {
            throw new Error('Invalid or expired invite token')
        }

        // Create the auth user using admin client (auto-confirms email)
        const { data: authData, error: signUpError } = await adminClient.auth.admin.createUser({
            email: invite.email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                full_name: fullName,
            },
        })

        if (signUpError) throw signUpError
        if (!authData.user) throw new Error('User creation failed')

        // Use admin client to create profile (bypasses RLS)
        const { error: profileError } = await adminClient
            .from('profiles')
            .insert({
                id: authData.user.id,
                org_id: invite.org_id,
                role: invite.role,
                full_name: fullName,
            })

        if (profileError) {
            // If profile creation fails, try to delete the auth user
            await adminClient.auth.admin.deleteUser(authData.user.id)
            throw profileError
        }

        // Mark invite as used
        await adminClient
            .from('invite_tokens')
            .update({ used: true })
            .eq('token', token)

        return { success: true, user: authData.user }
    } catch (error) {
        console.error('Invite registration error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Registration failed'
        }
    }
}

export async function createOrganization(name: string, subscriptionTier: 'basic' | 'professional' | 'enterprise' = 'basic') {
    try {
        const adminClient = createAdminClient()

        const { data, error } = await adminClient
            .from('organizations')
            .insert({
                name,
                subscription_tier: subscriptionTier,
                status: 'active',
            })
            .select()
            .single()

        if (error) throw error

        return { success: true, organization: data }
    } catch (error) {
        console.error('Organization creation error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Organization creation failed'
        }
    }
}

export async function generateInviteToken(
    orgId: string,
    email: string,
    role: 'org_admin' | 'technician',
    expiresInDays: number = 7
) {
    try {
        const supabase = await createClient()
        const adminClient = createAdminClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        // Generate a secure random token
        const token = crypto.randomUUID() + '-' + Date.now().toString(36)

        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + expiresInDays)

        const { data, error } = await adminClient
            .from('invite_tokens')
            .insert({
                org_id: orgId,
                email,
                role,
                token,
                expires_at: expiresAt.toISOString(),
                created_by: user.id,
            })
            .select()
            .single()

        if (error) throw error

        // Generate invite link
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`

        return { success: true, inviteToken: data, inviteLink }
    } catch (error) {
        console.error('Invite token generation error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Invite generation failed'
        }
    }
}
