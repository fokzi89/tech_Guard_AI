import { z } from 'zod';

/**
 * Input for the Curator Agent
 */
export interface CuratorInput {
    conversationHistory: any[];
    machineModel: string;
    incidentId: string;
    externalTicketId?: string;
    sessionTitle?: string;
}

/**
 * Output for the Curator Agent (The Service Report)
 */
export interface CuratorOutput {
    asFound: string;         // Initial condition/symptom
    workPerformed: string;   // Steps taken, diagnostics, repairs
    asLeft: string;          // Final condition, verification
    partsUsed: string[];     // Parts mentioned as replaced (optional)
    recommendations: string[]; // Future recommendations
    summary: string;         // Short summary for ticket subject
    confidence: number;
}

/**
 * Schema for structured output validation
 */
export const curatorSchema = z.object({
    asFound: z.string().describe('Description of the machine condition at the start of the session (symptoms, errors).'),
    workPerformed: z.string().describe('Chronological list of troubleshooting steps, diagnostics run, and fixes applied.'),
    asLeft: z.string().describe('Description of the machine condition at the end of the session. Verify if resolved.'),
    partsUsed: z.array(z.string()).describe('List of replacement parts mentioned during the session.'),
    recommendations: z.array(z.string()).describe('Suggestions for future maintenance or prevention.'),
    summary: z.string().describe('A concise 1-sentence summary of the issue and resolution.'),
    confidence: z.number().min(0).max(1),
});

/**
 * Curator Agent: Service Report Generator
 * Analyzes conversation history to generate structured CMMS reports.
 */
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { createOpenRouterClient, getOpenRouterModel, shouldUseOpenRouter } from '@/lib/ai/openrouter-config';

export async function curatorAgent(input: CuratorInput): Promise<CuratorOutput> {
    const { conversationHistory, machineModel, externalTicketId } = input;
    console.log(`[Curator] Generating report for ${machineModel}`);

    const systemPrompt = `
You are an expert maintenance supervisor and documentation specialist.
Your task is to review a troubleshooting conversation log between a Technician and an AI Assistant.
You must extract key information to generate a professional Service Report for a CMMS (Computerized Maintenance Management System).

Machine: ${machineModel}
Ticket ID: ${externalTicketId || 'N/A'}

Rules for Extraction:
1. **As Found**: Identify the initial symptom, error code, or problem description provided by the user.
2. **Work Performed**: Summarize the *technician's actions*. Ignore conversational filler. Focus on:
    - Diagnostics run (e.g., "measured voltage at TB1")
    - Parts inspected
    - Adjustments made
    - Parts replaced
3. **As Left**: Identify the final state. Is the machine running? Is the issue resolved or pending parts?
4. **Tone**: Use professional, technical language suitable for official records.
5. **Privacy**: Do not include names or personal chat.

Conversation Log:
(See messages below)
    `;

    try {
        // Determine which model to use
        const useOpenRouter = shouldUseOpenRouter();
        let model;

        if (useOpenRouter) {
            const openrouter = createOpenRouterClient();
            const modelName = getOpenRouterModel('structured');
            model = openrouter(modelName);
            console.log(`[Curator] Using OpenRouter model: ${modelName}`);
        } else {
            model = google('gemini-1.5-pro-latest');
            console.log('[Curator] Using Google Gemini model');
        }

        const result = await generateObject({
            model,
            schema: curatorSchema,
            system: systemPrompt,
            messages: conversationHistory,
        });

        return result.object;

    } catch (error) {
        console.error('[Curator] Error generating report:', error);
        return {
            asFound: 'Error generating report.',
            workPerformed: 'Please review the conversation manually.',
            asLeft: 'Unknown',
            partsUsed: [],
            recommendations: [],
            summary: 'Generation Failed',
            confidence: 0,
        };
    }
}
