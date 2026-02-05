import { createClient } from '@/lib/supabase/server';
import { searchManuals } from '@/lib/rag/search';
import { generateEmbedding } from '@/lib/rag/embeddings';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const searchSchema = z.object({
    query: z.string().min(1),
    limit: z.coerce.number().optional().default(5)
});

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get('query');
        const limit = searchParams.get('limit');

        // Validate
        const params = searchSchema.parse({ query, limit });

        // Get org_id
        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', user.id)
            .single<{ org_id: string | null }>();
        if (!profile?.org_id) {
            return NextResponse.json({ error: 'No Organization' }, { status: 403 });
        }

        // Embed Query
        const embedding = await generateEmbedding(params.query);

        // Search
        const results = await searchManuals(params.query, embedding, {
            orgId: profile.org_id,
            limit: params.limit,
            similarityThreshold: 0.7
        });

        return NextResponse.json(results);

    } catch (error) {
        console.error('Error searching manuals:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
