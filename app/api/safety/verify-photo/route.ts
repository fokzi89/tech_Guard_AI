/**
 * Photo Verification API Route
 *
 * Part of the Isolation Protocol - verifies that technician has properly
 * isolated equipment (power disconnected, lockout/tagout applied) before
 * revealing dangerous procedures.
 *
 * Uses vision model to analyze uploaded photos.
 *
 * POST /api/safety/verify-photo - Verify isolation photo
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { analyzePhoto } from '@/lib/agents/diagnostician';

/**
 * Request schema
 */
const photoVerificationSchema = z.object({
  photoUrl: z.string().url('Invalid photo URL'),
  incidentId: z.string().uuid('Invalid incident ID'),
  machineModel: z.string().min(1),
  verificationType: z
    .enum(['power_disconnected', 'lockout_applied', 'general_safety'])
    .default('power_disconnected'),
});

/**
 * POST /api/safety/verify-photo
 *
 * Verify safety isolation using vision model
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const validated = photoVerificationSchema.parse(body);

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify incident belongs to user's organization
    const { data: incident, error: incidentError } = await supabase
      .from('incidents')
      .select('id, machine_model, org_id')
      .eq('id', validated.incidentId)
      .single();

    if (incidentError || !incident) {
      return NextResponse.json(
        { error: 'Incident not found or access denied' },
        { status: 404 }
      );
    }

    // Build verification context based on type
    const verificationContext = buildVerificationContext(
      validated.verificationType,
      validated.machineModel
    );

    console.log('[Photo Verification] Analyzing photo...', {
      incidentId: validated.incidentId,
      verificationType: validated.verificationType,
    });

    // Analyze photo using vision model
    const analysis = await analyzePhoto(validated.photoUrl, verificationContext);

    // Determine if verification passed
    const verificationResult = analyzeVerificationResult(
      analysis,
      validated.verificationType
    );

    console.log('[Photo Verification] Result:', {
      verified: verificationResult.verified,
      confidence: verificationResult.confidence,
    });

    // Log verification attempt
    await supabase.from('conversation_messages').insert({
      incident_id: validated.incidentId,
      role: 'system',
      content: `Photo verification ${verificationResult.verified ? 'PASSED' : 'FAILED'}: ${validated.verificationType}`,
      metadata: {
        photo_url: validated.photoUrl,
        verification_type: validated.verificationType,
        verified: verificationResult.verified,
        confidence: verificationResult.confidence,
        analysis: analysis.substring(0, 500), // Store first 500 chars
        timestamp: new Date().toISOString(),
      },
    });

    // If verification passed, update incident to unlock chat
    if (verificationResult.verified) {
      await supabase
        .from('incidents')
        .update({
          metadata: {
            safety_verified: true,
            verification_timestamp: new Date().toISOString(),
            verification_photo: validated.photoUrl,
          },
        })
        .eq('id', validated.incidentId);
    }

    return NextResponse.json({
      verified: verificationResult.verified,
      confidence: verificationResult.confidence,
      analysis: analysis,
      message: verificationResult.message,
      details: verificationResult.details,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[Photo Verification] Error:', error);

    // Fail closed - reject verification on error
    return NextResponse.json(
      {
        verified: false,
        confidence: 0.0,
        message: 'Photo verification failed due to system error',
        error: 'Internal error',
      },
      { status: 500 }
    );
  }
}

/**
 * Build verification context for vision model
 */
function buildVerificationContext(
  verificationType: string,
  machineModel: string
): string {
  switch (verificationType) {
    case 'power_disconnected':
      return `You are verifying that power has been safely disconnected from a ${machineModel} machine.

CRITICAL: Analyze this photo carefully and determine if:
1. Power cable/cord is VISIBLY DISCONNECTED from the machine or wall outlet
2. Main power switch is in the OFF position (if visible)
3. There are NO indicator lights showing power is on
4. Equipment appears to be de-energized

Look for:
- Unplugged power cords
- Disconnected cables
- Open circuit breakers
- Lockout/tagout devices on power sources
- Dark/off indicator lights

REJECT if:
- Power cable appears connected
- Any lights are illuminated
- Image is too blurry to verify
- Cannot clearly see power connection status
- Wrong equipment shown

Provide detailed analysis and clearly state: VERIFIED or NOT VERIFIED`;

    case 'lockout_applied':
      return `You are verifying that lockout/tagout (LOTO) has been properly applied to a ${machineModel} machine.

Analyze this photo for:
1. Lockout device (lock) applied to energy isolation point
2. Tagout tag identifying who applied the lock
3. Clear indication that equipment cannot be energized

VERIFIED if you clearly see lockout/tagout devices properly applied.
NOT VERIFIED if LOTO is missing, unclear, or improperly applied.`;

    case 'general_safety':
      return `Analyze this photo of a ${machineModel} machine for general safety verification.

Check for:
- Safe working conditions
- No obvious hazards
- Equipment appears safe to work on

Provide detailed observations.`;

    default:
      return `Analyze this photo for safety verification purposes.`;
  }
}

/**
 * Analyze verification result from vision model
 */
function analyzeVerificationResult(
  analysis: string,
  verificationType: string
): {
  verified: boolean;
  confidence: number;
  message: string;
  details: string[];
} {
  const lowerAnalysis = analysis.toLowerCase();

  // Check for explicit verification keywords
  const hasVerified = /\b(verified|confirmed|disconnected|safe|locked out)\b/i.test(
    analysis
  );
  const hasNotVerified = /\b(not verified|cannot verify|still connected|unclear|blurry|insufficient|wrong equipment)\b/i.test(
    analysis
  );

  // Power disconnection specific checks
  if (verificationType === 'power_disconnected') {
    const hasPowerDisconnected = /\b(power.*disconnected|cable.*unplugged|cord.*disconnected|no.*power)\b/i.test(
      analysis
    );
    const hasPowerConnected = /\b(power.*connected|cable.*plugged|still.*energized|lights.*on)\b/i.test(
      analysis
    );

    if (hasPowerConnected || hasNotVerified) {
      return {
        verified: false,
        confidence: 0.8,
        message:
          'Power disconnection could not be verified. Please ensure power is fully disconnected and take a clear photo.',
        details: [
          'Power cable must be visibly disconnected',
          'All indicator lights must be off',
          'Photo must be clear and show power connection point',
        ],
      };
    }

    if (hasPowerDisconnected && hasVerified) {
      return {
        verified: true,
        confidence: 0.9,
        message: 'Power disconnection verified. You may now proceed safely.',
        details: [
          'Power appears to be disconnected',
          'Equipment appears to be de-energized',
          'Safe to proceed with troubleshooting',
        ],
      };
    }
  }

  // Lockout/tagout specific checks
  if (verificationType === 'lockout_applied') {
    const hasLockout = /\b(lockout|lock.*applied|loto|tag.*visible)\b/i.test(
      analysis
    );

    if (hasLockout && hasVerified) {
      return {
        verified: true,
        confidence: 0.85,
        message: 'Lockout/tagout verified.',
        details: ['Lockout device visible', 'Safe to proceed'],
      };
    }
  }

  // Check for image quality issues
  if (/\b(blurry|unclear|out of focus|poor quality|too dark)\b/i.test(analysis)) {
    return {
      verified: false,
      confidence: 0.9,
      message:
        'Photo quality insufficient for verification. Please take a clearer photo in good lighting.',
      details: [
        'Ensure good lighting',
        'Hold camera steady',
        'Focus on power connection point',
      ],
    };
  }

  // Check for wrong equipment
  if (/\b(different.*machine|wrong.*equipment|not.*same)\b/i.test(analysis)) {
    return {
      verified: false,
      confidence: 0.95,
      message:
        'Photo appears to show different equipment. Please photograph the correct machine.',
      details: ['Ensure you are photographing the correct machine', 'Check machine model'],
    };
  }

  // Default: Cannot verify
  return {
    verified: false,
    confidence: 0.6,
    message: 'Unable to verify safety isolation from this photo. Please try again.',
    details: [
      'Take a clear, well-lit photo',
      'Ensure power disconnection is clearly visible',
      'Show the entire power connection area',
    ],
  };
}
