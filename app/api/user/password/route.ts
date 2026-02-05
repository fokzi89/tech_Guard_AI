import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { passwordChangeSchema } from '@/lib/utils/settings-validation';

/**
 * POST /api/user/password
 * Change user password with strong validation requirements
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = passwordChangeSchema.parse(body);

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: validated.newPassword,
    });

    if (error) {
      console.error('Error changing password:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to change password' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error in POST /api/user/password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
