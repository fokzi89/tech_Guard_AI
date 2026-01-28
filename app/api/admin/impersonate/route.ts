import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const impersonateSchema = z.object({
    targetUserId: z.string().uuid()
});

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Verify Super Admin
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role !== 'super_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const json = await req.json();
        const { targetUserId } = impersonateSchema.parse(json);

        // Generate Impersonation Token
        // We can't generate a true Supabase Auth JWT easily without signing with their secret unless we use `admin.auth.signInWithId`? No.
        // Supabase does not support impersonation out of the box easily.
        // OPTION 1: Admin creates a magic link? No, immediate access needed.
        // OPTION 2: Custom JWT. We need `SUPABASE_JWT_SECRET`.
        // If we have the secret, we can sign a token with the target user's UUID and correct claims.

        // Check if we have the secret
        const jwtSecret = process.env.SUPABASE_JWT_SECRET;
        if (!jwtSecret) {
            return NextResponse.json({ error: 'Server misconfiguration: No JWT Secret' }, { status: 500 });
        }

        // Creating a token that looks like Supabase's.
        // Claims: sub (user_id), aud (authenticated), role (authenticated), etc.
        // Plus "impersonator_id" for audit?

        const payload = {
            aud: 'authenticated',
            exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
            sub: targetUserId,
            email: 'impersonated@user.com', // Placeholder? Or fetch real email.
            role: 'authenticated',
            app_metadata: { provider: 'email' },
            user_metadata: { impersonated_by: user.id }
        };

        const token = jwt.sign(payload, jwtSecret);

        // Audit Log
        const adminClient = createAdminClient();
        await adminClient.from('audit_logs').insert({
            actor_id: user.id,
            action: 'IMPERSONATE',
            target_resource: targetUserId,
            details: { impersonated_email: payload.email }, // Optional extra details
            ip_address: req.headers.get('x-forwarded-for') || 'unknown',
            user_agent: req.headers.get('user-agent') || 'unknown'
        });

        return NextResponse.json({ token });

    } catch (error) {
        console.error('Error impersonating:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
