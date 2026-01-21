# Testing Guide for Phase 2 Additions

## 🧪 Quick Testing Instructions

### 1. **Test UI Components** (Easiest - Visual Testing)

Visit the test page I created:
```
http://localhost:3000/test-components
```

**What to test:**
- ✅ Button variants (default, destructive, outline, etc.)
- ✅ Button loading state
- ✅ Input validation and error messages
- ✅ Modal open/close with ESC key
- ✅ File upload drag-and-drop

---

### 2. **Test RAG Engine** (Manual Testing)

Create a test script to verify embeddings and PDF processing:

```typescript
// test-rag.ts
import { generateEmbedding, cosineSimilarity } from '@/lib/rag/embeddings'
import { extractTextFromPDF, extractSafetyWarnings } from '@/lib/rag/manual-processor'
import fs from 'fs'

async function testRAG() {
  // Test 1: Generate embeddings
  const text1 = "How to troubleshoot a printer"
  const text2 = "Printer troubleshooting guide"
  const text3 = "Cooking recipes"
  
  const embedding1 = await generateEmbedding(text1)
  const embedding2 = await generateEmbedding(text2)
  const embedding3 = await generateEmbedding(text3)
  
  console.log('Similarity (printer texts):', cosineSimilarity(embedding1, embedding2))
  console.log('Similarity (printer vs cooking):', cosineSimilarity(embedding1, embedding3))
  
  // Test 2: PDF extraction (if you have a PDF)
  // const pdfBuffer = fs.readFileSync('path/to/manual.pdf')
  // const { text, totalPages } = await extractTextFromPDF(pdfBuffer)
  // console.log('Extracted pages:', totalPages)
  
  // Test 3: Safety warnings
  const manualText = `
    WARNING: Do not touch live electrical components.
    DANGER: High voltage present. Risk of electrocution.
    CAUTION: Wear protective equipment.
  `
  const warnings = extractSafetyWarnings(manualText)
  console.log('Found warnings:', warnings)
}

testRAG()
```

**Run with:**
```bash
npx tsx test-rag.ts
```

---

### 3. **Test Validation Schemas** (API Testing)

Create a test API route:

```typescript
// app/api/test-validation/route.ts
import { NextRequest } from 'next/server'
import { validateRequest, loginSchema } from '@/lib/utils/validation'
import { createErrorResponse } from '@/lib/utils/errors'

export async function POST(request: NextRequest) {
  try {
    // This will validate the request body
    const data = await validateRequest(request, loginSchema)
    
    return Response.json({
      success: true,
      message: 'Validation passed!',
      data
    })
  } catch (error) {
    return createErrorResponse(400, 'Validation failed', 'VALIDATION_ERROR')
  }
}
```

**Test with curl:**
```bash
# Valid request
curl -X POST http://localhost:3000/api/test-validation \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Invalid request (should fail)
curl -X POST http://localhost:3000/api/test-validation \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","password":"short"}'
```

---

### 4. **Test Security Headers** (Browser DevTools)

1. Open your browser DevTools (F12)
2. Go to **Network** tab
3. Visit any page: `http://localhost:3000`
4. Click on the request
5. Check **Response Headers** - you should see:
   - `Content-Security-Policy`
   - `Strict-Transport-Security`
   - `X-Frame-Options: SAMEORIGIN`
   - `X-Content-Type-Options: nosniff`

---

### 5. **Test Rate Limiting** (Optional - Requires Redis)

If you have Upstash Redis configured:

```typescript
// app/api/test-rate-limit/route.ts
import { NextRequest } from 'next/server'
import { rateLimit, apiRateLimiter } from '@/lib/utils/rate-limit'

export async function GET(request: NextRequest) {
  // Check rate limit
  const rateLimitResponse = await rateLimit(request, apiRateLimiter)
  if (rateLimitResponse) {
    return rateLimitResponse // Returns 429 if rate limited
  }

  return Response.json({ message: 'Request allowed!' })
}
```

**Test by making multiple requests:**
```bash
for i in {1..10}; do curl http://localhost:3000/api/test-rate-limit; done
```

---

## 🎯 **Recommended Testing Order**

1. **Start here**: Visit `/test-components` page (visual, easy)
2. **Then**: Check security headers in DevTools
3. **Advanced**: Test validation with API routes
4. **Optional**: Test RAG engine with sample PDFs

---

## 📝 **Environment Variables Needed**

For full testing, add to `.env.local`:

```env
# OpenAI (for embeddings)
OPENAI_API_KEY=sk-...

# Upstash Redis (optional - for rate limiting)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

---

## ✅ **Quick Verification Checklist**

- [ ] UI components render correctly at `/test-components`
- [ ] Security headers appear in Network tab
- [ ] Validation schemas reject invalid data
- [ ] File upload accepts and validates files
- [ ] Modal opens/closes with ESC key
- [ ] Buttons show loading states

**Most important**: Just visit `http://localhost:3000/test-components` to see everything working!
