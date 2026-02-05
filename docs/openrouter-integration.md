# OpenRouter Integration Guide

## Overview

TechGuard AI now supports [OpenRouter](https://openrouter.ai) as an alternative AI provider. OpenRouter is an API aggregator that provides access to various AI models from providers like OpenAI, Anthropic, Google, Meta, and more through a single API interface.

## Benefits of Using OpenRouter

1. **Cost Optimization**: Access to free models for development/testing
2. **Model Diversity**: Choose from 100+ models from different providers
3. **Unified API**: Single API key for multiple model providers
4. **Fallback Options**: Easily switch between models if one is unavailable
5. **Pay-as-you-go**: Only pay for what you use across all models

## Configuration

### 1. Get Your OpenRouter API Key

1. Visit [https://openrouter.ai](https://openrouter.ai)
2. Sign up or log in
3. Navigate to [Keys](https://openrouter.ai/keys)
4. Generate a new API key

### 2. Add API Key to Environment

Add the following to your `.env.local` file:

```bash
# OpenRouter Configuration
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here

# Enable OpenRouter for embeddings
USE_OPENROUTER_EMBEDDINGS=true

# Enable OpenRouter for chat models (diagnostician, guardian)
USE_OPENROUTER_CHAT=true

# Optional: Use free models (recommended for development)
USE_FREE_MODELS=true
```

### 3. Restart Development Server

```bash
npm run dev
```

## Supported Features

### ✅ Embeddings (RAG Search)
- **Model**: `openai/text-embedding-3-small` (via OpenRouter proxy)
- **Used for**: Manual search, safety blacklist matching
- **Cost**: Same as OpenAI direct (~$0.02/1M tokens)

### ✅ Chat Models (Diagnostician Agent)
- **Free Models**:
  - `google/gemini-flash-1.5-8b` (free, fast, good quality)
  - `meta-llama/llama-3.2-11b-instruct` (free, good reasoning)
- **Paid Models**:
  - `anthropic/claude-3-sonnet` (premium quality)
  - `openai/gpt-4-turbo-preview` (structured output)

### ✅ Vision Models (Guardian Agent, Photo Diagnostics)
- **Free Model**: `google/gemini-flash-1.5-8b` (supports vision)
- **Paid Model**: `anthropic/claude-3-opus` (best vision capabilities)

## Model Selection Strategy

The system automatically selects models based on configuration:

```typescript
// In lib/ai/openrouter-config.ts

// Development mode uses free models
USE_FREE_MODELS=true → Free models (Gemini Flash, Llama)

// Production mode uses premium models
USE_FREE_MODELS=false → Paid models (Claude Sonnet, GPT-4)
```

### Recommended Configuration

**Development/Testing:**
```bash
USE_OPENROUTER_CHAT=true
USE_FREE_MODELS=true
# Uses: google/gemini-flash-1.5-8b (free)
```

**Production:**
```bash
USE_OPENROUTER_CHAT=true
USE_FREE_MODELS=false
# Uses: anthropic/claude-3-sonnet (paid, high quality)
```

## Available Models on OpenRouter

### Chat Models (for Diagnostician)

| Model | Provider | Cost | Best For |
|-------|----------|------|----------|
| `google/gemini-flash-1.5-8b` | Google | FREE | Fast responses, good reasoning |
| `meta-llama/llama-3.2-11b-instruct` | Meta | FREE | Open source, solid performance |
| `anthropic/claude-3-sonnet` | Anthropic | $3/M tokens | Premium reasoning, safety |
| `openai/gpt-4-turbo-preview` | OpenAI | $10/M tokens | Structured output, reliability |
| `mistralai/mistral-large` | Mistral | $2/M tokens | European alternative |

### Vision Models (for Photo Analysis)

| Model | Provider | Cost | Best For |
|-------|----------|------|----------|
| `google/gemini-flash-1.5-8b` | Google | FREE | Component identification |
| `anthropic/claude-3-opus` | Anthropic | $15/M tokens | Detailed damage assessment |
| `openai/gpt-4-vision-preview` | OpenAI | $10/M tokens | Wiring analysis |

### Embedding Models

| Model | Provider | Cost | Dimensions |
|-------|----------|------|------------|
| `openai/text-embedding-3-small` | OpenAI | $0.02/M tokens | 1536 |
| `openai/text-embedding-3-large` | OpenAI | $0.13/M tokens | 3072 |

## How It Works

### Architecture

```
TechGuard AI
    ├── Embeddings (lib/rag/embeddings.ts)
    │   └── Uses OpenRouter proxy to OpenAI embeddings
    │
    ├── Diagnostician Agent (lib/agents/diagnostician.ts)
    │   ├── Chat: google/gemini-flash-1.5-8b (free)
    │   └── Vision: google/gemini-flash-1.5-8b (free)
    │
    └── Guardian Agent (lib/agents/guardian.ts)
        ├── Safety Check: Uses embeddings (via OpenRouter)
        └── Photo Verification: google/gemini-flash-1.5-8b (free)
```

### Configuration Files

1. **`lib/ai/openrouter-config.ts`**: Model configuration and selection
2. **`lib/rag/embeddings.ts`**: Embedding generation with OpenRouter support
3. **`lib/agents/diagnostician.ts`**: Diagnostician with OpenRouter models
4. **`lib/agents/guardian.ts`**: Guardian with OpenRouter vision models

## Testing OpenRouter Integration

### Test Embeddings

```bash
# Enable OpenRouter embeddings
echo "USE_OPENROUTER_EMBEDDINGS=true" >> .env.local

# Upload a manual to test embedding generation
# Navigate to: http://localhost:3000/dashboard/organization/manuals
# Upload a PDF and check console logs for:
# "[Embeddings] Using OpenRouter for embeddings"
```

### Test Chat Models

```bash
# Enable OpenRouter chat
echo "USE_OPENROUTER_CHAT=true" >> .env.local
echo "USE_FREE_MODELS=true" >> .env.local

# Start a troubleshooting session
# Navigate to: http://localhost:3000/dashboard/troubleshoot/new
# Send a message and check console logs for:
# "[Diagnostician] Using OpenRouter model: google/gemini-flash-1.5-8b"
```

### Test Vision Models

```bash
# Enable OpenRouter and upload a photo in troubleshooting
# Check console logs for:
# "[Diagnostician] Using OpenRouter model: google/gemini-flash-1.5-8b"
```

## Cost Comparison

### OpenAI Direct vs OpenRouter

**Embeddings (1M tokens):**
- OpenAI Direct: $0.02
- OpenRouter Proxy: $0.02 (same cost)

**Chat (1M tokens):**
- OpenAI GPT-4: $10
- Anthropic Claude Sonnet: $3 (via OpenRouter)
- Google Gemini Flash: FREE (via OpenRouter)

**Vision (1M tokens):**
- OpenAI GPT-4 Vision: $10
- Anthropic Claude Opus: $15
- Google Gemini Flash: FREE (via OpenRouter)

### Estimated Monthly Costs

**Small Organization (100 troubleshooting sessions/month):**
- OpenAI Only: ~$15-20/month
- OpenRouter (free models): ~$0-1/month
- OpenRouter (premium models): ~$5-10/month

**Large Organization (1000 sessions/month):**
- OpenAI Only: ~$150-200/month
- OpenRouter (free models): ~$5-10/month
- OpenRouter (premium models): ~$50-100/month

## Troubleshooting

### Error: "OPENROUTER_API_KEY is not set"

**Solution**: Add your OpenRouter API key to `.env.local`:
```bash
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### Error: "Model not found"

**Solution**: Verify the model name in `lib/ai/openrouter-config.ts`. Check [OpenRouter Models](https://openrouter.ai/models) for available models.

### Rate Limiting

OpenRouter has different rate limits per model:
- Free models: Lower rate limits
- Paid models: Higher rate limits

**Solution**: For high-traffic apps, use paid models or implement request queuing.

### Response Quality Issues

If responses are lower quality with free models:
1. Switch to premium models: `USE_FREE_MODELS=false`
2. Try different free models (edit `lib/ai/openrouter-config.ts`)
3. Use OpenAI/Google directly for critical features

## Advanced Configuration

### Custom Model Selection

Edit `lib/ai/openrouter-config.ts`:

```typescript
export const OPENROUTER_MODELS = {
    CHAT_FAST: 'google/gemini-flash-1.5-8b',        // Your preferred fast model
    CHAT_QUALITY: 'anthropic/claude-3-opus',        // Your preferred quality model
    VISION_FREE: 'google/gemini-flash-1.5-8b',      // Your preferred vision model
}
```

### Per-Agent Configuration

You can configure different models for different agents:

```typescript
// In diagnostician.ts
const modelName = photoUrl
    ? 'anthropic/claude-3-opus'           // Use Claude Opus for vision
    : 'google/gemini-flash-1.5-8b'       // Use Gemini Flash for chat
```

## Best Practices

1. **Development**: Use free models (`USE_FREE_MODELS=true`)
2. **Production**: Use premium models for critical features
3. **Monitoring**: Log model usage to track costs
4. **Fallback**: Keep OpenAI/Google keys as fallback options
5. **Testing**: Test with free models before switching production

## Resources

- **OpenRouter Dashboard**: https://openrouter.ai/activity
- **Model Pricing**: https://openrouter.ai/models
- **API Documentation**: https://openrouter.ai/docs
- **Model Comparison**: https://openrouter.ai/models?o=top-weekly

## Support

For issues with:
- **OpenRouter API**: Contact OpenRouter support
- **TechGuard AI Integration**: Check this documentation or create an issue

## Security Notes

- Keep your `OPENROUTER_API_KEY` secret
- Never commit API keys to version control
- Use environment variables only
- Monitor usage on OpenRouter dashboard
- Set up spending limits on OpenRouter to prevent unexpected costs
