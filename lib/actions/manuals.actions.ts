"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

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

        // Generate signed URLs for each manual
        const adminSupabase = createAdminClient()
        console.log('[Manuals Action] Admin client created. Generating signed URLs...');

        const manualsWithSignedUrls = await Promise.all(
            (data as Manual[]).map(async (manual) => {
                if (manual.status === 'active' && manual.storage_url) {
                    // Log the path we're trying to sign
                    console.log(`[Manuals Action] Signing URL for: ${manual.storage_url}`);

                    const { data: signedUrlData, error: signError } = await adminSupabase
                        .storage
                        .from('manuals')
                        .createSignedUrl(manual.storage_url, 3600) // 1 hour expiry

                    if (signError) {
                        console.error('[Manuals Action] Error generating signed URL for manual:', manual.id, signError)
                    } else {
                        console.log(`[Manuals Action] Signed URL generated: ${signedUrlData?.signedUrl?.substring(0, 50)}...`);
                    }

                    if (signedUrlData?.signedUrl) {
                        return { ...manual, storage_url: signedUrlData.signedUrl }
                    }
                } else {
                    console.log(`[Manuals Action] Skipping signing for manual ${manual.id} (status: ${manual.status})`);
                }
                return manual
            })
        )

        return { data: manualsWithSignedUrls, error: null }
    } catch (error) {
        console.error('Unexpected error:', error)
        return { data: null, error: "Unexpected error occurred" }
    }
}
