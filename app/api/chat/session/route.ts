/**
 * Chat Session API Route
 *
 * Handles creation and management of troubleshooting sessions (incidents).
 * Each session represents one troubleshooting conversation.
 *
 * POST /api/chat/session - Create new session
 * GET /api/chat/session?incidentId=xxx - Get session details
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

/**
 * Schema for creating new session
 */
const createSessionSchema = z.object({
  machineModel: z.string().min(1, 'Machine model is required'),
  workOrderId: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
});

/**
 * POST /api/chat/session
 *
 * Create a new troubleshooting session
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const validated = createSessionSchema.parse(body);

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('org_id, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Create new incident (session)
    const { data: incident, error: incidentError } = await supabase
      .from('incidents')
      .insert({
        org_id: profile.org_id,
        technician_id: user.id,
        machine_model: validated.machineModel,
        external_ticket_id: validated.workOrderId,
        description: validated.description || `Troubleshooting ${validated.machineModel}`,
        location: validated.location,
        status: 'in_progress',
      })
      .select()
      .single();

    if (incidentError) {
      console.error('[Session] Error creating incident:', incidentError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    console.log('[Session] Created new incident:', incident.id);

    // Add initial system message
    await supabase.from('conversation_messages').insert({
      incident_id: incident.id,
      role: 'system',
      content: `Session started for ${validated.machineModel}${validated.workOrderId ? ` (Work Order: ${validated.workOrderId})` : ''}`,
      metadata: {
        session_start: true,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      incident: {
        id: incident.id,
        machineModel: incident.machine_model,
        workOrderId: incident.external_ticket_id,
        status: incident.status,
        createdAt: incident.created_at,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[Session] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat/session?incidentId=xxx
 *
 * Get session details and conversation history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const incidentId = searchParams.get('incidentId');

    if (!incidentId) {
      return NextResponse.json(
        { error: 'incidentId is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get incident (RLS will filter by org)
    const { data: incident, error: incidentError } = await supabase
      .from('incidents')
      .select(`
        *,
        profiles:technician_id (
          full_name,
          email
        )
      `)
      .eq('id', incidentId)
      .single();

    if (incidentError || !incident) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    // Get conversation messages
    const { data: messages, error: messagesError } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('incident_id', incidentId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('[Session] Error fetching messages:', messagesError);
    }

    return NextResponse.json({
      success: true,
      session: {
        id: incident.id,
        machineModel: incident.machine_model,
        workOrderId: incident.external_ticket_id,
        description: incident.description,
        status: incident.status,
        technician: incident.profiles,
        createdAt: incident.created_at,
        updatedAt: incident.updated_at,
      },
      messages: messages || [],
    });
  } catch (error) {
    console.error('[Session] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
