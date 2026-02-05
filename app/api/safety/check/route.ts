import { createClient } from '@/lib/supabase/server';
import { guardianAgent } from '@/lib/agents/guardian';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const checkSchema = z.object({
  userMessage: z.string().min(1),
  machineModel: z.string().min(1)
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json();
    const { userMessage, machineModel } = checkSchema.parse(json);

    // Get org_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single<{ org_id: string | null }>();
    const orgId = profile?.org_id;

    if (!orgId) {
      return NextResponse.json({ error: 'User not associated with an organization' }, { status: 403 });
    }

    // Use Guardian Agent
    const result = await guardianAgent({
      userMessage,
      machineModel,
      conversationHistory: [], // Isolated check, no history context
      orgId
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in safety check:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
