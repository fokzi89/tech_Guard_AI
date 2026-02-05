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
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, email')
            .eq('id', user.id)
            .single<{ role: string; email: string }>();
        if (profile?.role !== 'super_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const json = await req.json();
        const { targetUserId } = impersonateSchema.parse(json);

        // Fetch target user details from auth.users via admin client
        const adminClient = createAdminClient();

        // Get user from Supabase Auth
        const { data: targetAuthUser, error: authError } = await adminClient.auth.admin.getUserById(targetUserId);

        if (authError || !targetAuthUser?.user) {
            return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
        }

        // Get user profile for additional info
        const { data: targetProfile } = await adminClient
            .from('profiles')
            .select('full_name, org_id')
            .eq('id', targetUserId)
            .single<{ full_name: string; org_id: string }>();

        // Check if we have the JWT secret
        const jwtSecret = process.env.SUPABASE_JWT_SECRET;
        if (!jwtSecret) {
            return NextResponse.json({ error: 'Server misconfiguration: No JWT Secret' }, { status: 500 });
        }

        // Create JWT token with real user data
        const now = Math.floor(Date.now() / 1000);
        const payload = {
            aud: 'authenticated',
            exp: now + (60 * 60), // 1 hour
            iat: now,
            iss: process.env.NEXT_PUBLIC_SUPABASE_URL || 'supabase',
            sub: targetUserId,
            email: targetAuthUser.user.email || '',
            phone: targetAuthUser.user.phone || '',
            role: 'authenticated',
            app_metadata: targetAuthUser.user.app_metadata || { provider: 'email' },
            user_metadata: {
                ...targetAuthUser.user.user_metadata,
                impersonated_by: user.id,
                impersonator_email: profile?.email || user.email
            }
        };

        const token = jwt.sign(payload, jwtSecret, { algorithm: 'HS256' });

        // Audit Log
        await adminClient.from('audit_logs').insert({
            actor_id: user.id,
            action: 'IMPERSONATE',
            target_resource: targetUserId,
            details: {
                impersonated_email: payload.email,
                target_name: targetProfile?.full_name,
                target_org_id: targetProfile?.org_id
            } as any,
            ip_address: req.headers.get('x-forwarded-for') || 'unknown',
            user_agent: req.headers.get('user-agent') || 'unknown'
        } as any);

        return NextResponse.json({ token });

    } catch (error) {
        console.error('Error impersonating:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
