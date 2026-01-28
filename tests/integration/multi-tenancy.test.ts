import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createWrappedClient, createServiceRoleClient } from '@/lib/utils/rls';
import { config } from 'dotenv';
import path from 'path';

// Load env vars
config({ path: path.resolve(__dirname, '../../.env.local') });

const adminClient = createServiceRoleClient();

describe('Multi-Tenancy Isolation', () => {
    let orgA_Id: string;
    let orgB_Id: string;
    let userA_Token: string;
    let userB_Token: string;
    let userA_Id: string;
    let userB_Id: string;

    beforeAll(async () => {
        // Setup Orgs
        const { data: orgA } = await adminClient.from('organizations').insert({ name: `MT Org A ${Date.now()}`, status: 'active' }).select().single();
        orgA_Id = orgA.id;
        const { data: orgB } = await adminClient.from('organizations').insert({ name: `MT Org B ${Date.now()}`, status: 'active' }).select().single();
        orgB_Id = orgB.id;

        // Setup Users
        const { data: authA } = await adminClient.auth.admin.createUser({
            email: `mt.user.a.${Date.now()}@test.com`,
            password: 'password123',
            email_confirm: true,
            user_metadata: { org_id: orgA_Id }
        });
        userA_Id = authA.user!.id;
        const { data: sessionA } = await adminClient.auth.signInWithPassword({ email: authA.user!.email!, password: 'password123' });
        userA_Token = sessionA.session!.access_token;
        await adminClient.from('profiles').upsert({ id: userA_Id, org_id: orgA_Id, email: authA.user!.email!, role: 'technician' });

        const { data: authB } = await adminClient.auth.admin.createUser({
            email: `mt.user.b.${Date.now()}@test.com`,
            password: 'password123',
            email_confirm: true,
            user_metadata: { org_id: orgB_Id }
        });
        userB_Id = authB.user!.id;
        const { data: sessionB } = await adminClient.auth.signInWithPassword({ email: authB.user!.email!, password: 'password123' });
        userB_Token = sessionB.session!.access_token;
        await adminClient.from('profiles').upsert({ id: userB_Id, org_id: orgB_Id, email: authB.user!.email!, role: 'technician' });
    });

    afterAll(async () => {
        // Cleanup
        await adminClient.auth.admin.deleteUser(userA_Id);
        await adminClient.auth.admin.deleteUser(userB_Id);
        await adminClient.from('organizations').delete().eq('id', orgA_Id);
        await adminClient.from('organizations').delete().eq('id', orgB_Id);
    });

    it('Incidents: User A CANNOT see Org B incidents', async () => {
        // Create incident for User B (Org B)
        await adminClient.from('incidents').insert({
            org_id: orgB_Id,
            user_id: userB_Id,
            machine_model: 'Model B Machine',
            status: 'open',
            title: 'Org B Incident'
        });

        const clientA = createWrappedClient(userA_Token);
        const { data } = await clientA.from('incidents').select('*');

        // Should verify no Org B data
        const orgBIncidents = data?.filter((i: any) => i.org_id === orgB_Id) || [];
        expect(orgBIncidents).toHaveLength(0);
    });

    it('Incidents: User A CAN see their own incidents', async () => {
        // Create incident for User A (Org A)
        await adminClient.from('incidents').insert({
            org_id: orgA_Id,
            user_id: userA_Id,
            machine_model: 'Model A Machine',
            status: 'open',
            title: 'Org A Incident'
        });

        const clientA = createWrappedClient(userA_Token);
        const { data } = await clientA.from('incidents').select('*').eq('title', 'Org A Incident');

        expect(data).toHaveLength(1);
        expect(data![0].title).toBe('Org A Incident');
    });

    it('Safety Blacklist: User A CANNOT see Org B custom rules', async () => {
        // Create custom rule for Org B
        // Note: safety_blacklist usually has org_id column if per-tenant? 
        // Spec says: "Can be organization-specific... or global"
        // Let's assume schema has org_id (nullable for global).

        await adminClient.from('safety_blacklist').insert({
            org_id: orgB_Id,
            rule_description: 'Org B Custom Rule',
            machine_model: 'Model B',
            severity: 'HIGH',
            required_action: 'disconnect_power',
            similarity: 1.0,
            embedding: [0.1] // Dummy
        });

        const clientA = createWrappedClient(userA_Token);
        const { data } = await clientA.from('safety_blacklist').select('*').eq('rule_description', 'Org B Custom Rule');

        expect(data).toHaveLength(0);
    });
});
