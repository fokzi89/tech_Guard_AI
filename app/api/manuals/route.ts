import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    // This file acts as a placeholder or handler if we have other methods.
    // T094/095 are [manualId]. This is manual root.
    // We can use this for LISTING manuals (Distinct titles).
    // Not explicitly T093/94/95 but needed for UI.
    return NextResponse.json({ message: "Use specialized routes" });
}

export async function GET(req: Request) {
    console.log('[Manuals List] Fetching manuals...');
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.error('[Manuals List] No user found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[Manuals List] User ID:', user.id);

        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id, role')
            .eq('id', user.id)
            .single<{ org_id: string | null; role: string }>();
        if (!profile?.org_id) {
            console.error('[Manuals List] No org_id for user');
            return NextResponse.json({ error: 'No Org' }, { status: 403 });
        }

        console.log('[Manuals List] Org ID:', profile.org_id, 'Role:', profile.role);

        // Select distinct manuals
        // Supabase doesn't easily support SELECT DISTINCT ON via helper unless we use rpc or raw query.
        // Or we just select id, title, machine_model created_at and filter in code (assuming reasonable count).
        // Since we store chunks, we have MANY rows per manual.
        // Strategy: We really should have a manuals metadata table.
        // Workaround for MVP:
        // Use an RPC function `list_org_manuals` that does DISTINCT ON (title).
        // Or just return all and frontend dedupes? No, too much data.

        // Let's create an RPC or just assume we handle it.
        // I will use a simple query limiting to 100 rows and hope for the best for MVP?
        // No, that's bad.
        // I'll implementation logic: SELECT DISTINCT title, machine_model, org_id FROM manuals WHERE org_id = ...
        // Supabase JS client: .select('title, machine_model').eq('org_id', orgId).csv()? 

        // Better: I'll stick to T094/T095 and if UI needs list, I'll implement a proper aggregation query if possible.
        // Actually, T013 migration allows me to create new functions.
        // I don't want to create migration now if I can avoid it.

        // I will implement GET /api/manuals returning empty list for now, or just basic query.

        const { data, error } = await supabase
            .from('manuals')
            .select('id, title, machine_model, created_at, status, file_url')
            .eq('org_id', profile.org_id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .returns<Array<{ id: string; title: string; machine_model: string; created_at: string; status: string; file_url: string | null }>>();

        if (error) {
            console.error('[Manuals List] Database error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log('[Manuals List] Found', data?.length || 0, 'manual chunks');

        // Client side dedupe by title
        if (data) {
            const unique = new Map();
            data.forEach(m => {
                if (!unique.has(m.title)) unique.set(m.title, m);
            });
            const result = Array.from(unique.values());
            console.log('[Manuals List] Returning', result.length, 'unique manuals');
            return NextResponse.json(result);
        }

        console.log('[Manuals List] No data found, returning empty array');
        return NextResponse.json([]);

    } catch (error: any) {
        console.error('[Manuals List] Exception:', error);
        return NextResponse.json({ error: error?.message || 'Error' }, { status: 500 });
    }
}
