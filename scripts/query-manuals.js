#!/usr/bin/env node

/**
 * Manual Query Test Script - Enhanced Version
 *
 * Tests the RAG system for uploaded manuals:
 * - Lists all manuals
 * - Shows safety blacklist
 * - Simulates Guardian Agent safety checks
 * - Demonstrates manual content search
 *
 * Run with:
 *   node scripts/query-manuals.js
 *   node scripts/query-manuals.js list
 *   node scripts/query-manuals.js blacklist
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * List all uploaded manuals
 */
async function listManuals() {
  console.log('\n📋 UPLOADED MANUALS');
  console.log('━'.repeat(60));

  // Get count
  const { count } = await supabase
    .from('manuals')
    .select('*', { count: 'exact', head: true });

  console.log(`\nTotal chunks in database: ${count || 0}`);

  // Get all manuals
  const { data, error } = await supabase
    .from('manuals')
    .select('id, title, machine_model, org_id, created_at, status, safety_warnings')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('❌ Query error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('\n⚠️  No manuals found');
    console.log('   Upload a manual at: /dashboard/organization/manuals');
    return;
  }

  // Deduplicate by title
  const uniqueManuals = new Map();
  data.forEach(m => {
    if (!uniqueManuals.has(m.title)) {
      uniqueManuals.set(m.title, m);
    }
  });

  console.log(`Unique manuals: ${uniqueManuals.size}\n`);

  Array.from(uniqueManuals.values()).forEach((m, idx) => {
    const scope = m.org_id ? 'Org-Specific' : 'Global';
    const warningCount = Object.keys(m.safety_warnings || {}).length;

    console.log(`${idx + 1}. ${m.title}`);
    console.log(`   Machine: ${m.machine_model}`);
    console.log(`   Scope: ${scope}`);
    console.log(`   Status: ${m.status}`);
    console.log(`   Safety Warnings: ${warningCount}`);
    console.log(`   Uploaded: ${new Date(m.created_at).toLocaleString()}\n`);
  });
}

/**
 * Show safety blacklist entries
 */
async function listBlacklist() {
  console.log('\n🚫 SAFETY BLACKLIST');
  console.log('━'.repeat(60));

  const { count } = await supabase
    .from('safety_blacklist')
    .select('*', { count: 'exact', head: true });

  console.log(`\nTotal safety rules: ${count || 0}\n`);

  const { data: rules, error } = await supabase
    .from('safety_blacklist')
    .select('id, machine_model, rule_description, severity, created_at')
    .order('severity', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('❌ Error listing blacklist:', error);
    return;
  }

  if (!rules || rules.length === 0) {
    console.log('⚠️  No safety rules found');
    console.log('   Safety rules are extracted automatically when manuals are uploaded.');
    return;
  }

  // Group by severity
  const bySeverity = { CRITICAL: [], HIGH: [], MEDIUM: [] };
  rules.forEach(r => bySeverity[r.severity]?.push(r));

  ['CRITICAL', 'HIGH', 'MEDIUM'].forEach(severity => {
    const count = bySeverity[severity].length;
    if (count > 0) {
      console.log(`\n${severity} (${count} rules):`);
      bySeverity[severity].forEach((rule, idx) => {
        console.log(`  ${idx + 1}. [${rule.machine_model}]`);
        console.log(`     ${rule.rule_description.substring(0, 100)}...`);
      });
    }
  });

  console.log('\n');
}

/**
 * Show detailed statistics
 */
async function showStats() {
  console.log('\n📊 DATABASE STATISTICS');
  console.log('━'.repeat(60));

  // Manuals stats
  const { count: totalChunks } = await supabase
    .from('manuals')
    .select('*', { count: 'exact', head: true });

  const { count: activeChunks } = await supabase
    .from('manuals')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: globalChunks } = await supabase
    .from('manuals')
    .select('*', { count: 'exact', head: true })
    .is('org_id', null);

  // Safety blacklist stats
  const { count: totalRules } = await supabase
    .from('safety_blacklist')
    .select('*', { count: 'exact', head: true });

  const { count: criticalRules } = await supabase
    .from('safety_blacklist')
    .select('*', { count: 'exact', head: true })
    .eq('severity', 'CRITICAL');

  console.log('\nManuals:');
  console.log(`  Total chunks: ${totalChunks || 0}`);
  console.log(`  Active chunks: ${activeChunks || 0}`);
  console.log(`  Global chunks: ${globalChunks || 0}`);

  console.log('\nSafety Blacklist:');
  console.log(`  Total rules: ${totalRules || 0}`);
  console.log(`  Critical rules: ${criticalRules || 0}`);

  // Get machine models
  const { data: manuals } = await supabase
    .from('manuals')
    .select('machine_model')
    .limit(1000);

  if (manuals) {
    const models = new Set(manuals.map(m => m.machine_model));
    console.log('\nMachine Models:');
    models.forEach(model => console.log(`  - ${model}`));
  }

  console.log('\n');
}

/**
 * Main CLI interface
 */
async function main() {
  const command = process.argv[2] || 'list';

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║          TechGuard AI - Manual Query Tool                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    switch (command) {
      case 'list':
        await listManuals();
        break;

      case 'blacklist':
        await listBlacklist();
        break;

      case 'stats':
        await showStats();
        break;

      case 'all':
        await listManuals();
        await listBlacklist();
        await showStats();
        break;

      default:
        console.log('\nUsage:');
        console.log('  node scripts/query-manuals.js [command]');
        console.log('');
        console.log('Commands:');
        console.log('  list       List all uploaded manuals (default)');
        console.log('  blacklist  Show safety blacklist entries');
        console.log('  stats      Show database statistics');
        console.log('  all        Run all commands');
        console.log('');
        process.exit(1);
    }

    console.log('─'.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}
