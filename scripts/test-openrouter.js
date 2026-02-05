/**
 * Test OpenRouter Integration
 * This script tests the OpenRouter configuration for TechGuard AI
 */

require('dotenv').config({ path: '.env.local' });

const REQUIRED_ENV_VARS = {
  OPENROUTER_API_KEY: 'OpenRouter API Key',
  USE_OPENROUTER_EMBEDDINGS: 'OpenRouter Embeddings Flag',
  USE_OPENROUTER_CHAT: 'OpenRouter Chat Flag',
};

console.log('🔧 TechGuard AI - OpenRouter Integration Test\n');
console.log('=' .repeat(60));

// 1. Check Environment Variables
console.log('\n📋 Step 1: Checking Environment Variables\n');

let allVarsPresent = true;
for (const [key, description] of Object.entries(REQUIRED_ENV_VARS)) {
  const value = process.env[key];
  const isSet = !!value;
  const status = isSet ? '✅' : '❌';

  console.log(`${status} ${description} (${key})`);

  if (isSet) {
    if (key === 'OPENROUTER_API_KEY') {
      console.log(`   Value: ${value.substring(0, 20)}...${value.substring(value.length - 8)}`);
    } else {
      console.log(`   Value: ${value}`);
    }
  } else {
    console.log(`   Status: NOT SET`);
    allVarsPresent = false;
  }
  console.log();
}

if (!allVarsPresent) {
  console.error('❌ Missing required environment variables. Please check your .env.local file.\n');
  process.exit(1);
}

// 2. Test OpenRouter API Connection
console.log('\n🌐 Step 2: Testing OpenRouter API Connection\n');

async function testOpenRouterConnection() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Successfully connected to OpenRouter API');
      console.log(`   Available models: ${data.data?.length || 0}`);

      // Show some free models
      const freeModels = data.data?.filter(m => m.pricing?.prompt === '0') || [];
      console.log(`   Free models available: ${freeModels.length}`);

      if (freeModels.length > 0) {
        console.log('\n   📦 Sample free models:');
        freeModels.slice(0, 3).forEach(model => {
          console.log(`      - ${model.id}`);
        });
      }

      return true;
    } else {
      const error = await response.text();
      console.error('❌ Failed to connect to OpenRouter API');
      console.error(`   Status: ${response.status}`);
      console.error(`   Error: ${error}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error connecting to OpenRouter:', error.message);
    return false;
  }
}

// 3. Test Embeddings Configuration
console.log('\n🔤 Step 3: Testing Embeddings Configuration\n');

async function testEmbeddings() {
  const { generateEmbedding } = await import('../lib/rag/embeddings.ts');

  try {
    console.log('   Testing embedding generation with text: "test machine troubleshooting"');
    const embedding = await generateEmbedding('test machine troubleshooting');

    if (embedding && embedding.length === 1536) {
      console.log('✅ Embeddings working correctly');
      console.log(`   Generated embedding with ${embedding.length} dimensions`);
      console.log(`   First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);
      return true;
    } else {
      console.error('❌ Embedding generation failed or returned wrong dimensions');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing embeddings:', error.message);
    return false;
  }
}

// 4. Show Configuration Summary
console.log('\n⚙️  Step 4: Configuration Summary\n');

function showConfigSummary() {
  console.log('Current Configuration:');
  console.log(`   • Embeddings Provider: ${process.env.USE_OPENROUTER_EMBEDDINGS === 'true' ? 'OpenRouter' : 'OpenAI Direct'}`);
  console.log(`   • Chat Models Provider: ${process.env.USE_OPENROUTER_CHAT === 'true' ? 'OpenRouter' : 'Google Gemini'}`);
  console.log(`   • Model Tier: ${process.env.USE_FREE_MODELS === 'true' ? 'Free Models (Development)' : 'Premium Models (Production)'}`);

  if (process.env.USE_OPENROUTER_CHAT === 'true') {
    const chatModel = process.env.USE_FREE_MODELS === 'true'
      ? 'google/gemini-flash-1.5-8b (FREE)'
      : 'anthropic/claude-3-sonnet (PAID)';
    console.log(`   • Chat Model: ${chatModel}`);
  }

  if (process.env.USE_OPENROUTER_EMBEDDINGS === 'true') {
    console.log(`   • Embedding Model: openai/text-embedding-3-small (via OpenRouter)`);
  }
}

showConfigSummary();

// 5. Run All Tests
console.log('\n🧪 Step 5: Running Integration Tests\n');

async function runAllTests() {
  let allTestsPassed = true;

  // Test API connection
  const apiConnected = await testOpenRouterConnection();
  if (!apiConnected) allTestsPassed = false;

  console.log();

  // Test embeddings if enabled
  if (process.env.USE_OPENROUTER_EMBEDDINGS === 'true') {
    const embeddingsWork = await testEmbeddings();
    if (!embeddingsWork) allTestsPassed = false;
  } else {
    console.log('⚠️  Embeddings: Skipped (USE_OPENROUTER_EMBEDDINGS=false)');
  }

  // Final summary
  console.log('\n' + '='.repeat(60));
  if (allTestsPassed) {
    console.log('\n✅ All tests passed! OpenRouter is configured correctly.\n');
    console.log('Next steps:');
    console.log('  1. Start dev server: npm run dev');
    console.log('  2. Upload a manual to test embeddings');
    console.log('  3. Start a troubleshooting session to test chat');
    console.log('  4. Check console logs for OpenRouter usage\n');
  } else {
    console.log('\n❌ Some tests failed. Please check the errors above.\n');
    process.exit(1);
  }
}

runAllTests().catch(error => {
  console.error('\n❌ Test script error:', error);
  process.exit(1);
});
