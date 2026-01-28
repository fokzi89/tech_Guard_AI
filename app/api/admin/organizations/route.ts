import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Verify Super Admin
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role !== 'super_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // List Organizations
        // Admin can see all per RLS "super_admin_all_organizations"
        const { data: orgs, error } = await supabase
            .from('organizations')
            .select(`
            *,
            profiles(count)
        `) // Count users if possible? profiles(count) is pseudo syntax. 
            // Standard `select('*, profiles(count)')` works if referenced relations exist.
            // Profiles reference orgs. So `profiles!org_id`.
            // Let's stick to simple select first.
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(orgs);

    } catch (error) {
        console.error('Error listing organizations:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
