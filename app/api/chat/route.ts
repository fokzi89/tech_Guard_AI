import { createClient } from '@/lib/supabase/server';
import { guardianAgent } from '@/lib/agents/guardian';
import { diagnosticianAgent } from '@/lib/agents/diagnostician';
import { searchManuals } from '@/lib/rag/search';
import { generateEmbedding } from '@/lib/rag/embeddings';
import { NextResponse } from 'next/server';
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

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json();
    const { messages, sessionId, machineModel } = chatRequestSchema.parse(json);

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user') {
      return NextResponse.json({ error: 'Last message must be from user' }, { status: 400 });
    }

    const orgId = (user.user_metadata?.org_id as string) ?? null; // Assuming org_id is in metadata
    // Fallback: Fetch profile to get org_id if not in metadata
    let activeOrgId = orgId;
    if (!activeOrgId) {
      const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single();
      if (profile) activeOrgId = (profile as any).org_id;
    }

    // Extract photo URL from content if not provided in top-level body
    let photoUrl = json.photoUrl;
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
      // metadata: guardianResult // Optional: store safety check result with user message?
    } as any);

    if (guardianResult.decision === 'BLOCK') {
      // Save System/Block Message ??
      // Spec says: "System MUST log all safety interventions" (FR-007)
      // We can log as a message or just incident log.
      // Let's log immediate block message.
      await supabase.from('conversation_messages').insert({
        incident_id: sessionId,
        role: 'system',
        content: `Safety Block: ${guardianResult.reasoning}`,
        metadata: guardianResult as any
      } as any);

      return NextResponse.json({
        error: 'Safety Block',
        guardian: guardianResult
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
      photoUrl: json.photoUrl // Pass the photo URL if present
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
        visualAnalysis: (diagnosticResult as any).visualAnalysis
      } as any
    } as any);

    // 4. Return Response
    return NextResponse.json(diagnosticResult);

  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
