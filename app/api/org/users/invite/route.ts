import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin'; // Need admin privileges to invite/create users if using Supabase Auth
import { NextResponse } from 'next/server';
import { z } from 'zod';

const inviteSchema = z.object({
    email: z.string().email(),
    role: z.enum(['org_admin', 'technician']).default('technician')
});

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify requester is Org Admin or Super Admin
        const { data: requesterProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

        if (!requesterProfile || (requesterProfile.role !== 'org_admin' && requesterProfile.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
        }

        const json = await req.json();
        const { email, role } = inviteSchema.parse(json);
        const orgId = requesterProfile.org_id;

        if (!orgId) {
            return NextResponse.json({ error: 'Caller not in an organization' }, { status: 400 });
        }

        // Use Admin Client to invite user
        // Supabase inviteUserByEmail sends an email if configured.
        // For now, we can create the user or invite.
        const adminSupabase = createAdminClient();

        // Check if user exists? 
        // inviteUserByEmail will create if not exists and send magic link or invite email.

        const { data: invitation, error } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
            data: {
                org_id: orgId,
                full_name: '', // Optional or passed in body
                role: role // Storing role in metadata for trigger to pick up?
            }
        });

        if (error) {
            console.error('Invite error', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Also ensure profile exists or relies on Trigger?
        // If using 'inviteUserByEmail', the user is created in Auth. 
        // We usually need a trigger on auth.users to create a profile.
        // Assuming Trigger from T013 exists.
        // If not, we should upsert profile here manually to be safe.

        if (invitation.user) {
            await adminSupabase.from('profiles').upsert({
                id: invitation.user.id,
                org_id: orgId,
                role: role,
                email: email,
                full_name: 'Invited User' // Placeholder
            });
        }

        return NextResponse.json({ success: true, user: invitation.user });

    } catch (error) {
        console.error('Error inviting user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
