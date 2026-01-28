import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
    console.log('🌱 Seeding database...');

    // 1. Create Organizations
    const orgs = [
        { name: 'TechnoCorp Industries', status: 'active', subscription_tier: 'enterprise' },
        { name: 'Global Manufacturing', status: 'active', subscription_tier: 'professional' },
        { name: 'Suspended Shops', status: 'suspended', subscription_tier: 'basic' }
    ];

    for (const org of orgs) {
        const { data, error } = await supabase.from('organizations').upsert(org, { onConflict: 'name' }).select();
        if (error) console.error('Error creating org:', org.name, error.message);
        else console.log('✅ Created Org:', org.name);
    }

    // 2. Create Users (must use Admin Auth API)
    const users = [
        { email: 'super@techguard.ai', password: 'password123', role: 'super_admin', name: 'Super Admin' },
        { email: 'admin@technocorp.com', password: 'password123', role: 'org_admin', name: 'Techno Admin', org: 'TechnoCorp Industries' },
        { email: 'tech@technocorp.com', password: 'password123', role: 'technician', name: 'Techno Tech', org: 'TechnoCorp Industries' },
        { email: 'admin@global.com', password: 'password123', role: 'org_admin', name: 'Global Admin', org: 'Global Manufacturing' }
    ];

    for (const u of users) {
        // Check if exists
        const { data: { users: existing } } = await supabase.auth.admin.listUsers();
        let userId = existing.find(e => e.email === u.email)?.id;

        if (!userId) {
            const { data: newUser, error } = await supabase.auth.admin.createUser({
                email: u.email,
                password: u.password,
                email_confirm: true
            });
            if (error) {
                console.error('Error creating user:', u.email, error.message);
                continue;
            }
            userId = newUser.user!.id;
            console.log('✅ Created User:', u.email);
        } else {
            console.log('ℹ️  User exists:', u.email);
        }

        // Assign Profile
        let orgId = null;
        if (u.org) {
            const { data: orgData } = await supabase.from('organizations').select('id').eq('name', u.org).single();
            orgId = orgData?.id;
        }

        const { error: profileError } = await supabase.from('profiles').upsert({
            id: userId,
            full_name: u.name,
            role: u.role,
            org_id: orgId
        });

        if (profileError) console.error('Error creating profile for:', u.email, profileError.message);
        else console.log('✅ Updated Profile:', u.name);
    }

    console.log('🎉 Seeding complete.');
}

seed().catch(console.error);
