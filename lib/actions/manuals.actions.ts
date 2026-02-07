"use server"

import { createClient } from "@/lib/supabase/server"

export interface Manual {
    id: string
    title: string
    machine_model: string | null
    storage_url: string
    created_at: string
    status: string
    file_name: string
}

export async function getOrgManuals(): Promise<{ data: Manual[] | null, error: string | null }> {
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { data: null, error: "Unauthorized" }
        }

        const { data: profileData } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', user.id)
            .single()

        const profile = profileData as { org_id: string } | null;

        if (!profile?.org_id) {
            return { data: null, error: "No organization found" }
        }

        const { data, error } = await supabase
            .from('org_manuals')
            .select('id, title, machine_model, storage_url, created_at, status, file_name')
            .eq('org_id', profile.org_id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching manuals:', error)
            return { data: null, error: "Failed to fetch manuals" }
        }

        return { data: data as Manual[], error: null }
    } catch (error) {
        console.error('Unexpected error:', error)
        return { data: null, error: "Unexpected error occurred" }
    }
}
