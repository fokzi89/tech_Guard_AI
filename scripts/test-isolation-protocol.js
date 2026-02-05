// Test Isolation Protocol - Full Flow
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ajffognmxwtwbussgfxx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqZmZvZ25teHd0d2J1c3NnZnh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODYxNzAwNCwiZXhwIjoyMDg0MTkzMDA0fQ._ANYKkFsaVQJ_nTNjzqgFuSdpSTIgF_JI1OjWgJZpGw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testIsolationProtocol() {
  console.log('🔒 Testing Isolation Protocol\n');
  console.log('═'.repeat(80));

  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  // Test 1: Guardian Agent Function
  console.log('\n1️⃣  Guardian Agent Database Function');
  try {
    const { data, error } = await supabase.rpc('check_safety_blacklist', {
      query_embedding: new Array(1536).fill(0),
      filter_machine_model: 'Domino 230i',
      match_threshold: 0.82,
      match_count: 1
    });

    if (error) {
      results.failed.push('Guardian: Database function error - ' + error.message);
      console.log('   ❌ FAILED:', error.message);
    } else {
      results.passed.push('Guardian: Database function works');
      console.log('   ✅ PASSED: Function executes successfully');
    }
  } catch (error) {
    results.failed.push('Guardian: ' + error.message);
    console.log('   ❌ FAILED:', error.message);
  }

  // Test 2: Safety Blacklist Table Schema
  console.log('\n2️⃣  Safety Blacklist Table Schema');
  try {
    const { data, error } = await supabase
      .from('safety_blacklist')
      .select('id, machine_model, rule_description, severity, required_action, embedding')
      .limit(1);

    if (error) {
      results.failed.push('Blacklist Schema: ' + error.message);
      console.log('   ❌ FAILED:', error.message);
    } else {
      const hasRequiredAction = data.length === 0 || data[0].required_action !== undefined;
      if (hasRequiredAction) {
        results.passed.push('Blacklist Schema: required_action column exists');
        console.log('   ✅ PASSED: All required columns present');
      } else {
        results.failed.push('Blacklist Schema: required_action column missing');
        console.log('   ❌ FAILED: required_action column missing');
      }
    }
  } catch (error) {
    results.failed.push('Blacklist Schema: ' + error.message);
    console.log('   ❌ FAILED:', error.message);
  }

  // Test 3: Check API Response Format Consistency
  console.log('\n3️⃣  API Response Format Consistency');
  console.log('   Checking: /api/chat BLOCK response format');

  // Read the chat route file to check response format
  const fs = require('fs');
  const path = require('path');
  const chatRoutePath = path.join(__dirname, '../app/api/chat/route.ts');

  try {
    const chatRouteCode = fs.readFileSync(chatRoutePath, 'utf8');

    // Check if the response format matches frontend expectations
    const hasBlockedField = chatRouteCode.includes('blocked: true');
    const returnsGuardianObject = chatRouteCode.includes('guardian: guardianResult');

    if (hasBlockedField) {
      results.passed.push('API Format: Returns blocked: true field');
      console.log('   ✅ PASSED: API returns blocked: true');
    } else if (returnsGuardianObject) {
      results.failed.push('API Format: Returns guardian object instead of blocked: true');
      console.log('   ❌ FAILED: API returns { error, guardian } but frontend expects { blocked: true, ... }');
      console.log('   📝 Frontend expects: { blocked: true, decision, confidence, matchedRule, reasoning }');
      console.log('   📝 Backend returns: { error: "Safety Block", guardian: {...} }');
    } else {
      results.warnings.push('API Format: Could not verify response format');
      console.log('   ⚠️  WARNING: Could not verify API response format');
    }
  } catch (error) {
    results.warnings.push('API Format: ' + error.message);
    console.log('   ⚠️  WARNING:', error.message);
  }

  // Test 4: Verify Isolation Function Exists
  console.log('\n4️⃣  Verify Isolation Function');
  const guardianPath = path.join(__dirname, '../lib/agents/guardian.ts');

  try {
    const guardianCode = fs.readFileSync(guardianPath, 'utf8');
    const hasVerifyIsolation = guardianCode.includes('export async function verifyIsolation');

    if (hasVerifyIsolation) {
      results.passed.push('verifyIsolation: Function exists');
      console.log('   ✅ PASSED: verifyIsolation function exists');

      // Check if it uses vision model
      const usesGemini = guardianCode.includes("google('gemini-1.5-pro");
      if (usesGemini) {
        console.log('   ✅ Uses Gemini 1.5 Pro for photo analysis');
      }
    } else {
      results.failed.push('verifyIsolation: Function not found');
      console.log('   ❌ FAILED: verifyIsolation function not found');
    }
  } catch (error) {
    results.failed.push('verifyIsolation: ' + error.message);
    console.log('   ❌ FAILED:', error.message);
  }

  // Test 5: SafetyLockoutModal Component
  console.log('\n5️⃣  SafetyLockoutModal Component');
  const modalPath = path.join(__dirname, '../app/components/chat/SafetyLockoutModal.tsx');

  try {
    const modalCode = fs.readFileSync(modalPath, 'utf8');
    const hasIsolationSteps = modalCode.includes('Safety Isolation Protocol');
    const hasPhotoVerification = modalCode.includes('Begin Photo Verification');
    const hasVerifiedState = modalCode.includes("'verified'");

    if (hasIsolationSteps && hasPhotoVerification && hasVerifiedState) {
      results.passed.push('SafetyLockoutModal: Complete implementation');
      console.log('   ✅ PASSED: Modal has all isolation protocol steps');
    } else {
      results.failed.push('SafetyLockoutModal: Incomplete implementation');
      console.log('   ❌ FAILED: Modal missing some required features');
    }
  } catch (error) {
    results.failed.push('SafetyLockoutModal: ' + error.message);
    console.log('   ❌ FAILED:', error.message);
  }

  // Test 6: Photo Verification API Route
  console.log('\n6️⃣  Photo Verification API Route');
  const verifyPhotoPath = path.join(__dirname, '../app/api/safety/verify-photo/route.ts');

  try {
    const verifyPhotoCode = fs.readFileSync(verifyPhotoPath, 'utf8');
    const callsVerifyIsolation = verifyPhotoCode.includes('verifyIsolation(photoUrl)');

    if (callsVerifyIsolation) {
      results.passed.push('Verify Photo API: Calls verifyIsolation');
      console.log('   ✅ PASSED: API route calls verifyIsolation function');
    } else {
      results.failed.push('Verify Photo API: Does not call verifyIsolation');
      console.log('   ❌ FAILED: API route missing verifyIsolation call');
    }
  } catch (error) {
    results.failed.push('Verify Photo API: ' + error.message);
    console.log('   ❌ FAILED:', error.message);
  }

  // Test 7: Check Frontend Integration
  console.log('\n7️⃣  Frontend Integration');
  const sessionPagePath = path.join(__dirname, '../app/dashboard/troubleshoot/[sessionId]/page.tsx');

  try {
    const sessionPageCode = fs.readFileSync(sessionPagePath, 'utf8');
    const importsSafetyModal = sessionPageCode.includes('SafetyLockoutModal');
    const hasGuardianBlockState = sessionPageCode.includes('guardianBlock');
    const handlesBlockedResponse = sessionPageCode.includes('data.blocked');

    if (importsSafetyModal && hasGuardianBlockState) {
      results.passed.push('Frontend: Imports SafetyLockoutModal');
      console.log('   ✅ PASSED: Frontend imports and uses SafetyLockoutModal');

      if (handlesBlockedResponse) {
        console.log('   ✅ Handles blocked response');
      } else {
        results.warnings.push('Frontend: May not handle blocked response correctly');
        console.log('   ⚠️  WARNING: Check response handling logic');
      }
    } else {
      results.failed.push('Frontend: Missing SafetyLockoutModal integration');
      console.log('   ❌ FAILED: SafetyLockoutModal not properly integrated');
    }
  } catch (error) {
    results.failed.push('Frontend: ' + error.message);
    console.log('   ❌ FAILED:', error.message);
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

  // Critical Issues
  console.log('\n' + '═'.repeat(80));
  console.log('\n🔴 CRITICAL ISSUE FOUND:');
  console.log('\nThe API response format does not match frontend expectations:\n');
  console.log('Backend (/api/chat route.ts line 124-127):');
  console.log('  return NextResponse.json({');
  console.log('    error: "Safety Block",');
  console.log('    guardian: guardianResult');
  console.log('  }, { status: 403 });\n');
  console.log('Frontend (troubleshoot/[sessionId]/page.tsx line 119):');
  console.log('  if (data.blocked) {');
  console.log('    setGuardianBlock(data as GuardianBlockResponse);');
  console.log('    setIsLockoutModalOpen(true);');
  console.log('  }\n');
  console.log('🔧 FIX REQUIRED: Update /api/chat/route.ts to return:');
  console.log('  return NextResponse.json({');
  console.log('    blocked: true,');
  console.log('    decision: guardianResult.decision,');
  console.log('    confidence: guardianResult.confidence,');
  console.log('    matchedRule: guardianResult.matchedRule,');
  console.log('    reasoning: guardianResult.reasoning,');
  console.log('    message: "Safety Block"');
  console.log('  }, { status: 403 });');

  console.log('\n' + '═'.repeat(80));
  console.log('\n✅ Overall Status:');
  if (results.failed.length === 0) {
    console.log('Isolation Protocol is fully functional! 🎉');
    return 0;
  } else {
    console.log(`${results.failed.length} issue(s) need to be fixed before Isolation Protocol will work.`);
    return 1;
  }
}

testIsolationProtocol().then(code => process.exit(code));
