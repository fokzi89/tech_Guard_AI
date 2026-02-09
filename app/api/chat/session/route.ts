import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Database } from '@/types/database';

const createSessionSchema = z.object({
  machineModel: z.string().min(1),
  workOrderId: z.string().optional()
});

// Type for incidents with profile view
type IncidentWithProfile = Database['public']['Views']['incidents_with_profiles']['Row'];

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json();
    const { machineModel, workOrderId } = createSessionSchema.parse(json);

    // Get org_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single<{ org_id: string | null }>();
    const orgId = profile?.org_id; // OR user.user_metadata.org_id

    if (!orgId) {
      return NextResponse.json({ error: 'User not associated with an organization' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('incidents')
      .insert({
        user_id: user.id,
        org_id: orgId,
        machine_model: machineModel,
        external_ticket_id: json.workOrderId,
        status: 'open'
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in session creation:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const incidentId = searchParams.get('incidentId');

    console.log('[API] GET /api/chat/session - Incident ID:', incidentId);

    if (!incidentId) {
      console.log('[API] Incident ID missing');
      return NextResponse.json({ error: 'Incident ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('[API] Unauthorized access', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[API] Fetching session for user:', user.id, 'Incident:', incidentId);

    // Fetch session details with technician profile using view
    const { data: sessionDataRaw, error: sessionError } = await supabase
      .from('incidents_with_profiles')
      .select('*')
      .eq('id', incidentId)
      .single();

    if (sessionError) {
      console.error('[API] Error fetching session from DB:', sessionError);
      return NextResponse.json({ error: 'Session not found', details: sessionError }, { status: 404 });
    }

    if (!sessionDataRaw) {
      console.error('[API] Session data is null');
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Cast to typed interface
    const sessionData = sessionDataRaw as IncidentWithProfile;
    console.log('[API] Session found:', sessionData.id, 'with technician:', sessionData.technician);

    // Fetch messages
    const { data: messages, error: messagesError } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('incident_id', incidentId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
    }

    // Format response to match frontend interface
    const formattedSession = {
      id: sessionData.id,
      machineModel: sessionData.machine_model,
      workOrderId: sessionData.external_ticket_id,
      status: sessionData.status,
      technician: sessionData.technician, // Already included from view
      createdAt: sessionData.created_at,
      updatedAt: sessionData.updated_at
    };

    return NextResponse.json({
      session: formattedSession,
      messages: messages || []
    });

  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
