/**
 * Chat API Route - Main Troubleshooting Endpoint
 *
 * This is the PRIMARY endpoint for the troubleshooting chat interface.
 * It integrates Guardian Agent (safety) and Diagnostician Agent (troubleshooting).
 *
 * Flow:
 * 1. User sends message
 * 2. Guardian Agent analyzes for safety (MUST run first)
 * 3. If Guardian blocks → return safety warning and trigger lockout
 * 4. If Guardian allows → Diagnostician Agent provides troubleshooting
 * 5. Stream response back to user
 *
 * Security:
 * - Requires authentication
 * - Validates all inputs with Zod
 * - Enforces RLS through Supabase client
 * - Logs all safety decisions for audit trail
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { runGuardianAgent } from '@/lib/agents/guardian';
import { streamDiagnosticianAgent } from '@/lib/agents/diagnostician';

/**
 * Request schema validation
 */
const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(5000),
  incidentId: z.string().uuid('Invalid incident ID'),
  machineModel: z.string().min(1),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
  photoUrl: z.string().url().optional(),
});

/**
 * POST /api/chat
 *
 * Main chat endpoint with Guardian + Diagnostician integration
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Step 1: Parse and validate request
    const body = await request.json();
    const validated = chatRequestSchema.parse(body);

    // Step 2: Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 3: Get user's profile and org_id
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

    // Step 4: Verify incident belongs to user's organization (RLS check)
    const { data: incident, error: incidentError } = await supabase
      .from('incidents')
      .select('id, machine_model, status')
      .eq('id', validated.incidentId)
      .single();

    if (incidentError || !incident) {
      return NextResponse.json(
        { error: 'Incident not found or access denied' },
        { status: 404 }
      );
    }

    // Step 5: Run Guardian Agent FIRST (safety check)
    console.log('[Guardian] Analyzing message for safety...');
    const guardianResult = await runGuardianAgent({
      userMessage: validated.message,
      machineModel: validated.machineModel,
      conversationHistory: validated.conversationHistory,
      orgId: profile.org_id,
    });

    console.log('[Guardian] Decision:', guardianResult.decision, {
      confidence: guardianResult.confidence,
      processingTime: guardianResult.processingTimeMs,
    });

    // Step 6: Log Guardian decision (for audit trail)
    await logGuardianDecision(
      supabase,
      validated.incidentId,
      validated.message,
      guardianResult
    );

    // Step 7: If Guardian blocks, return safety warning
    if (guardianResult.decision === 'BLOCK') {
      console.log('[Guardian] BLOCKED dangerous request');

      // Save blocked message to conversation
      await supabase.from('conversation_messages').insert({
        incident_id: validated.incidentId,
        role: 'user',
        content: validated.message,
        is_blocked: true,
        block_reason: guardianResult.reasoning,
      });

      // Return safety lockout response
      return NextResponse.json({
        blocked: true,
        decision: 'BLOCK',
        confidence: guardianResult.confidence,
        matchedRule: guardianResult.matchedRule,
        reasoning: guardianResult.reasoning,
        message:
          '⚠️ SAFETY WARNING: This request has been blocked for your protection.',
      });
    }

    // Step 8: Guardian allows - save user message
    const { data: userMessage, error: userMsgError } = await supabase
      .from('conversation_messages')
      .insert({
        incident_id: validated.incidentId,
        role: 'user',
        content: validated.message,
        is_blocked: false,
      })
      .select()
      .single();

    if (userMsgError) {
      console.error('[Chat] Error saving user message:', userMsgError);
    }

    // Step 9: Run Diagnostician Agent (streaming)
    console.log('[Diagnostician] Generating response...');

    const diagnosticianStream = await streamDiagnosticianAgent({
      userMessage: validated.message,
      machineModel: validated.machineModel,
      conversationHistory: validated.conversationHistory,
      photoUrl: validated.photoUrl,
      orgId: profile.org_id,
      incidentId: validated.incidentId,
    });

    // Step 10: Create streaming response
    const stream = diagnosticianStream.toDataStreamResponse({
      onFinish: async (completion) => {
        // Save AI response to database when stream completes
        try {
          await supabase.from('conversation_messages').insert({
            incident_id: validated.incidentId,
            role: 'assistant',
            content: completion.text,
            is_blocked: false,
          });

          console.log('[Diagnostician] Response saved to database');
        } catch (error) {
          console.error('[Diagnostician] Error saving response:', error);
        }
      },
    });

    return stream;
  } catch (error) {
    console.error('[Chat API] Error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Log error for monitoring
    console.error('[Chat API] Unexpected error:', {
      error,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    });

    // Return safe error response
    return NextResponse.json(
      {
        error:
          'An error occurred while processing your request. For safety, please ensure equipment is powered off and locked out before proceeding.',
      },
      { status: 500 }
    );
  }
}

/**
 * Log Guardian decision to database for audit trail
 * Critical for liability and compliance
 */
async function logGuardianDecision(
  supabase: any,
  incidentId: string,
  userMessage: string,
  guardianResult: any
) {
  try {
    // Log to a safety_events table (if exists) or use conversation_messages metadata
    await supabase.from('conversation_messages').insert({
      incident_id: incidentId,
      role: 'system',
      content: `Guardian Decision: ${guardianResult.decision}`,
      metadata: {
        guardian_decision: guardianResult.decision,
        confidence: guardianResult.confidence,
        reasoning: guardianResult.reasoning,
        matched_rule: guardianResult.matchedRule,
        processing_time_ms: guardianResult.processingTimeMs,
        user_message: userMessage,
        timestamp: new Date().toISOString(),
      },
    });

    console.log('[Guardian] Decision logged to database');
  } catch (error) {
    // Don't fail the request if logging fails
    console.error('[Guardian] Failed to log decision:', error);
  }
}
