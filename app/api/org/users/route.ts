import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get active user's org
        const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single();

        if (!profile?.org_id) {
            return NextResponse.json({ error: 'User not associated with an organization' }, { status: 403 });
        }

        // List users in this org
        // Note: 'profiles' table has RLS policy enabling users to see their own org members usually?
        // Let's assume T017 created appropriate RLS or we need to check.
        // If not, we might need admin client if we are an Org Admin listing users.
        // But safely, we should use the user's client to respect RLS.

        const { data: users, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('org_id', profile.org_id);

        if (error) throw error;

        return NextResponse.json(users);

    } catch (error) {
        console.error('Error listing users:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
