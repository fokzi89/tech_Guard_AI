import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { diagnosticianAgent, DiagnosticianInput } from '@/lib/agents/diagnostician';
import * as AI from 'ai';

// Mock AI SDK
vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

vi.mock('@ai-sdk/google', () => ({
  google: vi.fn().mockReturnValue('mock-model'),
}));

describe('Diagnostician Agent', () => {
  beforeEach(() => {
    vi.spyOn(AI, 'generateObject').mockResolvedValue({
      object: {
        response: 'Test response guidance',
        citedManuals: ['manual-1'],
        nextSteps: ['step 1', 'step 2'],
        requiresPhoto: false,
        metadata: {
          responseType: 'diagnostic',
          confidence: 0.9
        }
      }
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate a diagnostic response using provided context', async () => {
    const input: DiagnosticianInput = {
      userMessage: 'How do I check voltage?',
      machineModel: 'TestMachine',
      conversationHistory: [],
      orgId: 'org-1',
      retrievedContext: [
        {
          chunkId: 'c1',
          manualTitle: 'Service Manual',
          content: 'Check voltage at TB1',
          pageNumber: 10,
          similarity: 0.9
        }
      ]
    };

    const result = await diagnosticianAgent(input);

    expect(result.response).toBe('Test response guidance');
    expect(result.metadata.confidence).toBe(0.9);

    // Verify context usage in call
    expect(AI.generateObject).toHaveBeenCalledWith(expect.objectContaining({
      system: expect.stringContaining('Check voltage at TB1'),
      messages: expect.arrayContaining([{ role: 'user', content: 'How do I check voltage?' }])
    }));
  });

  it('should handle errors gracefully', async () => {
    vi.spyOn(AI, 'generateObject').mockRejectedValue(new Error('AI Service Error'));

    const input: DiagnosticianInput = {
      userMessage: 'Fail me',
      machineModel: 'TestMachine',
      conversationHistory: [],
      orgId: 'org-1',
      retrievedContext: []
    };

    const result = await diagnosticianAgent(input);

    expect(result.response).toContain('error');
    expect(result.metadata.confidence).toBe(0);
  });
});
