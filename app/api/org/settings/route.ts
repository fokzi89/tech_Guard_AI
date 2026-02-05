import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { organizationUpdateSchema } from '@/lib/utils/settings-validation';

/**
 * PATCH /api/org/settings
 * Update organization settings (requires org_admin or super_admin role)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile and verify role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    // Type assertion to work around Supabase type inference issues
    const profileData = profile as any;

    if (!profileData.org_id) {
      return NextResponse.json(
        { error: 'User not associated with organization' },
        { status: 403 }
      );
    }

    if (profileData.role !== 'org_admin' && profileData.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = organizationUpdateSchema.parse(body);

    // Check if name is already taken by another organization
    const { data: existingOrg } = await (supabase as any)
      .from('organizations')
      .select('id')
      .eq('name', validated.name)
      .neq('id', profileData.org_id)
      .maybeSingle();

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization name already exists' },
        { status: 409 }
      );
    }

    // Update organization
    const { data: organization, error } = await (supabase as any)
      .from('organizations')
      .update({
        name: validated.name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileData.org_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating organization:', error);
      return NextResponse.json(
        { error: 'Failed to update organization' },
        { status: 500 }
      );
    }

    return NextResponse.json({ organization });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error in PATCH /api/org/settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
