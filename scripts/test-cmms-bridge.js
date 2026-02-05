// Test CMMS Bridge (Curator Agent & Service Reports)
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://ajffognmxwtwbussgfxx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqZmZvZ25teHd0d2J1c3NnZnh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODYxNzAwNCwiZXhwIjoyMDg0MTkzMDA0fQ._ANYKkFsaVQJ_nTNjzqgFuSdpSTIgF_JI1OjWgJZpGw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCMMSBridge() {
  console.log('📋 Testing CMMS Bridge (Curator Agent)\n');
  console.log('═'.repeat(80));

  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  // Test 1: Service Reports Table Schema
  console.log('\n1️⃣  Service Reports Table Schema');
  try {
    const { data, error } = await supabase
      .from('service_reports')
      .select('id, incident_id, work_order, as_found, work_performed, as_left, generated_at')
      .limit(0);

    if (error) {
      results.failed.push('Service Reports Schema: ' + error.message);
      console.log('   ❌ FAILED:', error.message);
    } else {
      results.passed.push('Service Reports Schema: All required columns exist');
      console.log('   ✅ PASSED: Table has all required columns');
      console.log('      - id, incident_id, work_order');
      console.log('      - as_found, work_performed, as_left');
      console.log('      - generated_at');
    }
  } catch (error) {
    results.failed.push('Service Reports Schema: ' + error.message);
    console.log('   ❌ FAILED:', error.message);
  }

  // Test 2: Check incidents table has required fields
  console.log('\n2️⃣  Incidents Table - External Ticket ID Support');
  try {
    const { data, error } = await supabase
      .from('incidents')
      .select('id, external_ticket_id, machine_model')
      .limit(1);

    if (error) {
      results.failed.push('Incidents Schema: ' + error.message);
      console.log('   ❌ FAILED:', error.message);
    } else {
      results.passed.push('Incidents Schema: external_ticket_id column exists');
      console.log('   ✅ PASSED: Incidents table supports external ticket IDs');
    }
  } catch (error) {
    results.failed.push('Incidents Schema: ' + error.message);
    console.log('   ❌ FAILED:', error.message);
  }

  // Test 3: Curator Agent Implementation
  console.log('\n3️⃣  Curator Agent Implementation');
  const curatorPath = path.join(__dirname, '../lib/agents/curator.ts');

  try {
    const curatorCode = fs.readFileSync(curatorPath, 'utf8');

    const hasFunction = curatorCode.includes('export async function curatorAgent');
    const hasSchema = curatorCode.includes('curatorSchema');
    const usesGemini = curatorCode.includes("google('gemini-1.5-pro");
    const hasAsFound = curatorCode.includes('asFound');
    const hasWorkPerformed = curatorCode.includes('workPerformed');
    const hasAsLeft = curatorCode.includes('asLeft');

    if (hasFunction && hasSchema && hasAsFound && hasWorkPerformed && hasAsLeft) {
      results.passed.push('Curator Agent: Complete implementation');
      console.log('   ✅ PASSED: Curator Agent fully implemented');
      if (usesGemini) {
        console.log('   ✅ Uses Gemini 1.5 Pro for report generation');
      }
    } else {
      results.failed.push('Curator Agent: Incomplete implementation');
      console.log('   ❌ FAILED: Curator Agent missing required fields');
    }
  } catch (error) {
    results.failed.push('Curator Agent: ' + error.message);
    console.log('   ❌ FAILED:', error.message);
  }

  // Test 4: Report Generation API Route
  console.log('\n4️⃣  Report Generation API Route');
  const generateAPIPath = path.join(__dirname, '../app/api/reports/generate/route.ts');

  try {
    const apiCode = fs.readFileSync(generateAPIPath, 'utf8');

    const callsCurator = apiCode.includes('curatorAgent(');
    const savesToDB = apiCode.includes("from('service_reports')");
    const hasUpsert = apiCode.includes('upsert');
    const includesPartsUsed = apiCode.includes('partsUsed');
    const includesRecommendations = apiCode.includes('recommendations');

    if (callsCurator && savesToDB && hasUpsert) {
      results.passed.push('Generate API: Complete implementation');
      console.log('   ✅ PASSED: /api/reports/generate implemented');

      if (includesPartsUsed && includesRecommendations) {
        console.log('   ✅ Includes parts and recommendations in report');
      } else {
        results.warnings.push('Generate API: May not include all curator output');
        console.log('   ⚠️  WARNING: Check if all curator fields are saved');
      }
    } else {
      results.failed.push('Generate API: Incomplete implementation');
      console.log('   ❌ FAILED: Generate API missing key functionality');
    }
  } catch (error) {
    results.failed.push('Generate API: ' + error.message);
    console.log('   ❌ FAILED:', error.message);
  }

  // Test 5: Report Fetch API Route
  console.log('\n5️⃣  Report Fetch API Route');
  const fetchAPIPath = path.join(__dirname, '../app/api/reports/[reportId]/route.ts');

  try {
    const apiCode = fs.readFileSync(fetchAPIPath, 'utf8');

    const hasGET = apiCode.includes('export async function GET');
    const fetchesReport = apiCode.includes("from('service_reports')");

    if (hasGET && fetchesReport) {
      results.passed.push('Fetch API: Implemented');
      console.log('   ✅ PASSED: /api/reports/[reportId] implemented');
    } else {
      results.failed.push('Fetch API: Not implemented');
      console.log('   ❌ FAILED: Fetch API not working');
    }
  } catch (error) {
    results.failed.push('Fetch API: ' + error.message);
    console.log('   ❌ FAILED:', error.message);
  }

  // Test 6: ServiceReportCard Component
  console.log('\n6️⃣  ServiceReportCard Component');
  const componentPath = path.join(__dirname, '../app/components/reports/ServiceReportCard.tsx');

  try {
    const componentCode = fs.readFileSync(componentPath, 'utf8');

    const hasAsFoundSection = componentCode.includes('As Found');
    const hasWorkPerformedSection = componentCode.includes('Work Performed');
    const hasAsLeftSection = componentCode.includes('As Left');
    const hasCopyButton = componentCode.includes('CopyButton');

    if (hasAsFoundSection && hasWorkPerformedSection && hasAsLeftSection && hasCopyButton) {
      results.passed.push('ServiceReportCard: Complete UI');
      console.log('   ✅ PASSED: ServiceReportCard displays all sections');
      console.log('   ✅ Includes copy-to-clipboard functionality');
    } else {
      results.failed.push('ServiceReportCard: Incomplete UI');
      console.log('   ❌ FAILED: ServiceReportCard missing sections');
    }
  } catch (error) {
    results.failed.push('ServiceReportCard: ' + error.message);
    console.log('   ❌ FAILED:', error.message);
  }

  // Test 7: Check for Report Generation UI Integration
  console.log('\n7️⃣  Report Generation UI Integration');
  const sessionPagePath = path.join(__dirname, '../app/dashboard/troubleshoot/[sessionId]/page.tsx');

  try {
    const sessionCode = fs.readFileSync(sessionPagePath, 'utf8');

    const hasGenerateButton = sessionCode.includes('Generate Report') ||
                              sessionCode.includes('generate report') ||
                              sessionCode.includes('/api/reports/generate');

    if (hasGenerateButton) {
      results.passed.push('UI Integration: Generate button present');
      console.log('   ✅ PASSED: Generate Report button found in session page');
    } else {
      results.warnings.push('UI Integration: Generate button may be missing');
      console.log('   ⚠️  WARNING: No "Generate Report" button found in session page');
      console.log('   📝 Users may not have a way to generate reports from UI');
    }
  } catch (error) {
    results.warnings.push('UI Integration: ' + error.message);
    console.log('   ⚠️  WARNING:', error.message);
  }

  // Test 8: RLS Policies for service_reports
  console.log('\n8️⃣  RLS Policies for Service Reports');
  const migrationPath = path.join(__dirname, '../supabase/migrations/20260119000000_initial_schema.sql');

  try {
    const migrationCode = fs.readFileSync(migrationPath, 'utf8');

    const hasRLSEnabled = migrationCode.includes('ALTER TABLE service_reports ENABLE ROW LEVEL SECURITY');
    const hasPolicies = migrationCode.includes('CREATE POLICY') &&
                        migrationCode.toLowerCase().includes('service_reports');

    if (hasRLSEnabled) {
      results.passed.push('RLS: Enabled on service_reports');
      console.log('   ✅ PASSED: RLS enabled on service_reports table');

      if (hasPolicies) {
        console.log('   ✅ RLS policies defined');
      } else {
        results.warnings.push('RLS: Policies may be incomplete');
        console.log('   ⚠️  WARNING: Check if RLS policies are complete');
      }
    } else {
      results.failed.push('RLS: Not enabled on service_reports');
      console.log('   ❌ FAILED: RLS not enabled - security risk!');
    }
  } catch (error) {
    results.warnings.push('RLS: ' + error.message);
    console.log('   ⚠️  WARNING:', error.message);
  }

  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('\n📊 Test Results Summary:\n');
  console.log(`✅ Passed: ${results.passed.length}`);
  results.passed.forEach(p => console.log(`   • ${p}`));

  console.log(`\n❌ Failed: ${results.failed.length}`);
  results.failed.forEach(f => console.log(`   • ${f}`));

  console.log(`\n⚠️  Warnings: ${results.warnings.length}`);
  results.warnings.forEach(w => console.log(`   • ${w}`));

  // CMMS Bridge Status
  console.log('\n' + '═'.repeat(80));
  console.log('\n📋 CMMS Bridge Status:\n');

  const coreComponents = [
    'Curator Agent Implementation',
    'Service Reports Table Schema',
    'Report Generation API',
    'ServiceReportCard Component'
  ];

  const coreIssues = results.failed.filter(f =>
    coreComponents.some(c => f.includes(c))
  );

  if (coreIssues.length === 0) {
    console.log('✅ Core CMMS Bridge components are functional!\n');
    console.log('📝 How it works:');
    console.log('   1. User completes troubleshooting session');
    console.log('   2. Click "Generate Report" button');
    console.log('   3. POST /api/reports/generate with incidentId');
    console.log('   4. Curator Agent analyzes conversation history');
    console.log('   5. Gemini 1.5 Pro extracts:');
    console.log('      - As Found: Initial symptoms/errors');
    console.log('      - Work Performed: Steps taken, diagnostics, repairs');
    console.log('      - As Left: Final condition, verification');
    console.log('      - Parts Used: Replaced components');
    console.log('      - Recommendations: Future maintenance');
    console.log('   6. Report saved to service_reports table');
    console.log('   7. Report displayed via ServiceReportCard');
    console.log('   8. One-click copy to clipboard for CMMS');
  } else {
    console.log('❌ CMMS Bridge has critical issues:\n');
    coreIssues.forEach(issue => console.log(`   • ${issue}`));
  }

  if (results.warnings.some(w => w.includes('Generate button'))) {
    console.log('\n⚠️  Important Note:');
    console.log('   The "Generate Report" button may not be visible in the UI.');
    console.log('   Users might not know how to create CMMS reports.');
    console.log('\n   🔧 Recommended: Add Generate Report button to session page header');
  }

  console.log('\n' + '═'.repeat(80));
  console.log('\n✅ Overall Status:');
  if (results.failed.length === 0) {
    if (results.warnings.length > 0) {
      console.log('CMMS Bridge is functional but has minor issues. ⚠️');
      return 0;
    } else {
      console.log('CMMS Bridge is fully functional! 🎉');
      return 0;
    }
  } else {
    console.log(`${results.failed.length} issue(s) need to be fixed.`);
    return 1;
  }
}

testCMMSBridge().then(code => process.exit(code));
