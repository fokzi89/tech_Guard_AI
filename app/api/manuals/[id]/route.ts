import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

/**
 * GET /api/manuals/[id]
 * Retrieve a specific manual by ID
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Get the manual (RLS will apply)
        const { data: manual, error } = await supabase
            .from('manuals')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('[Get Manual] Error:', error);
            return NextResponse.json({ error: 'Manual not found' }, { status: 404 });
        }

        return NextResponse.json(manual);

    } catch (error: any) {
        console.error('[Get Manual] Exception:', error);
        return NextResponse.json({ error: error?.message || 'Error' }, { status: 500 });
    }
}

/**
 * DELETE /api/manuals/[id]
 * Delete a manual (actually deletes all chunks with the same title)
 * Also deletes associated safety blacklist entries
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify role (Org Admin or Super Admin)
        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id, role')
            .eq('id', user.id)
            .single<{ org_id: string | null; role: string }>();

        if (!profile || (profile.role !== 'org_admin' && profile.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Forbidden: Admin role required' }, { status: 403 });
        }

        const { id } = await params;

        // First, get the manual to find its title and org_id
        const { data: manual, error: fetchError } = await supabase
            .from('manuals')
            .select('title, org_id, machine_model')
            .eq('id', id)
            .single<{ title: string; org_id: string | null; machine_model: string }>();

        if (fetchError || !manual) {
            return NextResponse.json({ error: 'Manual not found' }, { status: 404 });
        }

        // Verify ownership (org_id must match or user must be super_admin)
        if (profile.role !== 'super_admin' && manual.org_id !== profile.org_id) {
            return NextResponse.json({ error: 'Forbidden: Cannot delete manuals from other organizations' }, { status: 403 });
        }

        // Use admin client for deletion (to ensure we can delete all related records)
        const adminSupabase = createAdminClient();

        // Delete all chunks with the same title and org_id
        // Note: safety_blacklist entries will be cascade deleted due to foreign key constraint
        const { error: deleteError } = manual.org_id
            ? await adminSupabase
                .from('manuals')
                .delete()
                .eq('title', manual.title)
                .eq('org_id', manual.org_id)
            : await adminSupabase
                .from('manuals')
                .delete()
                .eq('title', manual.title)
                .is('org_id', null);

        if (deleteError) {
            console.error('[Delete Manual] Error deleting manual chunks:', deleteError);
            return NextResponse.json({ error: 'Failed to delete manual' }, { status: 500 });
        }

        console.log('[Delete Manual] Successfully deleted manual:', manual.title);

        return NextResponse.json({
            success: true,
            message: 'Manual and associated safety rules deleted successfully'
        });

    } catch (error: any) {
        console.error('[Delete Manual] Exception:', error);
        return NextResponse.json({ error: error?.message || 'Error' }, { status: 500 });
    }
}

/**
 * PATCH /api/manuals/[id]
 * Update manual status (activate/archive)
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify role (Org Admin or Super Admin)
        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id, role')
            .eq('id', user.id)
            .single<{ org_id: string | null; role: string }>();

        if (!profile || (profile.role !== 'org_admin' && profile.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Forbidden: Admin role required' }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const { status } = body;

        if (!status || !['active', 'archived'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status. Must be "active" or "archived"' }, { status: 400 });
        }

        // Get the manual first to check ownership
        const { data: manual, error: fetchError } = await supabase
            .from('manuals')
            .select('title, org_id')
            .eq('id', id)
            .single<{ title: string; org_id: string | null }>();

        if (fetchError || !manual) {
            return NextResponse.json({ error: 'Manual not found' }, { status: 404 });
        }

        // Verify ownership
        if (profile.role !== 'super_admin' && manual.org_id !== profile.org_id) {
            return NextResponse.json({ error: 'Forbidden: Cannot update manuals from other organizations' }, { status: 403 });
        }

        const adminSupabase = createAdminClient();

        // Update all chunks with the same title
        const { error: updateError } = manual.org_id
            ? await adminSupabase
                .from('manuals')
                // @ts-ignore - TypeScript inference issue with Supabase types
                .update({ status, updated_at: new Date().toISOString() })
                .eq('title', manual.title)
                .eq('org_id', manual.org_id)
            : await adminSupabase
                .from('manuals')
                // @ts-ignore - TypeScript inference issue with Supabase types
                .update({ status, updated_at: new Date().toISOString() })
                .eq('title', manual.title)
                .is('org_id', null);

        if (updateError) {
            console.error('[Update Manual] Error:', updateError);
            return NextResponse.json({ error: 'Failed to update manual status' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Manual ${status === 'active' ? 'activated' : 'archived'} successfully`
        });

    } catch (error: any) {
        console.error('[Update Manual] Exception:', error);
        return NextResponse.json({ error: error?.message || 'Error' }, { status: 500 });
    }
}
