// Create profiles for orphaned users
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Define profiles to create for orphaned users
const ORPHANED_USERS_CONFIG = {
  'tech@example.com': {
    role: 'super_admin',
    full_name: 'Tech User',
    org_id: null
  },
  'aakpomiemie@gmail.com': {
    role: 'super_admin',
    full_name: 'Akpomiemie User',
    org_id: null
  }
};

async function createMissingProfiles() {
  console.log('=== Creating Missing Profiles ===\n');

  // Get all auth users
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }

  let fixed = 0;
  let skipped = 0;

  for (const user of users) {
    // Check if profile exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile && ORPHANED_USERS_CONFIG[user.email]) {
      console.log(`📧 Creating profile for: ${user.email}`);

      const config = ORPHANED_USERS_CONFIG[user.email];

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          org_id: config.org_id,
          role: config.role,
          full_name: config.full_name
        })
        .select()
        .single();

      if (error) {
        console.error(`   ❌ Error: ${error.message}`);
      } else {
        console.log(`   ✅ Profile created: ${config.full_name} (${config.role})`);
        fixed++;
      }
    } else if (!profile) {
      console.log(`⏭️  Skipping ${user.email} (not in config)`);
      skipped++;
    }
  }

  console.log(`\n✅ Summary:`);
  console.log(`   - Fixed: ${fixed}`);
  console.log(`   - Skipped: ${skipped}`);
}

createMissingProfiles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
