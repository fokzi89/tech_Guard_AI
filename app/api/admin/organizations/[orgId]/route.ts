import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const updateSchema = z.object({
    status: z.enum(['active', 'suspended'])
});

interface RouteParams {
    params: Promise<{ orgId: string }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
    try {
        const { orgId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Verify Super Admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single<{ role: string }>();
        if (profile?.role !== 'super_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const json = await req.json();
        const { status } = updateSchema.parse(json);

        // Update
        const { data, error } = await supabase
            .from('organizations')
            // @ts-ignore - TypeScript inference issue with Supabase types
            .update({ status })
            .eq('id', orgId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);

    } catch (error) {
        console.error('Error updating org:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
