# Agent Contracts: TechGuard AI

**Date**: 2026-01-19
**Feature**: TechGuard AI - Industrial Safety Troubleshooting Platform
**AI Orchestration**: Vercel AI SDK
**LLM Providers**: Gemini 1.5 Pro / Claude 3.5 Sonnet

## Overview

TechGuard AI uses a multi-agent architecture with three specialized AI agents. Each agent has a specific role and operates with strict input/output contracts. This document defines the interfaces, responsibilities, and interaction patterns for all agents.

## Agent Architecture

```
User Input
    ↓
┌──────────────────┐
│ Guardian Agent   │ ← Safety Blacklist DB
│ (Intercept)      │
└────────┬─────────┘
         ↓
    [BLOCK or ALLOW]
         ↓
┌──────────────────┐
│ Diagnostician    │ ← RAG Manual Search
│ Agent (Assist)   │ ← Photo Analysis (Vision)
└────────┬─────────┘
         ↓
    User Output
         ↓
   (Session End)
         ↓
┌──────────────────┐
│ Curator Agent    │ ← Conversation History
│ (Report)         │
└────────┬─────────┘
         ↓
   CMMS Report
```

---

## 1. Guardian Agent (Safety Intercept)

**Purpose**: Detect dangerous user intents and block AI responses before they reach the user.

**File**: `lib/agents/guardian.ts`

**Trigger**: Runs on EVERY user message before Diagnostician Agent.

### Input Contract

```typescript
interface GuardianInput {
  userMessage: string;                // Raw user input
  machineModel: string;               // Machine being troubleshot
  conversationHistory: Message[];     // Previous conversation for context
  orgId: string;                      // For fetching org-specific blacklist rules
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}
```

### Output Contract

```typescript
interface GuardianOutput {
  decision: 'ALLOW' | 'BLOCK';
  confidence: number;                 // 0.0 - 1.0
  matchedRule?: {
    ruleId: string;
    ruleDescription: string;          // e.g., "Do not jump Term 29 to 21"
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    requiredAction: 'disconnect_power' | 'lockout_tagout' | 'ppe_required';
  };
  reasoning: string;                  // Explanation of decision (for logging)
}
```

### Behavior

1. **Intent Analysis**: Parse user message to detect safety-critical keywords ("jump", "bypass", "connect", "test across")
2. **Blacklist Check**: Generate embedding for user message, search `safety_blacklist` table using vector similarity
3. **Similarity Threshold**: Match if similarity > 0.85 (configurable)
4. **Context Awareness**: Consider previous conversation (user might reference "it" or "this terminal")
5. **Decision**: Return BLOCK if match found, ALLOW otherwise

### System Prompt

```
You are a Safety Guardian for industrial machinery troubleshooting.
Your ONLY job is to detect if a user's request involves a dangerous procedure.

Dangerous procedures include but are not limited to:
- Jumping terminals or wires
- Bypassing safety interlocks
- Testing live voltage without proper isolation
- Connecting incompatible voltage sources

If you detect a dangerous intent, you MUST return BLOCK with the matched safety rule.
If the request is safe, return ALLOW.

Do NOT provide troubleshooting advice. That is handled by a different agent.
Your role is purely safety enforcement.
```

### Example Flow

**Input**:
```json
{
  "userMessage": "Can I jump Terminal 29 to Terminal 21 to test?",
  "machineModel": "Domino M230i",
  "conversationHistory": [],
  "orgId": "org_123"
}
```

**Processing**:
1. Detect "jump" keyword
2. Extract terminals: "29" and "21"
3. Search blacklist for Domino M230i
4. Find rule: "Do not connect Internal 0V (Term 21) to External 24V (Term 29)"
5. Similarity score: 0.92 (above threshold)

**Output**:
```json
{
  "decision": "BLOCK",
  "confidence": 0.92,
  "matchedRule": {
    "ruleId": "rule_456",
    "ruleDescription": "Do not connect Internal 0V (Term 21) to External 24V (Term 29)",
    "severity": "CRITICAL",
    "requiredAction": "disconnect_power"
  },
  "reasoning": "User intent matches blacklisted procedure for Domino M230i"
}
```

---

## 2. Diagnostician Agent (Troubleshooting Assistant)

**Purpose**: Provide step-by-step troubleshooting guidance based on machine manuals.

**File**: `lib/agents/diagnostician.ts`

**Trigger**: Runs after Guardian Agent returns ALLOW.

### Input Contract

```typescript
interface DiagnosticianInput {
  userMessage: string;
  machineModel: string;
  conversationHistory: Message[];
  photoUrl?: string;                  // If user uploaded a photo
  retrievedContext: ManualChunk[];    // From RAG search
  orgId: string;
}

interface ManualChunk {
  chunkId: string;
  manualTitle: string;
  content: string;
  pageNumber: number | null;
  similarity: number;
}
```

### Output Contract

```typescript
interface DiagnosticianOutput {
  response: string;                   // Troubleshooting guidance for user
  citedManuals: string[];             // Manual IDs referenced in response
  nextSteps: string[];                // Suggested next actions
  requiresPhoto: boolean;             // True if visual inspection needed
  photoPrompt?: string;               // What to photograph
  metadata: {
    responseType: 'diagnostic' | 'explanation' | 'procedure';
    confidence: number;
  };
}
```

### Behavior

1. **Context Retrieval**: Receive top 3-5 manual chunks from RAG search
2. **Photo Analysis** (if provided): Use vision model to identify components, wiring, damage
3. **Response Generation**: Provide clear, step-by-step guidance citing manual sections
4. **Safety Mindset**: Remind users about safety procedures (PPE, lockout/tagout)
5. **Ask for Clarification**: If user question is ambiguous, ask clarifying questions

### System Prompt

```
You are an expert industrial machinery technician assistant.
Your goal is to help field technicians safely diagnose and repair legacy equipment.

Guidelines:
1. Provide step-by-step instructions in simple, clear language
2. ALWAYS reference the relevant manual section when giving advice
3. Remind users about safety precautions (PPE, lockout/tagout)
4. If you're uncertain, ask clarifying questions rather than guessing
5. Encourage users to upload photos if visual inspection would help
6. Break complex procedures into numbered steps
7. Use the exact terminology from the machine manual

Available context:
- Machine manuals (retrieved via RAG based on user question)
- Conversation history
- User-uploaded photos (if provided)

If a photo is provided, analyze it to:
- Identify visible components (terminals, connectors, PCBs)
- Detect wear, damage, or incorrect wiring
- Cross-reference with wiring diagrams in the manual

CRITICAL: If you detect something that might be unsafe, mention it, but remember
that the Guardian Agent has already cleared this request. Do not refuse to answer.
```

### Example Flow

**Input**:
```json
{
  "userMessage": "The printer won't power on. What should I check first?",
  "machineModel": "Domino M230i",
  "conversationHistory": [],
  "retrievedContext": [
    {
      "chunkId": "chunk_789",
      "manualTitle": "Domino M230i Service Manual",
      "content": "Power-on troubleshooting: 1) Check main power switch at rear panel. 2) Verify incoming voltage at terminal block TB1. Expected: 24VDC ±10%...",
      "pageNumber": 45,
      "similarity": 0.91
    }
  ],
  "orgId": "org_123"
}
```

**Output**:
```json
{
  "response": "Let's troubleshoot the power issue step by step:\n\n1. **Check the main power switch** at the rear panel. Make sure it's in the ON position.\n\n2. **Verify incoming voltage** at terminal block TB1. You should see 24VDC ±10% (21.6V to 26.4V).\n\n3. If voltage is present but printer won't power on, check the main fuse (F1) on the power supply board.\n\n(Reference: Domino M230i Service Manual, Page 45)\n\nDo you have a multimeter to check the voltage?",
  "citedManuals": ["manual_123"],
  "nextSteps": [
    "Check main power switch position",
    "Measure voltage at TB1",
    "Inspect fuse F1"
  ],
  "requiresPhoto": false,
  "metadata": {
    "responseType": "diagnostic",
    "confidence": 0.91
  }
}
```

---

## 3. Curator Agent (Report Generator)

**Purpose**: Generate CMMS-compatible service reports from completed troubleshooting sessions.

**File**: `lib/agents/curator.ts`

**Trigger**: When user clicks "Generate Report" after resolving incident.

### Input Contract

```typescript
interface CuratorInput {
  incidentId: string;
  conversationHistory: Message[];     // Full conversation
  safetyInterventions: SafetyEvent[]; // Any safety lockouts that occurred
  machineModel: string;
  externalTicketId?: string;          // CMMS work order #
}

interface SafetyEvent {
  timestamp: string;
  rule: string;
  userAttempt: string;
  resolutionAction: string;           // "power_disconnected", "lockout_completed"
}
```

### Output Contract

```typescript
interface CuratorOutput {
  asFound: string;                    // Initial symptoms
  workPerformed: string;              // Bullet-point list of actions taken
  asLeft: string;                     // Final machine status
  formattedReport: string;            // Full formatted text for clipboard
  metadata: {
    totalSteps: number;
    duration: string;                 // HH:MM format
    safetyEventsCount: number;
  };
}
```

### Behavior

1. **Conversation Analysis**: Parse full conversation to extract key events
2. **As Found**: Identify initial problem description (usually first user message)
3. **Work Performed**: Extract all diagnostic tests, repairs, parts replaced
4. **As Left**: Determine final machine status (working, partially fixed, needs parts)
5. **Safety Documentation**: Include any safety interventions in Work Performed section
6. **Format**: Generate clean, professional text suitable for copy/paste into CMMS

### System Prompt

```
You are a service report writer for industrial machinery technicians.
Your job is to summarize troubleshooting sessions into CMMS-compatible service reports.

Report Format (CMMS Standard):
TICKET: [Work Order #]
MACHINE: [Model]

AS FOUND:
[Initial symptom/problem description from technician]

WORK PERFORMED:
• [Action 1]
• [Action 2]
• [Action 3]
...

AS LEFT:
[Final machine status and any follow-up needed]

Guidelines:
1. Keep it concise and professional
2. Use bullet points for Work Performed (easier to scan)
3. Include specific measurements, part numbers if mentioned
4. Document any safety interventions that occurred
5. If machine is not fully fixed, clearly state what's needed
6. Use past tense ("Checked voltage at TB1", not "Check voltage")
7. Avoid conversational language ("I", "you", "thanks")

Extract ONLY the technical actions, not the conversation.
Focus on what was DONE, not what was discussed.
```

### Example Flow

**Input**:
```json
{
  "incidentId": "incident_123",
  "conversationHistory": [
    {"role": "user", "content": "Printer won't power on"},
    {"role": "assistant", "content": "Let's check the power switch..."},
    {"role": "user", "content": "Power switch is on, still no power"},
    {"role": "assistant", "content": "Measure voltage at TB1..."},
    {"role": "user", "content": "Getting 23.8V at TB1"},
    {"role": "assistant", "content": "Voltage is good. Check fuse F1..."},
    {"role": "user", "content": "Fuse F1 is blown! Replaced it and printer powers on now"}
  ],
  "safetyInterventions": [],
  "machineModel": "Domino M230i",
  "externalTicketId": "WO-45678"
}
```

**Output**:
```json
{
  "asFound": "Printer would not power on. Main power switch in ON position but no response from unit.",
  "workPerformed": "• Verified main power switch in ON position\n• Measured incoming voltage at terminal block TB1: 23.8VDC (within spec)\n• Inspected main fuse F1 on power supply board\n• Found fuse F1 blown\n• Replaced fuse F1 with 5A fast-blow fuse (part# XYZ-123)\n• Powered on unit successfully",
  "asLeft": "Printer fully operational. Powered on successfully after fuse replacement. Recommend monitoring for recurring fuse failures which may indicate downstream short circuit.",
  "formattedReport": "TICKET: WO-45678\nMACHINE: Domino M230i\n\nAS FOUND:\nPrinter would not power on. Main power switch in ON position but no response from unit.\n\nWORK PERFORMED:\n• Verified main power switch in ON position\n• Measured incoming voltage at terminal block TB1: 23.8VDC (within spec)\n• Inspected main fuse F1 on power supply board\n• Found fuse F1 blown\n• Replaced fuse F1 with 5A fast-blow fuse (part# XYZ-123)\n• Powered on unit successfully\n\nAS LEFT:\nPrinter fully operational. Powered on successfully after fuse replacement. Recommend monitoring for recurring fuse failures which may indicate downstream short circuit.",
  "metadata": {
    "totalSteps": 6,
    "duration": "00:12",
    "safetyEventsCount": 0
  }
}
```

---

## Agent Interaction Patterns

### Pattern 1: Normal Flow (Safe Query)

```
User: "How do I check the print head temperature?"
   ↓
Guardian Agent → ALLOW (no safety risk)
   ↓
Diagnostician Agent → "Here's how to check the print head temp: 1) ..."
   ↓
User receives guidance
```

### Pattern 2: Safety Intercept Flow

```
User: "Can I jump Terminal 29 to 21 to test?"
   ↓
Guardian Agent → BLOCK (matches blacklist)
   ↓
UI displays SafetyLockoutModal (chat input disabled)
   ↓
User uploads photo of disconnected power
   ↓
Photo verified → Unlock chat
   ↓
Diagnostician Agent → "Now that power is disconnected, here's the safe test procedure..."
```

### Pattern 3: Photo Analysis Flow

```
User: "I think the wiring might be wrong" + uploads photo
   ↓
Guardian Agent → ALLOW
   ↓
Diagnostician Agent (with vision model)
   ↓
Analyzes photo: identifies terminals, compares to wiring diagram
   ↓
"I see terminals 5, 7, and 9 in your photo. According to the wiring diagram on page 23, terminal 7 should be connected to..."
```

### Pattern 4: Report Generation Flow

```
User clicks "Generate Report" button
   ↓
Curator Agent receives full conversation
   ↓
Parses conversation into As Found / Work Performed / As Left
   ↓
Returns formatted CMMS report
   ↓
UI displays ServiceReportCard with "Copy to Clipboard" button
```

---

## Agent Error Handling

All agents must handle errors gracefully:

```typescript
interface AgentError {
  agentName: 'guardian' | 'diagnostician' | 'curator';
  errorType: 'timeout' | 'api_error' | 'validation_error' | 'safety_check_failed';
  message: string;
  retryable: boolean;
}
```

**Fallback Behavior**:
- **Guardian Agent**: If error occurs, default to BLOCK (fail closed for safety)
- **Diagnostician Agent**: If error, return apology message and suggest manual lookup
- **Curator Agent**: If error, return basic template with manual entry instructions

---

## Agent Testing Requirements

Each agent must have:

1. **Unit Tests**: Test core logic independently
2. **Integration Tests**: Test with real database and LLM calls (using test API keys)
3. **Safety Tests**:
   - Guardian: "Death Jump Test" - verify it blocks dangerous terminal jump
   - Diagnostician: Verify it doesn't provide dangerous advice even if asked creatively
   - Curator: Verify safety events are documented in reports

**Test Coverage Targets**:
- Guardian Agent: 90% (safety-critical)
- Diagnostician Agent: 70%
- Curator Agent: 60%

---

## Agent Performance SLAs

| Agent          | Max Latency (p95) | Timeout    |
|----------------|-------------------|------------|
| Guardian       | 500ms             | 2s         |
| Diagnostician  | 3s                | 10s        |
| Curator        | 5s                | 15s        |

**Monitoring**: Track latency, error rate, and token usage for each agent.

---

## Future Agent Enhancements (Post-MVP)

1. **Feedback Loop Agent**: Learn from technician feedback to improve responses
2. **Parts Recommendation Agent**: Suggest replacement parts based on diagnosis
3. **Maintenance Scheduler Agent**: Recommend preventive maintenance schedules
4. **Multi-Language Agent**: Translate manuals and provide troubleshooting in multiple languages
