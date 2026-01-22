import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

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

    // Create a Supabase client with anon key (for public access)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Insert visitor record
    const { data, error } = await supabase
      .from('visitor')
      .insert({
        full_name: validated.fullName,
        email: validated.email,
        org_name: validated.orgName,
        phone: validated.phone || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation (duplicate email)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This email has already been registered. Please use a different email or contact support.' },
          { status: 400 }
        );
      }

      console.error('Visitor registration error:', error);
      return NextResponse.json(
        { error: 'Failed to register. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Registration request submitted successfully!',
      data,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
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
