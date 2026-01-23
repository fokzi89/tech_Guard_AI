# TechGuard AI - API Routes Documentation

## Overview

This directory contains all API routes for TechGuard AI's backend services. All routes follow security best practices with authentication, validation, and RLS enforcement.

## Architecture

```
User Request
    ↓
Authentication (Supabase Auth)
    ↓
Validation (Zod)
    ↓
Guardian Agent (Safety Check)
    ↓ ALLOW
Diagnostician Agent (AI Response)
    ↓
Stream to Client
```

## API Routes

### Chat Routes

#### POST `/api/chat`
**Main troubleshooting chat endpoint**

**Flow:**
1. Validates user message and incident ID
2. Runs Guardian Agent (safety check)
3. If BLOCK → returns safety warning
4. If ALLOW → runs Diagnostician Agent
5. Streams AI response back to client

**Request:**
```typescript
{
  message: string;           // User question (1-5000 chars)
  incidentId: string;        // UUID of troubleshooting session
  machineModel: string;      // e.g., "Domino M230i"
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  photoUrl?: string;         // Optional photo for analysis
}
```

**Response (if BLOCKED):**
```json
{
  "blocked": true,
  "decision": "BLOCK",
  "confidence": 0.98,
  "matchedRule": {
    "ruleId": "TERM_JUMP_001",
    "ruleDescription": "Dangerous terminal jump detected",
    "severity": "CRITICAL",
    "requiredAction": "disconnect_power"
  },
  "reasoning": "Detected dangerous terminal operation...",
  "message": "⚠️ SAFETY WARNING: This request has been blocked..."
}
```

**Response (if ALLOWED):**
Streams AI response using Vercel AI SDK's streaming format.

**Security:**
- Requires authentication
- RLS enforced on incident access
- Logs all Guardian decisions
- Validates all inputs with Zod

---

#### POST `/api/chat/session`
**Create new troubleshooting session**

**Request:**
```typescript
{
  machineModel: string;      // Required
  workOrderId?: string;      // Optional work order/ticket ID
  description?: string;      // Optional problem description
  location?: string;         // Optional equipment location
}
```

**Response:**
```json
{
  "success": true,
  "incident": {
    "id": "uuid",
    "machineModel": "Domino M230i",
    "workOrderId": "WO-12345",
    "status": "in_progress",
    "createdAt": "2025-01-22T..."
  }
}
```

**What it does:**
- Creates new `incidents` record
- Adds initial system message
- Returns incident ID for chat

---

#### GET `/api/chat/session?incidentId=xxx`
**Get session details and conversation history**

**Query Parameters:**
- `incidentId` (required) - UUID of session

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "uuid",
    "machineModel": "Domino M230i",
    "workOrderId": "WO-12345",
    "status": "in_progress",
    "technician": {
      "full_name": "John Doe",
      "email": "john@example.com"
    },
    "createdAt": "2025-01-22T...",
    "updatedAt": "2025-01-22T..."
  },
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "What is the normal voltage?",
      "is_blocked": false,
      "created_at": "2025-01-22T..."
    }
  ]
}
```

---

### Safety Routes

#### POST `/api/safety/check`
**Real-time safety check (Guardian Agent)**

Use this for:
- Real-time validation as user types
- Pre-flight checks before sending
- Safety indicator in UI

**Request:**
```typescript
{
  message: string;           // Message to check
  machineModel: string;      // Machine model
  incidentId?: string;       // Optional incident ID
}
```

**Response:**
```json
{
  "safe": true,              // Boolean: safe to send?
  "decision": "ALLOW",       // or "BLOCK"
  "confidence": 0.95,
  "reasoning": "No safety-critical keywords detected",
  "matchedRule": null,       // or rule object if blocked
  "processingTimeMs": 45
}
```

**Use Case:**
```typescript
// Show safety indicator as user types
const checkSafety = async (message: string) => {
  const res = await fetch('/api/safety/check', {
    method: 'POST',
    body: JSON.stringify({ message, machineModel }),
  });
  const data = await res.json();

  if (!data.safe) {
    // Show warning icon
  }
};
```

---

#### POST `/api/safety/verify-photo`
**Photo verification for Isolation Protocol**

**Request:**
```typescript
{
  photoUrl: string;          // URL of uploaded photo
  incidentId: string;        // UUID of session
  machineModel: string;      // Machine model
  verificationType?: 'power_disconnected' | 'lockout_applied' | 'general_safety';
}
```

**Response:**
```json
{
  "verified": true,
  "confidence": 0.9,
  "analysis": "The power cable is visibly disconnected...",
  "message": "Power disconnection verified. You may proceed safely.",
  "details": [
    "Power appears to be disconnected",
    "Equipment appears to be de-energized",
    "Safe to proceed with troubleshooting"
  ]
}
```

**Verification Types:**

1. **power_disconnected** (default)
   - Checks if power cable is unplugged
   - Verifies no indicator lights are on
   - Confirms de-energized state

2. **lockout_applied**
   - Verifies lockout device is visible
   - Checks for tagout tag

3. **general_safety**
   - General safety condition check

**What it does:**
- Analyzes photo using vision model (Gemini 1.5 Pro)
- Determines if safety isolation is verified
- Logs verification attempt
- Unlocks chat if verification passes

---

## Error Handling

All routes return consistent error responses:

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "path": ["message"]
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "error": "Incident not found or access denied"
}
```

### 500 Internal Server Error
```json
{
  "error": "An error occurred while processing your request..."
}
```

**Safety-First Error Handling:**
- Guardian Agent failures → default to BLOCK
- Photo verification errors → reject verification
- All errors logged for monitoring

---

## Authentication

All routes require authentication via Supabase Auth.

**Client-side:**
```typescript
const supabase = createClient();
const { data: { session } } = await supabase.auth.getSession();

fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // Session cookie automatically sent
  },
  body: JSON.stringify({ ... }),
});
```

---

## Rate Limiting

**TODO**: Implement rate limiting (T033)

Recommended limits:
- `/api/chat`: 30 requests/minute per user
- `/api/safety/check`: 60 requests/minute per user
- `/api/safety/verify-photo`: 10 requests/minute per user

---

## Logging

All routes log important events:

**Guardian Decisions:**
```
[Guardian] Analyzing message for safety...
[Guardian] Decision: BLOCK { confidence: 0.98, processingTime: 47ms }
[Guardian] BLOCKED dangerous request
```

**Diagnostician Responses:**
```
[Diagnostician] Generating response...
[Diagnostician] Response saved to database
```

**Photo Verification:**
```
[Photo Verification] Analyzing photo...
[Photo Verification] Result: { verified: true, confidence: 0.9 }
```

**Errors:**
```
[Chat API] Error: { error, timestamp, duration }
```

---

## Testing

### Unit Tests
```bash
# Test individual routes
npm test app/api/chat/route.test.ts
```

### Integration Tests
```bash
# Test full flow
npm test tests/integration/chat-flow.test.ts
```

### E2E Tests
```bash
# Test from UI
npm run test:e2e tests/e2e/death-jump.spec.ts
```

---

## Performance

**Target Latencies:**
- Guardian Agent: < 2 seconds
- Diagnostician Agent (streaming): First token < 1 second
- Photo verification: < 5 seconds

**Monitoring:**
- All routes log processing time
- Guardian logs `processingTimeMs`
- Chat route logs total duration

---

## Security Checklist

✅ Authentication required
✅ Input validation (Zod)
✅ RLS enforced (Supabase)
✅ SQL injection protected (parameterized queries)
✅ XSS protected (Next.js escaping)
✅ CSRF protected (SameSite cookies)
✅ Rate limiting (TODO)
✅ Error messages don't leak sensitive info
✅ All Guardian decisions logged (audit trail)
✅ Fail-closed on errors

---

## Common Integration Patterns

### 1. Start a new session and chat
```typescript
// 1. Create session
const sessionRes = await fetch('/api/chat/session', {
  method: 'POST',
  body: JSON.stringify({
    machineModel: 'Domino M230i',
    workOrderId: 'WO-12345',
  }),
});
const { incident } = await sessionRes.json();

// 2. Send message
const chatRes = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    message: 'What is the normal voltage?',
    incidentId: incident.id,
    machineModel: incident.machineModel,
  }),
});

// 3. Handle streaming response
const reader = chatRes.body.getReader();
// ... process stream
```

### 2. Real-time safety indicator
```typescript
const [isSafe, setIsSafe] = useState(true);

const handleMessageChange = async (message: string) => {
  const res = await fetch('/api/safety/check', {
    method: 'POST',
    body: JSON.stringify({ message, machineModel }),
  });
  const { safe } = await res.json();
  setIsSafe(safe);
};
```

### 3. Photo verification flow
```typescript
// 1. Upload photo (to Supabase Storage or CDN)
const photoUrl = await uploadPhoto(file);

// 2. Verify isolation
const res = await fetch('/api/safety/verify-photo', {
  method: 'POST',
  body: JSON.stringify({
    photoUrl,
    incidentId,
    machineModel,
    verificationType: 'power_disconnected',
  }),
});

const { verified, message } = await res.json();

if (verified) {
  // Unlock chat, allow dangerous procedure
} else {
  // Show error, request new photo
}
```

---

## Troubleshooting

**Guardian always blocks safe messages:**
- Check `safety_blacklist` table for overly broad rules
- Review Guardian Agent threshold (default 0.85)
- Check logs for `matchedRule`

**Diagnostician doesn't cite manuals:**
- Verify `manuals` table has data with embeddings
- Check RAG search is returning results
- Review Diagnostician system prompt

**Photo verification always fails:**
- Check photo URL is accessible
- Verify vision model API key is configured
- Review photo quality (lighting, focus)
- Check verification context in code

**Streaming doesn't work:**
- Ensure using Vercel AI SDK properly
- Check headers: `Content-Type: text/event-stream`
- Verify client handles streaming correctly

---

## Next Steps

- [ ] Implement rate limiting
- [ ] Add request/response logging to database
- [ ] Add performance monitoring
- [ ] Add retry logic for AI API failures
- [ ] Add caching for frequent queries
- [ ] Add WebSocket support for real-time updates
