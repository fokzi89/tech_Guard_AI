import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{ manualId: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
    // Get single manual chunk? Or recompose?
    // Usually download original PDF.
    // manuals table has `file_url`.
    const { manualId } = await params;

    const supabase = await createClient();
    const { data, error } = await supabase.from('manuals').select('*').eq('id', manualId).single();
    if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(data);
}

export async function DELETE(req: Request, { params }: RouteParams) {
    const { manualId } = await params;

    // Deleting a "manual" when we have chunks...
    // The manualId passed here might be the ID of ONE chunk (from the list).
    // If we want to delete the WHOLE manual, we should delete by TITLE + ORG_ID?
    // Or we assume the UI passed an ID, and we look up that ID, get the title, and delete all with that title?

    const supabase = await createClient(); // Authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check privileges
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile || (profile.role !== 'org_admin' && profile.role !== 'super_admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the target chunk to identify the manual (Title/Model)
    const { data: targetChunk } = await supabase.from('manuals').select('title, org_id, file_url').eq('id', manualId).single();

    if (!targetChunk) return NextResponse.json({ error: 'Manual not found' }, { status: 404 });

    // Using Admin Client for full deletion privileges effectively
    const adminSupabase = createAdminClient();

    // Delete ALL chunks for this manual (by title + org_id)
    const { error: deleteError } = await adminSupabase
        .from('manuals')
        .delete()
        .eq('title', targetChunk.title)
        .eq('org_id', targetChunk.org_id); // Ensure we don't delete another org's manual with same title (RLS prevents it usually, but we use admin client here)

    if (deleteError) {
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }

    // Also delete file from storage if file_url exists?
    // We can parse the path from file_url.
    // Typically `.../manuals/orgId/filename.pdf`
    // TBD for now.

    return NextResponse.json({ success: true });
}
