/**
 * Incident History API Route
 *
 * GET /api/incidents/history - Get user's troubleshooting sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/incidents/history
 *
 * Fetch all troubleshooting sessions for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile to access org_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('org_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Fetch incidents with message counts (RLS will filter by org)
    const { data: incidents, error: incidentsError } = await supabase
      .from('incidents')
      .select(
        `
        id,
        machine_model,
        external_ticket_id,
        status,
        created_at,
        updated_at
      `
      )
      .order('created_at', { ascending: false })
      .limit(100); // Limit to most recent 100 sessions

    if (incidentsError) {
      console.error('[Incidents History] Error fetching incidents:', incidentsError);
      return NextResponse.json(
        { error: `Failed to fetch sessions: ${incidentsError.message}` },
        { status: 500 }
      );
    }

    // Format response with message counts
    const sessions = incidents?.map((incident: any) => ({
      id: incident.id,
      machine_model: incident.machine_model,
      external_ticket_id: incident.external_ticket_id,
      status: incident.status,
      created_at: incident.created_at,
      updated_at: incident.updated_at,
      message_count: 0, // conversation_messages count temporarily disabled
    }));

    return NextResponse.json({
      success: true,
      sessions: sessions || [],
      total: sessions?.length || 0,
    });
  } catch (error) {
    console.error('[Incidents History] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
