'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getOrganizationMembers() {
    try {
        const supabase = await createClient()
        const adminClient = createAdminClient()

        // 1. Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        // 2. Get user's profile to find their Org ID
        // Using adminClient here ensures we can read the profile even if RLS is strict
        const { data: profileData } = await adminClient
            .from('profiles')
            .select('org_id, role')
            .eq('id', user.id)
            .single()

        const profile = profileData as any;

        if (!profile?.org_id) {
            return { success: false, error: 'No organization found' }
        }

        // 3. Fetch all members of this organization
        // Using adminClient to bypass RLS "view other members" restriction if needed
        const { data: members, error: membersError } = await adminClient
            .from('profiles')
            .select('id, full_name, email, role, created_at')
            .eq('org_id', profile.org_id)
            .order('created_at', { ascending: false })

        if (membersError) throw membersError

        // 4. Fetch Organization Name
        const { data: orgDataRaw } = await adminClient
            .from('organizations')
            .select('name')
            .eq('id', profile.org_id)
            .single()

        const orgData = orgDataRaw as any;

        return {
            success: true,
            members,
            orgName: orgData?.name,
            orgId: profile.org_id,
            currentUserRole: profile.role
        }

    } catch (error) {
        console.error('Error fetching members:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch members'
        }
    }
}
