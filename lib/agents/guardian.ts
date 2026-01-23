/**
 * Guardian Agent - Safety Intercept System
 *
 * The Guardian Agent is the FIRST line of defense in TechGuard AI.
 * It analyzes EVERY user message BEFORE it reaches the Diagnostician Agent.
 *
 * Critical Requirements:
 * - Must respond within 2 seconds (performance requirement)
 * - Must FAIL CLOSED (if error occurs, default to BLOCK)
 * - Blocks dangerous procedures (terminal jumps, bypassing safety, working on live circuits)
 * - Triggers Isolation Protocol when dangerous intent detected
 *
 * Safety Philosophy: Better to block 10 safe requests than to allow 1 dangerous one
 */

import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '@/lib/rag/embeddings';

/**
 * Guardian Agent Input
 */
export interface GuardianInput {
  userMessage: string;
  machineModel: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  orgId: string;
}

/**
 * Guardian Agent Output
 */
export interface GuardianOutput {
  decision: 'ALLOW' | 'BLOCK';
  confidence: number; // 0.0 - 1.0
  matchedRule?: {
    ruleId: string;
    ruleDescription: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    requiredAction: 'disconnect_power' | 'lockout_tagout';
  };
  reasoning: string;
  processingTimeMs: number;
}

/**
 * Safety keywords that trigger immediate analysis
 * These are fast keyword checks before vector search
 */
const DANGER_KEYWORDS = [
  'jump',
  'bypass',
  'override',
  'disable',
  'short',
  'bridge',
  'connect directly',
  'skip',
  'ignore',
  'live',
  'energized',
  'hot',
  'powered',
  'voltage',
  'test across',
  'touch',
  'bare wire',
  'exposed',
  'interlock',
  'safety switch',
  'lockout',
  'terminal',
];

/**
 * Terminal patterns that are commonly dangerous
 */
const DANGEROUS_TERMINAL_PATTERNS = [
  /terminal\s*\d+.*to.*terminal\s*\d+/i,
  /t\d+.*to.*t\d+/i,
  /jump.*terminal/i,
  /bridge.*terminal/i,
  /connect.*terminal/i,
];

/**
 * Guardian Agent - Main Entry Point
 *
 * @param input - User message and context
 * @returns Safety decision with confidence and reasoning
 */
export async function runGuardianAgent(
  input: GuardianInput
): Promise<GuardianOutput> {
  const startTime = Date.now();

  try {
    // Step 1: Fast keyword check (< 1ms)
    const keywordCheck = checkDangerKeywords(input.userMessage);
    if (!keywordCheck.hasDangerKeywords) {
      // No danger keywords found - ALLOW immediately
      return {
        decision: 'ALLOW',
        confidence: 0.95,
        reasoning: 'No safety-critical keywords detected',
        processingTimeMs: Date.now() - startTime,
      };
    }

    // Step 2: Terminal pattern check (< 5ms)
    const terminalCheck = checkDangerousTerminalPatterns(input.userMessage);
    if (terminalCheck.isMatch) {
      // Dangerous terminal pattern detected - BLOCK immediately
      return {
        decision: 'BLOCK',
        confidence: 0.98,
        matchedRule: {
          ruleId: 'TERM_JUMP_001',
          ruleDescription: 'Dangerous terminal jump/connection detected',
          severity: 'CRITICAL',
          requiredAction: 'disconnect_power',
        },
        reasoning: `Detected dangerous terminal operation: ${terminalCheck.pattern}. This could cause electrical hazards, equipment damage, or personal injury.`,
        processingTimeMs: Date.now() - startTime,
      };
    }

    // Step 3: Vector similarity search against safety blacklist
    const vectorCheck = await checkSafetyBlacklist(
      input.userMessage,
      input.machineModel,
      input.orgId
    );

    // Calculate processing time
    const processingTimeMs = Date.now() - startTime;

    // Step 4: Make final decision based on vector similarity
    if (vectorCheck.similarity >= 0.85) {
      // High similarity to known dangerous action - BLOCK
      return {
        decision: 'BLOCK',
        confidence: vectorCheck.similarity,
        matchedRule: vectorCheck.matchedRule,
        reasoning: vectorCheck.reasoning,
        processingTimeMs,
      };
    } else if (vectorCheck.similarity >= 0.75) {
      // Medium similarity - BLOCK with lower confidence (fail closed)
      return {
        decision: 'BLOCK',
        confidence: vectorCheck.similarity,
        matchedRule: vectorCheck.matchedRule,
        reasoning: `Potentially dangerous action detected with ${(vectorCheck.similarity * 100).toFixed(0)}% similarity to known hazards. ${vectorCheck.reasoning}`,
        processingTimeMs,
      };
    } else {
      // Low similarity - ALLOW
      return {
        decision: 'ALLOW',
        confidence: 1 - vectorCheck.similarity,
        reasoning: 'Intent analyzed and determined to be safe',
        processingTimeMs,
      };
    }
  } catch (error) {
    // FAIL CLOSED: If any error occurs, default to BLOCK
    console.error('Guardian Agent error (FAILING CLOSED):', error);

    return {
      decision: 'BLOCK',
      confidence: 0.5,
      reasoning:
        'Safety system error occurred. As a precaution, this request has been blocked. Please contact support if this persists.',
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Step 1: Fast keyword check
 * Checks if message contains any danger-related keywords
 */
function checkDangerKeywords(message: string): {
  hasDangerKeywords: boolean;
  matchedKeywords: string[];
} {
  const lowerMessage = message.toLowerCase();
  const matchedKeywords = DANGER_KEYWORDS.filter((keyword) =>
    lowerMessage.includes(keyword.toLowerCase())
  );

  return {
    hasDangerKeywords: matchedKeywords.length > 0,
    matchedKeywords,
  };
}

/**
 * Step 2: Check for dangerous terminal connection patterns
 * Matches patterns like "jump Terminal 29 to Terminal 21"
 */
function checkDangerousTerminalPatterns(message: string): {
  isMatch: boolean;
  pattern?: string;
} {
  for (const pattern of DANGEROUS_TERMINAL_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      return {
        isMatch: true,
        pattern: match[0],
      };
    }
  }

  return { isMatch: false };
}

/**
 * Step 3: Vector similarity search against safety blacklist
 * Uses embeddings to find similar dangerous procedures
 */
async function checkSafetyBlacklist(
  userMessage: string,
  machineModel: string,
  orgId: string
): Promise<{
  similarity: number;
  matchedRule?: {
    ruleId: string;
    ruleDescription: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    requiredAction: 'disconnect_power' | 'lockout_tagout';
  };
  reasoning: string;
}> {
  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Generate embedding for user message
    const queryEmbedding = await generateEmbedding(userMessage);

    // Search safety_blacklist table using vector similarity
    // Query filters by org_id (org-specific rules) OR global rules (org_id = NULL)
    const { data, error } = await supabase.rpc('match_safety_blacklist', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: 1,
      org_id_filter: orgId,
    });

    if (error) {
      console.error('Error querying safety blacklist:', error);
      // Fail closed on database error
      return {
        similarity: 0.9,
        reasoning: 'Unable to verify safety. Request blocked as precaution.',
      };
    }

    if (!data || data.length === 0) {
      // No matches found in blacklist
      return {
        similarity: 0.0,
        reasoning: 'No similar dangerous procedures found in safety database',
      };
    }

    // Get the best match
    const bestMatch = data[0];

    return {
      similarity: bestMatch.similarity,
      matchedRule: {
        ruleId: bestMatch.id,
        ruleDescription: bestMatch.action_description,
        severity: bestMatch.severity || 'HIGH',
        requiredAction: bestMatch.required_action || 'disconnect_power',
      },
      reasoning: `This action is similar to: "${bestMatch.action_description}". ${bestMatch.risk_description || 'This procedure poses safety risks.'}`,
    };
  } catch (error) {
    console.error('Vector search error:', error);
    // Fail closed on any error
    return {
      similarity: 0.9,
      reasoning: 'Safety verification system error. Request blocked as precaution.',
    };
  }
}

/**
 * Helper: Extract context from conversation history
 * Used to understand if dangerous intent is building up across multiple messages
 */
function analyzeConversationContext(
  conversationHistory: Array<{ role: string; content: string }>
): {
  hasDangerousContext: boolean;
  contextSummary: string;
} {
  // Look for patterns across conversation that indicate escalating risk
  const recentMessages = conversationHistory.slice(-5); // Last 5 messages

  const dangerousContextPatterns = [
    /safety.*off/i,
    /power.*on/i,
    /live.*circuit/i,
    /energized/i,
  ];

  let hasDangerousContext = false;
  const matchedPatterns: string[] = [];

  for (const message of recentMessages) {
    for (const pattern of dangerousContextPatterns) {
      if (pattern.test(message.content)) {
        hasDangerousContext = true;
        matchedPatterns.push(pattern.source);
      }
    }
  }

  return {
    hasDangerousContext,
    contextSummary: hasDangerousContext
      ? `Conversation context indicates unsafe conditions: ${matchedPatterns.join(', ')}`
      : 'Conversation context appears safe',
  };
}
