import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

/**
 * Common interfaces
 */
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ManualChunk {
  chunkId: string;
  manualTitle: string;
  content: string;
  pageNumber: number | null;
  similarity: number;
}

/**
 * Input contract for the Diagnostician Agent
 */
export interface DiagnosticianInput {
  userMessage: string;
  machineModel: string;
  conversationHistory: any[];
  photoUrl?: string;                  // If user uploaded a photo
  retrievedContext: ManualChunk[];    // From RAG search
  orgId: string;
}

/**
 * Output contract for the Diagnostician Agent
 */
export interface DiagnosticianOutput {
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

/**
 * Zod schema for the agent's structured output
 */
const diagnosticianSchema = z.object({
  response: z.string().describe('Troubleshooting guidance for user, step-by-step.'),
  citedManuals: z.array(z.string()).describe('List of Manual IDs referenced in the response.'),
  nextSteps: z.array(z.string()).describe('List of 2-3 suggested next actions.'),
  requiresPhoto: z.boolean().describe('True if visual inspection would help.'),
  photoPrompt: z.string().optional().describe('Description of what the user should photograph if requiresPhoto is true.'),
  metadata: z.object({
    responseType: z.enum(['diagnostic', 'explanation', 'procedure']),
    confidence: z.number().min(0).max(1).describe('Confidence score 0.0-1.0'),
  }),
  identifiedComponents: z.array(z.string()).optional().describe('List of components identified in variables if a photo was provided.'),
  visualAnalysis: z.string().optional().describe('Description of visual findings like damage/wear if a photo was provided.'),
});

/**
 * Diagnostician Agent: Troubleshooting Assistant
 * Provides step-by-step troubleshooting guidance based on machine manuals.
 */
export async function diagnosticianAgent(input: DiagnosticianInput): Promise<DiagnosticianOutput & { identifiedComponents?: string[], visualAnalysis?: string }> {
  const { userMessage, machineModel, conversationHistory, retrievedContext, photoUrl } = input;
  console.log(`[Diagnostician] Processing request for ${machineModel}${photoUrl ? ' with photo' : ''}`);

  // Construct context string
  const contextString = retrievedContext.map((c, i) =>
    `[Source ${i + 1}] Title: ${c.manualTitle} (ID: ${c.chunkId}, Page: ${c.pageNumber})\nContent: ${c.content}`
  ).join('\n\n');

  // Construct system prompt
  const systemPrompt = `
You are an expert industrial machinery technician assistant.
Your goal is to help field technicians safely diagnose and repair legacy equipment.

Current Machine: ${machineModel}

Guidelines:
1. Provide step-by-step instructions in simple, clear language.
2. ALWAYS reference the relevant manual section when giving advice.
3. Remind users about safety precautions (PPE, lockout/tagout).
4. If you're uncertain, ask clarifying questions rather than guessing.
5. Encourgage users to upload photos if visual inspection would help.
6. Break complex procedures into numbered steps.
7. Use the exact terminology from the machine manual.

8. If a photo is provided, ANALYZE it carefully. Identify components, visible damage, or wiring states. Compare with known manual diagrams if possible.
9. If the user asks "What is this component?", identify it from the photo.

Safety Note: The user's request has been cleared by the Guardian Agent, but remain vigilant.

Available Context from Manuals:
${contextString || 'No specific manual sections found.'}

Analyze the user's question (and photo if provided) and the provided context to answer.
`;

  try {
    const result = await generateObject({
      model: google('gemini-1.5-pro-latest'),
      schema: diagnosticianSchema,
      system: systemPrompt,
      messages: [
        ...conversationHistory,
        {
          role: 'user',
          content: photoUrl
            ? [
              { type: 'text', text: userMessage },
              { type: 'image', image: photoUrl }
            ]
            : userMessage
        }
      ],
    });

    console.log(`[Diagnostician] Generated response with type: ${result.object.metadata.responseType}`);
    return result.object;

  } catch (error) {
    console.error('[Diagnostician] Error generating response:', error);
    // Fallback response safely
    return {
      response: "I encountered an error while processing your request. Please try again or consult the hardcopy manual.",
      citedManuals: [],
      nextSteps: ["Check internet connection", "Try phrasing the question differently"],
      requiresPhoto: false,
      metadata: {
        responseType: 'explanation',
        confidence: 0
      }
    };
  }
}
