import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { createOpenRouterClient, getOpenRouterModel, shouldUseOpenRouter } from '@/lib/ai/openrouter-config';

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
  identifiedComponents: z.array(z.string()).optional().describe('List of components identified in the photo (e.g., "Terminal R24", "Capacitor C12").'),
  visualAnalysis: z.string().optional().describe('Detailed description of visual findings like damage/wear/corrosion if a photo was provided.'),
  componentStatus: z.enum(['normal', 'damaged', 'disconnected', 'unknown']).optional().describe('Guessed status of the main component in focus.'),
  damageAssessment: z.object({
    hasDamage: z.boolean().describe('True if visible damage (burns, cracks, corrosion) is detected.'),
    damageType: z.enum(['none', 'thermal', 'physical', 'corrosion', 'alignment', 'other']).describe('Type of primary damage detected.'),
    severity: z.enum(['none', 'minor', 'moderate', 'critical']).describe('Severity of the detected damage.'),
    recommendation: z.string().optional().describe('Specific recommendation based on the damage (e.g., "Replace immediately", "Clean contacts").')
  }).optional().describe('Structured assessment of wear or damage found in the photo.'),
  wiringAnalysis: z.object({
    matchesDiagram: z.boolean().describe('True if wiring appears consistent with standard configurations/manual context.'),
    discrepancyDescription: z.string().optional().describe('Description of any wiring discrepancies (e.g. "Blue wire connected to ground instead of live").'),
    connectionStatus: z.enum(['secure', 'loose', 'disconnected', 'uncertain']).describe('General assessment of visible connection quality.')
  }).optional().describe('Analysis of wiring configuration vs expected standards.')
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
9. If the user asks "What is this component?", identify it from the photo. Provide its likely name, function, and status.
10. If identifying a component, cross-reference its appearance with any descriptions in the provided manual context.
11. ACTIVELY SCAN FOR DAMAGE: Look for signs of thermal damage (charring, melting), physical damage (cracks, bends), corrosion (rust, oxidation), or poor connections (loose wires, exposed copper).
12. If damage is found, categorize its severity and type in the damageAssessment field. Be conservative with "Critical" assessments unless safety is at risk.
13. CHECK WIRING: If wires are visible, check colors, routing, and connection points against any descriptions in the "Available Context from Manuals".
14. If a discrepancy occurs (e.g. "Manual says Red wire to Terminal 1, photo shows Blue"), flag this in wiringAnalysis.discrepancyDescription.

Safety Note: The user's request has been cleared by the Guardian Agent, but remain vigilant.

Available Context from Manuals:
${contextString || 'No specific manual sections found.'}

Analyze the user's question (and photo if provided) and the provided context to answer.
If identifying components, populate the identifiedComponents and visualAnalysis fields in detail.
`;

  try {
    // Determine which model to use
    const useOpenRouter = shouldUseOpenRouter();
    let model;

    if (useOpenRouter) {
      const openrouter = createOpenRouterClient();
      const modelName = photoUrl ? getOpenRouterModel('vision') : getOpenRouterModel('chat');
      model = openrouter(modelName);
      console.log(`[Diagnostician] Using OpenRouter model: ${modelName}`);
    } else {
      model = google('gemini-1.5-pro-latest');
      console.log('[Diagnostician] Using Google Gemini model');
    }

    const result = await generateObject({
      model,
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
