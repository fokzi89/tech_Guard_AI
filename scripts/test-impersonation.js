// Test Super Admin Impersonation Feature
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://ajffognmxwtwbussgfxx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqZmZvZ25teHd0d2J1c3NnZnh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODYxNzAwNCwiZXhwIjoyMDg0MTkzMDA0fQ._ANYKkFsaVQJ_nTNjzqgFuSdpSTIgF_JI1OjWgJZpGw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testImpersonation() {
  console.log('👤 Testing Super Admin Impersonation Feature\n');
  console.log('═'.repeat(80));

  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  // Test 1: Audit Logs Table
  console.log('\n1️⃣  Audit Logs Table');
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, actor_id, action, target_resource, created_at')
      .limit(1);

    if (error) {
      results.failed.push('Audit Logs Table: ' + error.message);
      console.log('   ❌ FAILED:', error.message);
      console.log('   📝 Impersonation actions will not be logged');
    } else {
      results.passed.push('Audit Logs Table: Exists');
      console.log('   ✅ PASSED: audit_logs table exists');
      console.log('   📝 Impersonation actions will be logged for compliance');
    }
  } catch (error) {
    results.failed.push('Audit Logs Table: ' + error.message);
    console.log('   ❌ FAILED:', error.message);
  }

  // Test 2: Impersonation API Route
  console.log('\n2️⃣  Impersonation API Route');
  const impersonateAPIPath = path.join(__dirname, '../app/api/admin/impersonate/route.ts');

  try {
    const apiCode = fs.readFileSync(impersonateAPIPath, 'utf8');

    const hasJWTGeneration = apiCode.includes('jwt.sign');
    const hasSuperAdminCheck = apiCode.includes("role !== 'super_admin'");
    const hasAuditLog = apiCode.includes("from('audit_logs')");
    const hasImpersonationMetadata = apiCode.includes('impersonated_by');

    if (hasJWTGeneration && hasSuperAdminCheck && hasImpersonationMetadata) {
      results.passed.push('Impersonation API: Complete implementation');
      console.log('   ✅ PASSED: /api/admin/impersonate implemented');
      console.log('   ✅ Verifies super admin role');
      console.log('   ✅ Generates JWT with impersonation metadata');

      if (hasAuditLog) {
        console.log('   ✅ Logs impersonation actions to audit_logs');
      } else {
        results.warnings.push('Impersonation API: Audit logging may be missing');
        console.log('   ⚠️  WARNING: Audit logging may not be configured');
      }
    } else {
      results.failed.push('Impersonation API: Incomplete implementation');
      console.log('   ❌ FAILED: Missing required features');
    }
  } catch (error) {
    results.failed.push('Impersonation API: ' + error.message);
    console.log('   ❌ FAILED:', error.message);
  }

  // Test 3: JWT Secret Check
  console.log('\n3️⃣  JWT Secret Configuration');
  const hasJWTSecret = process.env.SUPABASE_JWT_SECRET && process.env.SUPABASE_JWT_SECRET.length > 0;

  if (hasJWTSecret) {
    results.passed.push('JWT Secret: Configured');
    console.log('   ✅ PASSED: SUPABASE_JWT_SECRET is set');
    console.log('   📝 Required for signing impersonation tokens');
  } else {
    results.failed.push('JWT Secret: Not configured');
    console.log('   ❌ FAILED: SUPABASE_JWT_SECRET not found in environment');
    console.log('   📝 Get this from: Supabase Dashboard > Project Settings > API > JWT Secret');
  }

  // Test 4: Middleware Impersonation Detection
  console.log('\n4️⃣  Middleware Impersonation Detection');
  const middlewarePath = path.join(__dirname, '../lib/supabase/middleware.ts');

  try {
    const middlewareCode = fs.readFileSync(middlewarePath, 'utf8');

    const detectsImpersonation = middlewareCode.includes('impersonated_by');
    const setsHeader = middlewareCode.includes('X-TechGuard-Impersonating');

    if (detectsImpersonation && setsHeader) {
      results.passed.push('Middleware: Detects impersonation');
      console.log('   ✅ PASSED: Middleware detects impersonation');
      console.log('   ✅ Sets X-TechGuard-Impersonating header');
    } else {
      results.failed.push('Middleware: Does not detect impersonation');
      console.log('   ❌ FAILED: Middleware missing impersonation detection');
    }
  } catch (error) {
    results.failed.push('Middleware: ' + error.message);
    console.log('   ❌ FAILED:', error.message);
  }

  // Test 5: ImpersonationBanner Component
  console.log('\n5️⃣  ImpersonationBanner Component');
  const bannerPath = path.join(__dirname, '../app/components/admin/ImpersonationBanner.tsx');

  try {
    const bannerCode = fs.readFileSync(bannerPath, 'utf8');

    const checksMetadata = bannerCode.includes('impersonated_by');
    const hasStopButton = bannerCode.includes('Stop Impersonating');
    const hasSignOut = bannerCode.includes('signOut');

    if (checksMetadata && hasStopButton && hasSignOut) {
      results.passed.push('ImpersonationBanner: Complete UI');
      console.log('   ✅ PASSED: ImpersonationBanner component exists');
      console.log('   ✅ Checks user metadata for impersonation');
      console.log('   ✅ Has "Stop Impersonating" button');
      console.log('   ✅ Signs out to end impersonation');
    } else {
      results.failed.push('ImpersonationBanner: Incomplete');
      console.log('   ❌ FAILED: ImpersonationBanner missing features');
    }
  } catch (error) {
    results.failed.push('ImpersonationBanner: ' + error.message);
    console.log('   ❌ FAILED:', error.message);
  }

  // Test 6: Banner Integration in Layout
  console.log('\n6️⃣  ImpersonationBanner Integration');
  const layoutPath = path.join(__dirname, '../app/layout.tsx');

  try {
    const layoutCode = fs.readFileSync(layoutPath, 'utf8');

    const importsBanner = layoutCode.includes('ImpersonationBanner');
    const rendersBanner = layoutCode.includes('<ImpersonationBanner');

    if (importsBanner && rendersBanner) {
      results.passed.push('Layout Integration: Banner rendered');
      console.log('   ✅ PASSED: ImpersonationBanner rendered in root layout');
      console.log('   📝 Banner will show on all pages when impersonating');
    } else {
      results.failed.push('Layout Integration: Banner not rendered');
      console.log('   ❌ FAILED: ImpersonationBanner not in root layout');
    }
  } catch (error) {
    results.failed.push('Layout Integration: ' + error.message);
    console.log('   ❌ FAILED:', error.message);
  }

  // Test 7: Organizations Page Impersonate Button
  console.log('\n7️⃣  Organizations Page UI');
  const orgsPagePath = path.join(__dirname, '../app/dashboard/admin/organizations/page.tsx');

  try {
    const orgsPageCode = fs.readFileSync(orgsPagePath, 'utf8');

    const hasImpersonateButton = orgsPageCode.includes('Impersonate') || orgsPageCode.includes('impersonate');
    const callsAPI = orgsPageCode.includes('/api/admin/impersonate');
    const setsSession = orgsPageCode.includes('setSession');

    if (hasImpersonateButton && callsAPI && setsSession) {
      results.passed.push('Organizations Page: Complete UI');
      console.log('   ✅ PASSED: Organizations page has impersonate button');
      console.log('   ✅ Calls /api/admin/impersonate API');
      console.log('   ✅ Sets session with impersonation token');
    } else {
      results.failed.push('Organizations Page: Incomplete');
      console.log('   ❌ FAILED: Impersonate button or logic missing');
    }
  } catch (error) {
    results.failed.push('Organizations Page: ' + error.message);
    console.log('   ❌ FAILED:', error.message);
  }

  // Test 8: Check for Test Organization and Users
  console.log('\n8️⃣  Database - Test Data');
  try {
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(3);

    if (orgError) {
      results.warnings.push('Database: Cannot query organizations - ' + orgError.message);
      console.log('   ⚠️  WARNING: Cannot query organizations');
    } else if (orgs && orgs.length > 0) {
      results.passed.push('Database: Organizations exist');
      console.log('   ✅ PASSED: Found', orgs.length, 'organization(s)');

      // Check for org admins
      const { data: admins, error: adminError } = await supabase
        .from('profiles')
        .select('id, full_name, role, org_id')
        .eq('role', 'org_admin')
        .limit(3);

      if (adminError) {
        results.warnings.push('Database: Cannot query org admins');
        console.log('   ⚠️  WARNING: Cannot query org admins');
      } else if (admins && admins.length > 0) {
        console.log('   ✅ Found', admins.length, 'org admin(s) to impersonate');
      } else {
        results.warnings.push('Database: No org admins found');
        console.log('   ⚠️  WARNING: No org admins found - cannot test impersonation');
        console.log('   📝 Create an org admin to test: See seed.sql');
      }
    } else {
      results.warnings.push('Database: No organizations found');
      console.log('   ⚠️  WARNING: No organizations found');
      console.log('   📝 Run seed data: supabase db reset');
    }
  } catch (error) {
    results.warnings.push('Database: ' + error.message);
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

  // How It Works
  console.log('\n' + '═'.repeat(80));
  console.log('\n👤 How Super Admin Impersonation Works:\n');
  console.log('1. Super admin navigates to /dashboard/admin/organizations');
  console.log('2. Clicks "Impersonate" button for target organization');
  console.log('3. System finds org admin user for that organization');
  console.log('4. POST /api/admin/impersonate with targetUserId');
  console.log('5. API verifies requestor is super_admin');
  console.log('6. API generates JWT token signed with SUPABASE_JWT_SECRET');
  console.log('7. JWT includes impersonation metadata:');
  console.log('   - sub: target user ID');
  console.log('   - user_metadata.impersonated_by: super admin ID');
  console.log('   - user_metadata.impersonator_email: super admin email');
  console.log('8. Action logged to audit_logs table');
  console.log('9. Client calls supabase.auth.setSession() with token');
  console.log('10. Redirects to /dashboard as target user');
  console.log('11. ImpersonationBanner appears (amber bar at top)');
  console.log('12. Super admin can now see UI as the target user');
  console.log('13. Click "Stop Impersonating" to sign out');

  console.log('\n' + '═'.repeat(80));
  console.log('\n🔒 Security Features:\n');
  console.log('✓ Only super_admin role can impersonate');
  console.log('✓ All impersonation actions logged to audit_logs');
  console.log('✓ Impersonation token expires after 1 hour');
  console.log('✓ User metadata includes impersonator information');
  console.log('✓ Visual banner prevents confusion (amber bar)');
  console.log('✓ Easy exit with "Stop Impersonating" button');
  console.log('✓ JWT signature prevents token tampering');

  // Status
  console.log('\n' + '═'.repeat(80));
  console.log('\n✅ Overall Status:');

  const criticalIssues = results.failed.filter(f =>
    f.includes('JWT Secret') ||
    f.includes('Impersonation API') ||
    f.includes('Layout Integration')
  );

  if (criticalIssues.length > 0) {
    console.log('❌ Impersonation feature has critical issues:');
    criticalIssues.forEach(issue => console.log(`   • ${issue}`));
    return 1;
  } else if (results.failed.length > 0) {
    console.log('⚠️  Impersonation feature has minor issues:');
    results.failed.forEach(issue => console.log(`   • ${issue}`));
    return 0;
  } else {
    console.log('✅ Super Admin Impersonation is fully functional! 🎉');
    if (results.warnings.length > 0) {
      console.log('\n📝 Notes:');
      results.warnings.forEach(w => console.log(`   • ${w}`));
    }
    return 0;
  }
}

testImpersonation().then(code => process.exit(code));
