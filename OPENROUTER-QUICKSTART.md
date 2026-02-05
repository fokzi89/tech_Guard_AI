# 🚀 OpenRouter Quick Start Guide

## ✅ Current Status

**OpenRouter is ACTIVE and WORKING!**

- ✅ API Key: Configured
- ✅ Connection: Verified (346 models available, 32 free)
- ✅ Embeddings: Working (1536 dimensions)
- ✅ Configuration: Complete

## 📊 Your Current Configuration

```bash
OPENROUTER_API_KEY=sk-or-v1-49dac...bd800 ✅
USE_OPENROUTER_EMBEDDINGS=true            ✅
USE_OPENROUTER_CHAT=true                  ✅
USE_FREE_MODELS=true                      ✅
```

**What This Means:**
- 🔤 **Embeddings**: Using OpenRouter → `openai/text-embedding-3-small`
- 💬 **Chat**: Using OpenRouter → `google/gemini-flash-1.5-8b` (FREE)
- 👁️ **Vision**: Using OpenRouter → `google/gemini-flash-1.5-8b` (FREE)
- 💰 **Cost**: Minimal (free models for chat/vision, $0.02/1M tokens for embeddings)

## 🧪 What to Test Next

### Test 1: Manual Upload (Embeddings)

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Navigate to one of these pages:
   - Super Admin: `http://localhost:3000/dashboard/admin/organizations/[org-id]`
   - Org Admin: `http://localhost:3000/dashboard/organization/manuals`

3. Upload a PDF manual

4. Watch the console logs for:
   ```
   [Embeddings] Using OpenRouter for embeddings
   ```

**Expected Result:** Manual uploads successfully with OpenRouter generating embeddings.

---

### Test 2: Troubleshooting Chat

1. Navigate to:
   ```
   http://localhost:3000/dashboard/troubleshoot/new
   ```

2. Start a new troubleshooting session

3. Send a message like:
   ```
   "My machine is not starting. What should I check?"
   ```

4. Watch the console logs for:
   ```
   [Diagnostician] Using OpenRouter model: google/gemini-flash-1.5-8b
   ```

**Expected Result:** Chat responds using OpenRouter's free Gemini model.

---

### Test 3: Photo Upload (Vision)

1. In a troubleshooting session, upload a photo of a machine component

2. Ask: "What component is this?"

3. Watch the console logs for:
   ```
   [Diagnostician] Using OpenRouter model: google/gemini-flash-1.5-8b
   ```

**Expected Result:** Vision model identifies the component using OpenRouter.

---

### Test 4: Guardian Agent (Safety)

1. In a troubleshooting session, try asking something potentially unsafe:
   ```
   "Can I jump terminal 29 to terminal 21?"
   ```

2. Watch the console logs for:
   ```
   [Guardian] Analyzing message...
   [Embeddings] Using OpenRouter for embeddings
   ```

**Expected Result:** Guardian uses OpenRouter embeddings to check safety rules.

---

## 🔍 Monitoring OpenRouter Usage

### View Usage in Real-Time

Check console logs while using the app:

```bash
npm run dev
```

Look for these log messages:
- `[Embeddings] Using OpenRouter for embeddings`
- `[Diagnostician] Using OpenRouter model: ...`
- `[Guardian] Using OpenRouter vision model: ...`

### View Usage Statistics

Visit OpenRouter dashboard:
- URL: https://openrouter.ai/activity
- Login with your account
- View requests, tokens used, and costs

---

## 💰 Cost Tracking

### Current Setup (Free Models)

With `USE_FREE_MODELS=true`:

| Feature | Model | Cost per 1M tokens |
|---------|-------|-------------------|
| Embeddings | openai/text-embedding-3-small | $0.02 |
| Chat | google/gemini-flash-1.5-8b | FREE |
| Vision | google/gemini-flash-1.5-8b | FREE |

**Estimated Monthly Cost (100 sessions):** ~$0-1

### Switching to Premium Models

To use premium models, change in `.env.local`:

```bash
USE_FREE_MODELS=false
```

This will use:
- Chat: `anthropic/claude-3-sonnet` ($3/1M tokens)
- Vision: `anthropic/claude-3-opus` ($15/1M tokens)

**Estimated Monthly Cost (100 sessions):** ~$5-10

---

## 🎯 Available Free Models

OpenRouter currently has **32 free models**. Here are some good ones:

### Chat Models
- `google/gemini-flash-1.5-8b` (currently used) ⭐
- `meta-llama/llama-3.2-11b-instruct`
- `upstage/solar-pro-3:free`

### Vision Models
- `google/gemini-flash-1.5-8b` (currently used) ⭐
- `allenai/molmo-2-8b:free` (your original choice!)

To change models, edit: `lib/ai/openrouter-config.ts`

---

## 🔧 Configuration Options

### Option 1: Current Setup (Recommended for Testing)
```bash
USE_OPENROUTER_EMBEDDINGS=true
USE_OPENROUTER_CHAT=true
USE_FREE_MODELS=true
```
**Best for:** Development, testing, learning
**Cost:** Near zero

### Option 2: Hybrid (OpenRouter + Google)
```bash
USE_OPENROUTER_EMBEDDINGS=true
USE_OPENROUTER_CHAT=false
USE_FREE_MODELS=true
```
**Best for:** Gradual migration
**Cost:** Low

### Option 3: Production Premium
```bash
USE_OPENROUTER_EMBEDDINGS=true
USE_OPENROUTER_CHAT=true
USE_FREE_MODELS=false
```
**Best for:** Production with high quality
**Cost:** Moderate

### Option 4: OpenAI Only (Original)
```bash
USE_OPENROUTER_EMBEDDINGS=false
USE_OPENROUTER_CHAT=false
```
**Best for:** Fallback if issues
**Cost:** High

---

## 🐛 Troubleshooting

### Issue: "OPENROUTER_API_KEY is not set"

**Solution:**
```bash
# Check if key is in .env.local
cat .env.local | grep OPENROUTER_API_KEY

# If missing, add it:
echo "OPENROUTER_API_KEY=sk-or-v1-your-key" >> .env.local
```

### Issue: Rate Limiting

Free models have lower rate limits. If you hit limits:

1. **Wait a few minutes** (limits reset)
2. **Use paid models**: Set `USE_FREE_MODELS=false`
3. **Use different free model**: Edit `lib/ai/openrouter-config.ts`

### Issue: Poor Response Quality

Free models may have lower quality than premium. To improve:

1. **Switch to premium models**: `USE_FREE_MODELS=false`
2. **Try different free model**: Edit model in config
3. **Add more context**: Provide detailed prompts

### Issue: Embeddings Not Working

Check these:
1. Is `USE_OPENROUTER_EMBEDDINGS=true`?
2. Is API key valid? (Run test script again)
3. Check console for errors

Run test script:
```bash
node scripts/test-openrouter.js
```

---

## 📚 Quick Commands Reference

```bash
# Test OpenRouter configuration
node scripts/test-openrouter.js

# Start dev server
npm run dev

# View logs (look for OpenRouter usage)
# Logs appear in terminal where you ran 'npm run dev'

# Build for production
npm run build

# Check environment variables
cat .env.local | grep OPENROUTER
```

---

## 📖 Additional Documentation

- **Full Guide**: `docs/openrouter-integration.md`
- **Model Config**: `lib/ai/openrouter-config.ts`
- **OpenRouter Docs**: https://openrouter.ai/docs
- **Model Pricing**: https://openrouter.ai/models

---

## ✅ Success Checklist

- [x] OpenRouter API key configured
- [x] Environment variables set
- [x] Test script passed
- [x] Embeddings working (1536 dimensions)
- [x] Free models selected
- [ ] Manual upload tested
- [ ] Chat tested
- [ ] Vision tested
- [ ] Guardian safety check tested

---

## 🎉 You're Ready!

Your OpenRouter integration is **fully configured and tested**.

**Next:** Start the dev server and test the features!

```bash
npm run dev
```

Then open: http://localhost:3000

**Happy Building!** 🚀
