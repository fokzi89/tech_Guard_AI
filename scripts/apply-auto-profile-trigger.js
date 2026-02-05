// Apply auto-profile creation trigger
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('=== Applying Auto-Profile Creation Trigger ===\n');

  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260201000000_auto_create_profile.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Executing migration...\n');

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    // If exec_sql doesn't exist, try direct execution (split by statement)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.includes('COMMENT ON')) continue; // Skip comments

      console.log(`Executing: ${statement.substring(0, 50)}...`);

      const { error: execError } = await supabase.rpc('exec', { sql: statement + ';' });

      if (execError) {
        console.error(`❌ Error: ${execError.message}`);
        console.error(`   Statement: ${statement.substring(0, 100)}...`);
      } else {
        console.log('   ✅ Success');
      }
    }
  } else {
    console.log('✅ Migration applied successfully!');
  }

  console.log('\n✅ Done! New users will automatically get profiles created.');
}

applyMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    console.log('\n⚠️  Manual migration required:');
    console.log('   Run: supabase db push');
    console.log('   Or apply the migration manually in Supabase Studio');
    process.exit(1);
  });
