import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';

// Load env vars
config({ path: path.resolve(__dirname, '../../.env.local') });

// Helper to create client for a specific user
const createTestClient = (jwt: string) => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                },
            },
        }
    );
};

// We need a Service Role client to setup test users/data
const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

describe('RLS Policies - Data Isolation', () => {
    let orgA_Id: string;
    let orgB_Id: string;
    let userA_Token: string;
    let userB_Token: string;
    let userA_Id: string;
    let userB_Id: string;

    beforeAll(async () => {
        // 1. Setup Data
        // Create Org A
        const { data: orgA } = await adminClient.from('organizations').insert({ name: 'Integration Test Org A', status: 'active' }).select().single();
        orgA_Id = orgA.id;

        // Create Org B
        const { data: orgB } = await adminClient.from('organizations').insert({ name: 'Integration Test Org B', status: 'active' }).select().single();
        orgB_Id = orgB.id;

        // Create User A
        const { data: authA } = await adminClient.auth.admin.createUser({
            email: `user.a.${Date.now()}@test.com`,
            password: 'password123',
            email_confirm: true,
            user_metadata: { org_id: orgA_Id }
        });
        userA_Id = authA.user!.id;
        // Sign in to get token (or use admin to generate link, but easier to just sign in via public API if we enabled it, 
        // or mock the header. Real integration test usually signs in.)
        // Using signInWithPassword on the anon client
        const anonA = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        const { data: sessionA } = await anonA.auth.signInWithPassword({ email: authA.user!.email!, password: 'password123' });
        userA_Token = sessionA.session!.access_token;

        // Ensure profile created (trigger might handle it, or we do it manually)
        await adminClient.from('profiles').upsert({ id: userA_Id, org_id: orgA_Id, email: authA.user!.email!, role: 'technician' });


        // Create User B
        const { data: authB } = await adminClient.auth.admin.createUser({
            email: `user.b.${Date.now()}@test.com`,
            password: 'password123',
            email_confirm: true,
            user_metadata: { org_id: orgB_Id }
        });
        userB_Id = authB.user!.id;
        const anonB = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        const { data: sessionB } = await anonB.auth.signInWithPassword({ email: authB.user!.email!, password: 'password123' });
        userB_Token = sessionB.session!.access_token;

        await adminClient.from('profiles').upsert({ id: userB_Id, org_id: orgB_Id, email: authB.user!.email!, role: 'technician' });
    });

    afterAll(async () => {
        // Cleanup
        if (userA_Id) await adminClient.auth.admin.deleteUser(userA_Id);
        if (userB_Id) await adminClient.auth.admin.deleteUser(userB_Id);
        if (orgA_Id) await adminClient.from('organizations').delete().eq('id', orgA_Id);
        if (orgB_Id) await adminClient.from('organizations').delete().eq('id', orgB_Id);
    });

    it('User A CANNOT see Org B manuals', async () => {
        // Create manual in Org B
        await adminClient.from('manuals').insert({
            org_id: orgB_Id,
            title: 'Secret Org B Manual',
            machine_model: 'Model B',
            content: 'Secret content',
            status: 'active'
        });

        // Test as User A
        const clientA = createTestClient(userA_Token);
        const { data, error } = await clientA.from('manuals').select('*').eq('title', 'Secret Org B Manual');

        expect(error).toBeNull();
        expect(data).toHaveLength(0); // Should be empty
    });

    it('User A CAN see their own Org A manuals', async () => {
        // Create manual in Org A
        await adminClient.from('manuals').insert({
            org_id: orgA_Id,
            title: 'Public Org A Manual',
            machine_model: 'Model A',
            content: 'Public content',
            status: 'active'
        });

        // Test as User A
        const clientA = createTestClient(userA_Token);
        const { data, error } = await clientA.from('manuals').select('*').eq('title', 'Public Org A Manual');

        expect(error).toBeNull();
        expect(data).toHaveLength(1);
        expect(data![0].title).toBe('Public Org A Manual');
    });
});
