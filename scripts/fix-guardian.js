// Fix Guardian Agent database schema
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ajffognmxwtwbussgfxx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqZmZvZ25teHd0d2J1c3NnZnh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODYxNzAwNCwiZXhwIjoyMDg0MTkzMDA0fQ._ANYKkFsaVQJ_nTNjzqgFuSdpSTIgF_JI1OjWgJZpGw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixGuardian() {
  console.log('🔧 Fixing Guardian Agent database schema...\n');

  try {
    // Step 1: Add required_action column
    console.log('Step 1: Adding required_action column to safety_blacklist...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'safety_blacklist' AND column_name = 'required_action'
          ) THEN
            ALTER TABLE safety_blacklist
            ADD COLUMN required_action text DEFAULT 'disconnect_power';

            ALTER TABLE safety_blacklist
            ADD CONSTRAINT check_required_action
            CHECK (required_action IN ('disconnect_power', 'lockout_tagout', 'ppe_required'));

            RAISE NOTICE 'Added required_action column';
          ELSE
            RAISE NOTICE 'Column required_action already exists';
          END IF;
        END $$;
      `
    });

    // Since exec_sql might not exist, let's use a direct query approach
    // We'll execute each statement separately

    // Add column directly
    const { error: addColumnError } = await supabase
      .from('safety_blacklist')
      .select('required_action')
      .limit(1);

    if (addColumnError && addColumnError.message.includes('column')) {
      console.log('  ⚠️  Column needs to be added via SQL editor');
      console.log('  📝 Please run the SQL in scripts/create-guardian-function.sql via Supabase Dashboard');
    } else {
      console.log('  ✓ Column required_action exists');
    }

    // Step 2: Create the function
    console.log('\nStep 2: Creating check_safety_blacklist function...');

    // Test if function exists
    const { data: testData, error: testError } = await supabase.rpc('check_safety_blacklist', {
      query_embedding: new Array(1536).fill(0),
      filter_machine_model: 'test',
      match_threshold: 0.8,
      match_count: 1
    });

    if (testError) {
      console.log('  ⚠️  Function needs to be created');
      console.log(`  Error: ${testError.message}`);
      console.log('\n  📝 Please run the following SQL via Supabase Dashboard SQL Editor:');
      console.log('  https://supabase.com/dashboard/project/ajffognmxwtwbussgfxx/sql\n');

      const sqlFile = fs.readFileSync(
        path.join(__dirname, 'create-guardian-function.sql'),
        'utf8'
      );
      console.log('─'.repeat(80));
      console.log(sqlFile);
      console.log('─'.repeat(80));

      return false;
    } else {
      console.log('  ✓ Function check_safety_blacklist exists and works!');
      console.log(`  Returned ${testData?.length || 0} results (expected 0 for test)`);
      return true;
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📝 Please run scripts/create-guardian-function.sql manually via Supabase Dashboard');
    return false;
  }
}

fixGuardian().then(success => {
  if (success) {
    console.log('\n✅ Guardian Agent is ready!');
  } else {
    console.log('\n⚠️  Manual SQL execution required');
  }
  process.exit(success ? 0 : 1);
});
