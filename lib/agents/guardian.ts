import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/rag/embeddings';

/**
 * Common interfaces for Agent messages
 */
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

/**
 * Input contract for the Guardian Agent
 */
export interface GuardianInput {
  userMessage: string;                // Raw user input
  machineModel: string;               // Machine being troubleshot
  conversationHistory: any[];     // Previous conversation for context
  orgId: string;                      // For fetching org-specific blacklist rules
}

/**
 * Output contract for the Guardian Agent
 */
export interface GuardianOutput {
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

/**
 * Safety Blacklist Rule from Database
 */
interface SafetyBlacklistRule {
  id: string;
  rule_description: string;
  machine_model: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  required_action: 'disconnect_power' | 'lockout_tagout' | 'ppe_required';
  similarity: number;
}

/**
 * Guardian Agent: Safety Intercept
 * Detects dangerous user intents and blocks AI responses before they reach the user.
 */
export async function guardianAgent(input: GuardianInput): Promise<GuardianOutput> {
  const { userMessage, machineModel, orgId } = input;
  console.log(`[Guardian] Analyzing message for ${machineModel}: "${userMessage.substring(0, 50)}..."`);

  // 1. Intent Analysis: Keyword Detection (Fast Fail)
  // We look for high-risk verbs/nouns. This is a heuristic to save on embedding costs if obviously safe?
  // Actually, we should probably always check the blacklist to be safe, unless it's "Hello".
  // Only minimal heuristic here.

  const dangerousKeywords = ['jump', 'bypass', 'connect', 'bridge', 'short', 'override', 'disable', 'test', 'check'];
  // If mostly conversational, we might want to skip, but for MVP safety, we check everything substantive.

  // 2. Blacklist Check: Vector Search
  try {
    const embedding = await generateEmbedding(userMessage);
    const supabase = await createClient();

    // Call the RPC function `check_safety_blacklist`
    const { data: matchedRules, error } = await (supabase.rpc as any)('check_safety_blacklist', {
      input_embedding: embedding,
      machine_model: machineModel
    });

    if (error) {
      console.error('[Guardian] Error querying safety blacklist:', error);
      // Fail closed: If we can't verify safety, we BLOCK (or at least warn). 
      // Spec says: "Fallback Behavior: Guardian Agent: If error occurs, default to BLOCK"
      return {
        decision: 'BLOCK',
        confidence: 1.0,
        reasoning: 'System error during safety check. Failing closed for safety.',
        matchedRule: {
          ruleId: 'error_fallback',
          ruleDescription: 'System Error: Unable to verify safety rules. Please contact support or try again.',
          severity: 'CRITICAL',
          requiredAction: 'disconnect_power'
        }
      };
    }

    if (matchedRules && matchedRules.length > 0) {
      const topMatch = matchedRules[0] as SafetyBlacklistRule;
      console.warn(`[Guardian] BLOCKED: Found matching safety rule "${topMatch.rule_description}" (${topMatch.similarity})`);

      return {
        decision: 'BLOCK',
        confidence: topMatch.similarity,
        matchedRule: {
          ruleId: topMatch.id,
          ruleDescription: topMatch.rule_description,
          severity: topMatch.severity,
          requiredAction: topMatch.required_action
        },
        reasoning: `User intent matches blacklisted procedure: ${topMatch.rule_description}`
      };
    }

    // 3. No match found -> ALLOW
    console.log('[Guardian] ALLOW: No safety violations detected.');
    return {
      decision: 'ALLOW',
      confidence: 0.0,
      reasoning: 'No matching safety rules found in blacklist.'
    };

  } catch (err) {
    console.error('[Guardian] Unexpected error:', err);
    return {
      decision: 'BLOCK',
      confidence: 1.0,
      reasoning: 'Unexpected internal error. Failing closed.'
    };
  }
}

/**
 * Verify Isolation from Photo
 * Uses Vision model to confirm if power is disconnected.
 * Supports both Google Gemini and OpenRouter vision models.
 */
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { createOpenRouterClient, getOpenRouterModel, shouldUseOpenRouter } from '@/lib/ai/openrouter-config';

export async function verifyIsolation(photoUrl: string): Promise<{ verified: boolean; reasoning: string }> {
  try {
    const useOpenRouter = shouldUseOpenRouter();
    let model;

    if (useOpenRouter) {
      const openrouter = createOpenRouterClient();
      const modelName = getOpenRouterModel('vision');
      model = openrouter(modelName);
      console.log(`[Guardian] Using OpenRouter vision model: ${modelName}`);
    } else {
      model = google('gemini-1.5-pro-latest');
      console.log('[Guardian] Using Google Gemini vision model');
    }

    const result = await generateObject({
      model,
      schema: z.object({
        verified: z.boolean().describe('True if the photo clearly shows disconnected power or lockout/tagout.'),
        reasoning: z.string().describe('Explanation of what is seen in the photo.')
      }),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Please verify if the power source is disconnected in this photo. Look for unplugged cables, lockout tags, or open breakers.' },
            { type: 'image', image: photoUrl } // Vercel AI SDK supports URL or base64. Ensure photoUrl is accessible or base64.
          ]
        }
      ]
    });
    return result.object;
  } catch (error) {
    console.error('[Guardian] Error verifying isolation:', error);
    return { verified: false, reasoning: 'Failed to analyze photo.' };
  }
}
