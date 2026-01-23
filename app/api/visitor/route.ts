import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

/**
 * PUBLIC ENDPOINT - No authentication required
 *
 * This endpoint allows visitors to register their interest in TechGuard AI.
 * Data is inserted into the public 'vistor' table (note: table name has typo in schema).
 * Admin will review submissions and send invitation links manually.
 */

// Validation schema for visitor registration
const visitorSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  orgName: z.string().min(2, 'Organization name must be at least 2 characters'),
  phone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validated = visitorSchema.parse(body);

    // Create a Supabase client with anon key (for public access - no auth required)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Check if visitor with same email and org_name already exists
    const { data: existingVisitor, error: checkError } = await supabase
      .from('vistor')
      .select('id, full_name, email, org_name')
      .eq('email', validated.email)
      .eq('org_name', validated.orgName)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for existing visitor:', checkError);
      return NextResponse.json(
        { error: 'Failed to process registration. Please try again later.' },
        { status: 500 }
      );
    }

    // If a matching record exists, notify user
    if (existingVisitor) {
      return NextResponse.json(
        {
          error: `A registration request already exists for ${validated.email} at ${validated.orgName}. Our admin will contact you shortly.`
        },
        { status: 400 }
      );
    }

    // Insert visitor record into public table (no auth required)
    const { error } = await supabase
      .from('vistor')
      .insert({
        full_name: validated.fullName,
        email: validated.email,
        org_name: validated.orgName,
        phone: validated.phone || null,
        is_active: true,
      });

    if (error) {
      console.error('Visitor registration error:', error);
      return NextResponse.json(
        { error: 'Failed to submit registration. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your registration has been received. Our admin will send you an invitation link shortly.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
