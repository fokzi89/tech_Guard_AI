import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { accountDeletionSchema } from '@/lib/utils/settings-validation';

/**
 * POST /api/user/delete
 * Request account deletion (soft delete with 30-day grace period)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = accountDeletionSchema.parse(body);

    // Verify password by attempting sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: validated.password,
    });

    if (signInError) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const profileData = profile as any;

    // Prevent org_admin from deleting if they have active users
    if (profileData?.role === 'org_admin' && profileData.org_id) {
      const { count } = await (supabase as any)
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', profileData.org_id)
        .neq('id', user.id)
        .is('deleted_at', null);

      if (count && count > 0) {
        return NextResponse.json(
          {
            error: 'Cannot delete account while managing other users. Transfer ownership or remove users first.',
          },
          { status: 409 }
        );
      }
    }

    // Calculate deletion date (30 days from now)
    const deleteDate = new Date();
    deleteDate.setDate(deleteDate.getDate() + 30);

    // Mark profile for deletion
    const { error: updateError } = await (supabase as any)
      .from('profiles')
      .update({
        delete_requested_at: new Date().toISOString(),
        delete_requested_by: user.id,
        deleted_at: deleteDate.toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error scheduling account deletion:', updateError);
      return NextResponse.json(
        { error: 'Failed to schedule account deletion' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Account deletion scheduled',
      deletionDate: deleteDate.toISOString(),
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error in POST /api/user/delete:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/delete
 * Cancel account deletion request
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remove deletion request
    const { error: updateError } = await (supabase as any)
      .from('profiles')
      .update({
        delete_requested_at: null,
        delete_requested_by: null,
        deleted_at: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error canceling account deletion:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel account deletion' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Account deletion canceled',
    });
  } catch (error) {
    console.error('Error in DELETE /api/user/delete:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
