import { createClient } from '@/lib/supabase/server';
import { guardianAgent } from '@/lib/agents/guardian';
import { diagnosticianAgent } from '@/lib/agents/diagnostician';
import { searchManuals } from '@/lib/rag/search';
import { generateEmbedding } from '@/lib/rag/embeddings';
import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit'; // Import rate limiter
import { z } from 'zod';
// Removed CoreMessage import due to type issues
// If error persists, remove it.
// The previous error was "Module 'ai' has no exported member 'CoreMessage'".
// So I should remove it.

// Schema for the chat request
const chatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
  })),
  sessionId: z.string().uuid(),
  machineModel: z.string().min(1),
  photoUrl: z.string().url().optional()
});

export const maxDuration = 30;

// Initialize rate limiter: 20 requests per minute (very strict for LLM which is expensive)
const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 users per interval
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      await limiter.check(null, 20, user.id); // 20 requests per minute per user ID
    } catch {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const json = await req.json();
    const { messages, sessionId, machineModel } = chatRequestSchema.parse(json);

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user') {
      return NextResponse.json({ error: 'Last message must be from user' }, { status: 400 });
    }

    const orgId = (user.user_metadata?.org_id as string) ?? null; // Assuming org_id is in metadata
    // Fallback: Fetch profile to get org_id if not in metadata
    let activeOrgId: string | null = orgId;
    if (!activeOrgId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single<{ org_id: string | null }>();
      if (profile) activeOrgId = profile.org_id;
    }

    // Extract photo URL from content if not provided in top-level body
    // Extract photo URL from content if not provided in top-level body
    let photoUrl = json.photoUrl;

    // Check experimental_attachments (Vercel AI SDK standard)
    if (!photoUrl && json.messages) {
      const lastMsg = json.messages[json.messages.length - 1];
      if (lastMsg.experimental_attachments && lastMsg.experimental_attachments.length > 0) {
        photoUrl = lastMsg.experimental_attachments[0].url;
      }
    }

    if (!photoUrl && lastMessage.content) {
      // Look for standard markdown image regex: ![alt](url)
      const imageMatch = lastMessage.content.match(/!\[.*?\]\((.*?)\)/);
      if (imageMatch && imageMatch[1]) {
        photoUrl = imageMatch[1];
      }
    }

    if (!activeOrgId) {
      return NextResponse.json({ error: 'User not associated with an organization' }, { status: 403 });
    }

    // 1. Guardian Agent (Safety Check)
    const guardianResult = await guardianAgent({
      userMessage: lastMessage.content,
      machineModel,
      conversationHistory: messages.slice(0, -1) as any[],
      orgId: activeOrgId
    });

    // Save User Message
    await supabase.from('conversation_messages').insert({
      incident_id: sessionId,
      role: 'user',
      content: lastMessage.content,
      photo_url: (photoUrl && typeof photoUrl === 'string') ? photoUrl : null,
      metadata: {
        raw_content: lastMessage.content,
        // Store any auto-extracted text from image if we had OCR?
      }
    } as any);

    if (guardianResult.decision === 'BLOCK') {
      // Save System/Block Message
      // Spec says: "System MUST log all safety interventions" (FR-007)
      await supabase.from('conversation_messages').insert({
        incident_id: sessionId,
        role: 'system',
        content: `Safety Block: ${guardianResult.reasoning}`,
        metadata: guardianResult as any
      } as any);

      // Return format that matches frontend expectations
      return NextResponse.json({
        blocked: true,
        decision: guardianResult.decision,
        confidence: guardianResult.confidence,
        matchedRule: guardianResult.matchedRule,
        reasoning: guardianResult.reasoning,
        message: 'Safety Block: This request has been blocked to protect your safety.'
      }, { status: 403 });
    }

    // 2. Retrieval (RAG)
    const embedding = await generateEmbedding(lastMessage.content);
    const retrievedContext = await searchManuals(lastMessage.content, embedding, {
      orgId: activeOrgId,
      limit: 3 // top 3 chunks
    });

    // Map SearchResult to ManualChunk
    const manualChunks = retrievedContext.map(c => ({
      chunkId: c.id,
      manualTitle: c.title,
      content: c.content,
      pageNumber: null,
      similarity: c.similarity
    }));

    // 3. Diagnostician Agent
    const diagnosticResult = await diagnosticianAgent({
      userMessage: lastMessage.content,
      machineModel,
      conversationHistory: messages.slice(0, -1) as any[],
      orgId: activeOrgId,
      retrievedContext: manualChunks,
      photoUrl: photoUrl // Pass detected photo URL to agent
    });

    // Save Assistant Response
    await supabase.from('conversation_messages').insert({
      incident_id: sessionId,
      role: 'assistant',
      content: diagnosticResult.response,
      metadata: {
        citedManuals: diagnosticResult.citedManuals,
        nextSteps: diagnosticResult.nextSteps,
        confidence: diagnosticResult.metadata.confidence,
        identifiedComponents: (diagnosticResult as any).identifiedComponents,
        visualAnalysis: (diagnosticResult as any).visualAnalysis,
        damageAssessment: (diagnosticResult as any).damageAssessment,
        wiringAnalysis: (diagnosticResult as any).wiringAnalysis,
        photoPrompt: diagnosticResult.photoPrompt
      } as any
    } as any);

    // 4. Return Response
    return NextResponse.json(diagnosticResult);

  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
