// Check authentication and profile state
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'SET' : 'NOT SET');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAuthState() {
  console.log('=== Checking Auth State ===\n');

  // Get all auth users
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }

  console.log(`Found ${users.length} auth user(s):\n`);

  for (const user of users) {
    console.log(`📧 Email: ${user.email}`);
    console.log(`🆔 User ID: ${user.id}`);
    console.log(`✅ Confirmed: ${user.email_confirmed_at ? 'YES' : 'NO'}`);

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.log(`❌ Profile Error: ${JSON.stringify(profileError)}`);
    } else if (profile) {
      console.log(`👤 Profile: Found`);
      console.log(`   - Role: ${profile.role}`);
      console.log(`   - Name: ${profile.full_name}`);
      console.log(`   - Org ID: ${profile.org_id || 'NULL (super admin)'}`);
    } else {
      console.log(`❌ Profile: NOT FOUND - THIS IS THE PROBLEM!`);
      console.log(`   👉 Profile row doesn't exist for this user`);
    }

    console.log('---\n');
  }
}

checkAuthState()
  .then(() => {
    console.log('✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
