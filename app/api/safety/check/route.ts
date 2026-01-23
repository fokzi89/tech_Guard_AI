/**
 * Safety Check API Route
 *
 * Provides on-demand safety checks using the Guardian Agent.
 * Useful for real-time validation as the user types or before sending.
 *
 * POST /api/safety/check - Check if message is safe
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { runGuardianAgent } from '@/lib/agents/guardian';

/**
 * Request schema
 */
const safetyCheckSchema = z.object({
  message: z.string().min(1).max(5000),
  machineModel: z.string().min(1),
  incidentId: z.string().uuid().optional(),
});

/**
 * POST /api/safety/check
 *
 * Run Guardian Agent safety check on user message
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const validated = safetyCheckSchema.parse(body);

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile for org_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Run Guardian Agent
    const guardianResult = await runGuardianAgent({
      userMessage: validated.message,
      machineModel: validated.machineModel,
      conversationHistory: [], // Real-time check, no history needed
      orgId: profile.org_id,
    });

    // Return safety analysis
    return NextResponse.json({
      safe: guardianResult.decision === 'ALLOW',
      decision: guardianResult.decision,
      confidence: guardianResult.confidence,
      reasoning: guardianResult.reasoning,
      matchedRule: guardianResult.matchedRule,
      processingTimeMs: guardianResult.processingTimeMs,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[Safety Check] Error:', error);

    // Fail closed - return unsafe on error
    return NextResponse.json({
      safe: false,
      decision: 'BLOCK',
      confidence: 0.5,
      reasoning: 'Safety check failed due to system error. Blocking as precaution.',
      error: 'Internal error',
    });
  }
}
