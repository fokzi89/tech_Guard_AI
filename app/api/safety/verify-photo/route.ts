import { createClient } from '@/lib/supabase/server';
import { verifyIsolation } from '@/lib/agents/guardian';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const verifyPhotoSchema = z.object({
  photoUrl: z.string().url(),
  machineModel: z.string().optional()
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json();
    const { photoUrl } = verifyPhotoSchema.parse(json);

    // Call Guardian verification logic
    const result = await verifyIsolation(photoUrl);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in photo verification:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
