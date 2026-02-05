import { createAdminClient } from '../lib/supabase/admin';
import { generateEmbedding } from '../lib/rag/embeddings';
import { createClient } from '@supabase/supabase-js';

// Load env vars if running directly with ts-node
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function seed() {
    const supabase = createAdminClient();

    console.log('Seeding E2E data...');

    // 1. Create Organization
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .upsert({
            name: 'Test Org',
            subscription_tier: 'enterprise',
            status: 'active'
        } as any, { onConflict: 'name' })
        .select()
        .single();

    if (orgError) throw orgError;
    const orgData = org as any;
    console.log('Organization created:', orgData.id);

    // 2. Create User (Standard Tech)
    // We need to create in Auth first. 
    // Admin client can create users.
    const email = 'tech@example.com';
    const password = 'password123';

    const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { org_id: (org as any).id, full_name: 'Test Tech' }
    }).catch(async (e) => {
        // If user already exists, we might need to get ID
        console.log('User might already exist, attempting to fetch...');
        // Actually typically createUser throws if exists? Or returns error.
        return await supabase.auth.admin.updateUserById('TODO_FIND_ID', { password }); // Hard to find ID by email. 
        // Admin listUsers.
    });

    // If authError says "User already registered", find the user.
    let userId = user?.id;
    if (!userId) {
        const { data: users } = await supabase.auth.admin.listUsers();
        const existing = users?.users.find(u => u.email === email);
        if (existing) {
            userId = existing.id;
            // Update the existing user to ensure password and confirmation
            await supabase.auth.admin.updateUserById(userId, {
                password: password,
                email_confirm: true,
                user_metadata: { org_id: (org as any).id, full_name: 'Test Tech' }
            });
            console.log('Updated existing user:', userId);
        }
    }

    if (!userId) throw new Error('Failed to create or find user');
    console.log('User ready:', userId);

    // Ensure profile exists
    await supabase.from('profiles').upsert({
        id: userId,
        org_id: (org as any).id,
        role: 'technician',
        full_name: 'Test Tech',
        email
    } as any);

    // 3. Create Safety Blacklist Rule
    try {
        const ruleText = 'Do not connect Internal 0V (Term 21) to External 24V (Term 29)';
        const embedding = await generateEmbedding(ruleText);

        const { error: ruleError } = await supabase
            .from('safety_blacklist')
            .upsert({
                rule_description: ruleText,
                machine_model: 'Domino M230i',
                severity: 'CRITICAL',
                required_action: 'disconnect_power',
                similarity: 1.0, // base similarity for itself
                embedding: embedding
            } as any, { onConflict: 'rule_description' }); // constraint? or just insert

        if (ruleError) console.warn('Rule insert error (maybe schema differs):', ruleError);
        else console.log('Safety rule seeded.');
    } catch (e) {
        console.warn('Skipping safety rule embedding generation due to missing API key or error:', e instanceof Error ? e.message : e);
    }

    console.log('Seeding complete.');
}

seed().catch(console.error);
