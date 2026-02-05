/**
 * Debug script to check manuals in database
 * Run with: node scripts/debug-manuals.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function debugManuals() {
    console.log('\n=== Manual Upload Debug Script ===\n');

    // Create admin client to bypass RLS
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    try {
        // 1. Check total manuals count
        const { count: totalCount, error: countError } = await supabase
            .from('manuals')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Error counting manuals:', countError);
        } else {
            console.log(`Total manuals in database: ${totalCount}`);
        }

        // 2. List all manuals (with org_id)
        const { data: allManuals, error: allError } = await supabase
            .from('manuals')
            .select('id, title, machine_model, org_id, status, created_at')
            .order('created_at', { ascending: false })
            .limit(20);

        if (allError) {
            console.error('Error fetching manuals:', allError);
        } else if (allManuals && allManuals.length > 0) {
            console.log(`\nLast ${allManuals.length} manuals:`);
            allManuals.forEach((manual, idx) => {
                console.log(`${idx + 1}. ${manual.title} (${manual.machine_model})`);
                console.log(`   ID: ${manual.id}`);
                console.log(`   Org ID: ${manual.org_id || 'NULL (global)'}`);
                console.log(`   Status: ${manual.status}`);
                console.log(`   Created: ${manual.created_at}`);
            });
        } else {
            console.log('\nNo manuals found in database!');
        }

        // 3. Check profiles and their org_ids
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, role, org_id')
            .order('created_at', { ascending: false })
            .limit(10);

        if (profileError) {
            console.error('\nError fetching profiles:', profileError);
        } else if (profiles && profiles.length > 0) {
            console.log(`\nProfiles in database:`);
            profiles.forEach((profile, idx) => {
                console.log(`${idx + 1}. ${profile.full_name} (${profile.role})`);
                console.log(`   User ID: ${profile.id}`);
                console.log(`   Org ID: ${profile.org_id || 'NULL'}`);
            });
        }

        // 4. Check if there are any manuals with embeddings
        const { data: manualsWithEmbeddings, error: embError } = await supabase
            .from('manuals')
            .select('id, title, embedding')
            .not('embedding', 'is', null)
            .limit(1);

        if (embError) {
            console.error('\nError checking embeddings:', embError);
        } else if (manualsWithEmbeddings && manualsWithEmbeddings.length > 0) {
            const manual = manualsWithEmbeddings[0];
            console.log(`\nEmbedding check:`);
            console.log(`Sample manual has embedding: ${manual.embedding ? `YES (length: ${manual.embedding.length})` : 'NO'}`);
        }

    } catch (error) {
        console.error('\nUnexpected error:', error);
    }

    console.log('\n=== End Debug ===\n');
}

debugManuals();
