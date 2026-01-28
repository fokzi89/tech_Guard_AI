import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{ reportId: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
    try {
        const { reportId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: report, error } = await supabase
            .from('service_reports')
            .select('*')
            .eq('id', reportId)
            .single();

        if (error || !report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        return NextResponse.json(report);

    } catch (error) {
        console.error('Error fetching report:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
