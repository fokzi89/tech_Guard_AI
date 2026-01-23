/**
 * Diagnostician Agent - AI Troubleshooting Assistant
 *
 * The Diagnostician Agent provides step-by-step troubleshooting guidance
 * based on machine manuals and safety protocols.
 *
 * This agent ONLY runs AFTER the Guardian Agent has approved the request.
 * It should never receive dangerous requests because Guardian blocks them first.
 *
 * Key Responsibilities:
 * - Provide accurate troubleshooting steps from machine manuals
 * - Cite sources for all advice given
 * - Emphasize safety at every step
 * - Suggest photo verification when needed
 * - Provide clear next steps
 *
 * Architecture:
 * - Uses Vercel AI SDK for streaming responses
 * - Integrates RAG (Retrieval Augmented Generation) for manual search
 * - Supports vision model for photo analysis
 * - Always maintains safety-first mindset
 */

import { generateText, streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { searchManuals, ManualChunk } from '@/lib/rag/search';

/**
 * Diagnostician Agent Input
 */
export interface DiagnosticianInput {
  userMessage: string;
  machineModel: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  photoUrl?: string; // For vision model analysis
  orgId: string;
  incidentId?: string; // For tracking conversation context
}

/**
 * Diagnostician Agent Output
 */
export interface DiagnosticianOutput {
  response: string;
  citedManuals: string[]; // List of manual sources used
  nextSteps: string[]; // Suggested next actions
  requiresPhoto: boolean; // Whether technician should take a photo
  metadata: {
    responseType: 'diagnostic' | 'explanation' | 'procedure';
    confidence: number; // 0.0 - 1.0
    manualChunksRetrieved: number;
  };
}

/**
 * Configuration for AI models
 */
const AI_CONFIG = {
  // Primary model for text generation
  primaryModel: google('gemini-1.5-pro'),
  // Fallback model
  fallbackModel: anthropic('claude-3-5-sonnet-20241022'),
  // Vision model for photo analysis
  visionModel: google('gemini-1.5-pro'),
  // Temperature for responses (lower = more focused)
  temperature: 0.3,
  // Max tokens for response
  maxTokens: 2000,
};

/**
 * Safety-focused system prompt
 * This prompt ensures the AI maintains a safety-first mindset
 */
const SYSTEM_PROMPT = `You are a Safety-First Industrial Equipment Diagnostician for TechGuard AI.

Your PRIMARY responsibility is technician safety. Your SECONDARY responsibility is accurate troubleshooting.

SAFETY PROTOCOLS (MANDATORY):
1. ALWAYS assume equipment is energized unless explicitly confirmed otherwise
2. ALWAYS recommend power disconnection and lockout/tagout (LOTO) before physical work
3. NEVER suggest working on live circuits or energized equipment
4. ALWAYS verify proper PPE (Personal Protective Equipment) is worn
5. When in doubt, recommend calling a supervisor or specialist

RESPONSE GUIDELINES:
1. Base ALL advice on provided machine manual excerpts
2. CITE the manual source for every technical recommendation (format: [Manual: Section X.Y])
3. Break complex procedures into clear, numbered steps
4. After each potentially risky step, remind about safety precautions
5. If manual information is insufficient, state this clearly - don't guess
6. Suggest taking photos for verification when helpful

RESPONSE STRUCTURE:
1. Acknowledge the issue
2. Reference relevant manual section(s)
3. Provide step-by-step guidance
4. List safety reminders
5. Suggest next steps

TONE:
- Professional but supportive
- Clear and concise
- Safety-focused without being condescending
- Confident when citing manuals, cautious when uncertain

Remember: A technician's life may depend on your advice. When uncertain, err on the side of caution.`;

/**
 * Run Diagnostician Agent (Non-streaming)
 *
 * Use this for generating structured responses that need post-processing
 *
 * @param input - User message and context
 * @returns Structured diagnostic output
 */
export async function runDiagnosticianAgent(
  input: DiagnosticianInput
): Promise<DiagnosticianOutput> {
  try {
    // Step 1: Retrieve relevant manual chunks using RAG
    const manualChunks = await searchManuals({
      query: input.userMessage,
      machineModel: input.machineModel,
      orgId: input.orgId,
      limit: 5,
    });

    // Step 2: Build context from manual chunks
    const manualContext = buildManualContext(manualChunks);

    // Step 3: Build conversation messages
    const messages = buildConversationMessages(
      input,
      manualContext,
      input.photoUrl
    );

    // Step 4: Generate response using AI
    const result = await generateText({
      model: AI_CONFIG.primaryModel,
      messages,
      temperature: AI_CONFIG.temperature,
      maxTokens: AI_CONFIG.maxTokens,
    });

    // Step 5: Extract structured information from response
    const parsed = parseResponse(result.text, manualChunks);

    return {
      response: result.text,
      citedManuals: parsed.citedManuals,
      nextSteps: parsed.nextSteps,
      requiresPhoto: parsed.requiresPhoto,
      metadata: {
        responseType: determineResponseType(input.userMessage),
        confidence: calculateConfidence(manualChunks, result.text),
        manualChunksRetrieved: manualChunks.length,
      },
    };
  } catch (error) {
    console.error('Diagnostician Agent error:', error);

    // Return safe fallback response
    return {
      response:
        "I'm having trouble accessing the technical information right now. For safety, please ensure the equipment is powered off and locked out before proceeding. Contact your supervisor or refer to the physical machine manual.",
      citedManuals: [],
      nextSteps: [
        'Ensure equipment is powered off',
        'Apply lockout/tagout',
        'Consult physical manual or supervisor',
      ],
      requiresPhoto: false,
      metadata: {
        responseType: 'explanation',
        confidence: 0.0,
        manualChunksRetrieved: 0,
      },
    };
  }
}

/**
 * Stream Diagnostician Agent Response
 *
 * Use this for real-time streaming responses in chat interface
 *
 * @param input - User message and context
 * @returns Streaming text response
 */
export async function streamDiagnosticianAgent(input: DiagnosticianInput) {
  try {
    // Step 1: Retrieve relevant manual chunks
    const manualChunks = await searchManuals({
      query: input.userMessage,
      machineModel: input.machineModel,
      orgId: input.orgId,
      limit: 5,
    });

    // Step 2: Build context
    const manualContext = buildManualContext(manualChunks);

    // Step 3: Build messages
    const messages = buildConversationMessages(
      input,
      manualContext,
      input.photoUrl
    );

    // Step 4: Stream response
    return streamText({
      model: AI_CONFIG.primaryModel,
      messages,
      temperature: AI_CONFIG.temperature,
      maxTokens: AI_CONFIG.maxTokens,
    });
  } catch (error) {
    console.error('Diagnostician streaming error:', error);
    throw error;
  }
}

/**
 * Build manual context from retrieved chunks
 */
function buildManualContext(chunks: ManualChunk[]): string {
  if (chunks.length === 0) {
    return 'No relevant manual information found. Provide general guidance based on industry best practices, but clearly state that specific manual information is unavailable.';
  }

  let context = 'RELEVANT MANUAL EXCERPTS:\n\n';

  chunks.forEach((chunk, index) => {
    context += `[Manual ${index + 1}: ${chunk.manualTitle || 'Unknown'}, Section ${chunk.section || 'N/A'}]\n`;
    context += `${chunk.content}\n`;
    context += `Relevance: ${(chunk.similarity * 100).toFixed(0)}%\n\n`;
  });

  context +=
    '\nIMPORTANT: Base your response on these manual excerpts. Cite them using the [Manual X] format.';

  return context;
}

/**
 * Build conversation messages for AI
 */
function buildConversationMessages(
  input: DiagnosticianInput,
  manualContext: string,
  photoUrl?: string
): Array<{ role: 'system' | 'user' | 'assistant'; content: string | any[] }> {
  const messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string | any[];
  }> = [
    {
      role: 'system',
      content: SYSTEM_PROMPT,
    },
  ];

  // Add conversation history
  input.conversationHistory.forEach((msg) => {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  });

  // Add manual context and current question
  let userContent: any = [
    {
      type: 'text',
      text: `${manualContext}\n\nMACHINE: ${input.machineModel}\n\nTECHNICIAN QUESTION: ${input.userMessage}`,
    },
  ];

  // Add photo if provided (for vision model)
  if (photoUrl) {
    userContent.push({
      type: 'image',
      image: photoUrl,
    });
    userContent[0].text += '\n\nA photo has been provided. Analyze it for diagnostic purposes.';
  }

  messages.push({
    role: 'user',
    content: userContent,
  });

  return messages;
}

/**
 * Parse response to extract structured information
 */
function parseResponse(
  response: string,
  manualChunks: ManualChunk[]
): {
  citedManuals: string[];
  nextSteps: string[];
  requiresPhoto: boolean;
} {
  // Extract manual citations
  const citationRegex = /\[Manual[^\]]*\]/gi;
  const citations = response.match(citationRegex) || [];
  const citedManuals = [...new Set(citations)]; // Remove duplicates

  // Extract next steps (look for numbered lists or "Next steps" section)
  const nextStepsRegex = /(?:next steps?|recommended actions?)[:\s]*((?:\d+\..*(?:\n|$))+)/i;
  const nextStepsMatch = response.match(nextStepsRegex);
  let nextSteps: string[] = [];

  if (nextStepsMatch) {
    nextSteps = nextStepsMatch[1]
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => line.replace(/^\d+\.\s*/, '').trim());
  }

  // Check if response suggests taking a photo
  const requiresPhoto = /take (?:a )?photo|photograph|picture|visual inspection|show me/i.test(
    response
  );

  return {
    citedManuals,
    nextSteps,
    requiresPhoto,
  };
}

/**
 * Determine response type based on user question
 */
function determineResponseType(
  userMessage: string
): 'diagnostic' | 'explanation' | 'procedure' {
  const lowerMessage = userMessage.toLowerCase();

  if (
    /why|what is|what does|explain|tell me about/i.test(lowerMessage)
  ) {
    return 'explanation';
  } else if (
    /how to|how do i|steps|procedure|guide|fix|repair/i.test(lowerMessage)
  ) {
    return 'procedure';
  } else {
    return 'diagnostic';
  }
}

/**
 * Calculate confidence based on manual retrieval quality
 */
function calculateConfidence(chunks: ManualChunk[], response: string): number {
  if (chunks.length === 0) {
    return 0.3; // Low confidence without manual support
  }

  // Average similarity of retrieved chunks
  const avgSimilarity =
    chunks.reduce((sum, chunk) => sum + chunk.similarity, 0) / chunks.length;

  // Check if response cites manuals
  const hasCitations = /\[Manual/i.test(response);

  // Calculate confidence
  let confidence = avgSimilarity;

  if (hasCitations) {
    confidence = Math.min(1.0, confidence + 0.1); // Boost for citing sources
  }

  if (chunks.length >= 3) {
    confidence = Math.min(1.0, confidence + 0.05); // Boost for multiple sources
  }

  return Math.round(confidence * 100) / 100; // Round to 2 decimals
}

/**
 * Analyze photo using vision model
 *
 * @param photoUrl - URL of photo to analyze
 * @param context - What to look for in the photo
 * @returns Analysis results
 */
export async function analyzePhoto(
  photoUrl: string,
  context: string
): Promise<string> {
  try {
    const result = await generateText({
      model: AI_CONFIG.visionModel,
      messages: [
        {
          role: 'system',
          content:
            'You are analyzing equipment photos for safety verification and diagnostic purposes. Provide detailed, accurate observations.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this photo: ${context}`,
            },
            {
              type: 'image',
              image: photoUrl,
            },
          ],
        },
      ],
    });

    return result.text;
  } catch (error) {
    console.error('Photo analysis error:', error);
    throw new Error('Failed to analyze photo');
  }
}
