// Fix orphaned users (auth users without profiles)
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function fixOrphanedUsers() {
  console.log('=== Fixing Orphaned Users ===\n');

  // Find orphaned users
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }

  const orphanedUsers = [];

  for (const user of users) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      orphanedUsers.push(user);
    }
  }

  if (orphanedUsers.length === 0) {
    console.log('✅ No orphaned users found!');
    rl.close();
    return;
  }

  console.log(`Found ${orphanedUsers.length} orphaned user(s):\n`);

  for (const user of orphanedUsers) {
    console.log(`📧 ${user.email}`);
    console.log(`🆔 ${user.id}\n`);

    const roleAnswer = await question(
      `What role for ${user.email}?\n` +
      `  1) super_admin (no org)\n` +
      `  2) org_admin (needs org ID)\n` +
      `  3) technician (needs org ID)\n` +
      `  s) Skip this user\n` +
      `Enter choice: `
    );

    if (roleAnswer.toLowerCase() === 's') {
      console.log('Skipped.\n');
      continue;
    }

    let role, orgId = null;

    switch (roleAnswer) {
      case '1':
        role = 'super_admin';
        break;
      case '2':
        role = 'org_admin';
        orgId = await question('Enter organization ID: ');
        break;
      case '3':
        role = 'technician';
        orgId = await question('Enter organization ID: ');
        break;
      default:
        console.log('Invalid choice, skipping.\n');
        continue;
    }

    const fullName = await question('Enter full name: ');

    // Create profile
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        org_id: orgId || null,
        role: role,
        full_name: fullName
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ Error creating profile: ${error.message}\n`);
    } else {
      console.log(`✅ Profile created successfully!\n`);
    }
  }

  rl.close();
  console.log('\n✅ Done!');
}

fixOrphanedUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
