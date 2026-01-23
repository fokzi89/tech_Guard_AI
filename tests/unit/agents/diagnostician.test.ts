import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  runDiagnosticianAgent,
  DiagnosticianInput,
  analyzePhoto,
} from '@/lib/agents/diagnostician';

/**
 * Unit Tests for Diagnostician Agent
 *
 * These tests verify the AI troubleshooting assistant logic.
 * The Diagnostician Agent provides step-by-step guidance based on
 * machine manuals and safety protocols.
 *
 * Test Coverage:
 * - Response generation
 * - Manual citation
 * - RAG integration
 * - Safety-focused guidance
 * - Photo analysis
 * - Response type detection
 * - Confidence calculation
 * - Error handling
 */

// Mock the RAG search module
vi.mock('@/lib/rag/search', () => ({
  searchManuals: vi.fn(() =>
    Promise.resolve([
      {
        id: 'manual-1',
        content:
          'Normal operating voltage is 230V AC. Always disconnect power before servicing.',
        manualTitle: 'Domino M230i Service Manual',
        section: '3.2',
        similarity: 0.92,
      },
      {
        id: 'manual-2',
        content:
          'To check voltage: 1. Disconnect power 2. Apply lockout/tagout 3. Use multimeter',
        manualTitle: 'Domino M230i Service Manual',
        section: '5.1',
        similarity: 0.87,
      },
    ])
  ),
}));

// Mock the AI SDK
vi.mock('ai', () => ({
  generateText: vi.fn(() =>
    Promise.resolve({
      text: 'The normal operating voltage for the Domino M230i is 230V AC [Manual 1: Section 3.2]. Before checking voltage, always disconnect power and apply lockout/tagout [Manual 2: Section 5.1].\n\nNext steps:\n1. Disconnect power source\n2. Apply lockout/tagout\n3. Verify zero voltage with multimeter',
    })
  ),
  streamText: vi.fn(),
}));

vi.mock('@ai-sdk/google', () => ({
  google: vi.fn(() => 'google-model'),
}));

vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: vi.fn(() => 'anthropic-model'),
}));

describe('Diagnostician Agent', () => {
  let baseInput: DiagnosticianInput;

  beforeEach(() => {
    vi.clearAllMocks();

    baseInput = {
      userMessage: 'What is the normal operating voltage?',
      machineModel: 'Domino M230i',
      conversationHistory: [],
      orgId: 'test-org-123',
    };
  });

  describe('Response Generation', () => {
    it('should generate a response for user question', async () => {
      const result = await runDiagnosticianAgent(baseInput);

      expect(result.response).toBeTruthy();
      expect(result.response.length).toBeGreaterThan(0);
    });

    it('should include manual citations in response', async () => {
      const result = await runDiagnosticianAgent(baseInput);

      expect(result.citedManuals.length).toBeGreaterThan(0);
      expect(result.response).toContain('[Manual');
    });

    it('should provide next steps', async () => {
      const result = await runDiagnosticianAgent(baseInput);

      expect(result.nextSteps).toBeDefined();
      expect(result.nextSteps.length).toBeGreaterThan(0);
    });

    it('should include metadata', async () => {
      const result = await runDiagnosticianAgent(baseInput);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.responseType).toBeOneOf([
        'diagnostic',
        'explanation',
        'procedure',
      ]);
      expect(result.metadata.confidence).toBeGreaterThanOrEqual(0);
      expect(result.metadata.confidence).toBeLessThanOrEqual(1);
      expect(result.metadata.manualChunksRetrieved).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Manual Integration (RAG)', () => {
    it('should retrieve relevant manual chunks', async () => {
      const { searchManuals } = await import('@/lib/rag/search');

      await runDiagnosticianAgent(baseInput);

      expect(searchManuals).toHaveBeenCalledWith({
        query: baseInput.userMessage,
        machineModel: baseInput.machineModel,
        orgId: baseInput.orgId,
        limit: 5,
      });
    });

    it('should use manual chunks in response context', async () => {
      const result = await runDiagnosticianAgent(baseInput);

      // Should cite manuals
      expect(result.citedManuals.length).toBeGreaterThan(0);

      // Should have high confidence when manuals found
      expect(result.metadata.manualChunksRetrieved).toBeGreaterThan(0);
    });

    it('should handle case when no manuals found', async () => {
      const { searchManuals } = await import('@/lib/rag/search');
      vi.mocked(searchManuals).mockResolvedValueOnce([]);

      const result = await runDiagnosticianAgent(baseInput);

      expect(result.response).toBeTruthy();
      expect(result.metadata.manualChunksRetrieved).toBe(0);
      expect(result.metadata.confidence).toBeLessThan(0.5);
    });
  });

  describe('Safety Focus', () => {
    it('should emphasize power disconnection in responses', async () => {
      const input: DiagnosticianInput = {
        ...baseInput,
        userMessage: 'How do I check the voltage?',
      };

      const result = await runDiagnosticianAgent(input);

      expect(result.response.toLowerCase()).toMatch(
        /disconnect|power off|de-energize|lockout|tagout/
      );
    });

    it('should recommend lockout/tagout for physical work', async () => {
      const input: DiagnosticianInput = {
        ...baseInput,
        userMessage: 'How do I replace the circuit board?',
      };

      const result = await runDiagnosticianAgent(input);

      expect(result.response.toLowerCase()).toContain('lockout');
    });

    it('should provide safety reminders in next steps', async () => {
      const input: DiagnosticianInput = {
        ...baseInput,
        userMessage: 'How do I test the power supply?',
      };

      const result = await runDiagnosticianAgent(input);

      const hasS afetyStep = result.nextSteps.some((step) =>
        /disconnect|lockout|safety|ppe|power off/i.test(step)
      );

      expect(hasSafetyStep).toBe(true);
    });
  });

  describe('Response Type Detection', () => {
    it('should detect explanation type for "what is" questions', async () => {
      const input: DiagnosticianInput = {
        ...baseInput,
        userMessage: 'What is the purpose of Terminal 15?',
      };

      const result = await runDiagnosticianAgent(input);

      expect(result.metadata.responseType).toBe('explanation');
    });

    it('should detect procedure type for "how to" questions', async () => {
      const input: DiagnosticianInput = {
        ...baseInput,
        userMessage: 'How do I replace the fuse?',
      };

      const result = await runDiagnosticianAgent(input);

      expect(result.metadata.responseType).toBe('procedure');
    });

    it('should detect diagnostic type for symptom questions', async () => {
      const input: DiagnosticianInput = {
        ...baseInput,
        userMessage: 'The printer is not turning on',
      };

      const result = await runDiagnosticianAgent(input);

      expect(result.metadata.responseType).toBe('diagnostic');
    });
  });

  describe('Citation Extraction', () => {
    it('should extract manual citations from response', async () => {
      const result = await runDiagnosticianAgent(baseInput);

      expect(result.citedManuals).toBeDefined();
      expect(Array.isArray(result.citedManuals)).toBe(true);
    });

    it('should remove duplicate citations', async () => {
      const result = await runDiagnosticianAgent(baseInput);

      const uniqueCitations = new Set(result.citedManuals);
      expect(uniqueCitations.size).toBe(result.citedManuals.length);
    });
  });

  describe('Next Steps Extraction', () => {
    it('should extract numbered steps from response', async () => {
      const result = await runDiagnosticianAgent(baseInput);

      expect(result.nextSteps).toBeDefined();
      expect(result.nextSteps.length).toBeGreaterThan(0);
    });

    it('should clean step numbers from extracted steps', async () => {
      const result = await runDiagnosticianAgent(baseInput);

      result.nextSteps.forEach((step) => {
        expect(step).not.toMatch(/^\d+\./);
      });
    });
  });

  describe('Photo Analysis', () => {
    it('should detect when photo is needed', async () => {
      const { generateText } = await import('ai');
      vi.mocked(generateText).mockResolvedValueOnce({
        text: 'Please take a photo of the terminal block so I can verify the wiring.',
      } as any);

      const result = await runDiagnosticianAgent(baseInput);

      expect(result.requiresPhoto).toBe(true);
    });

    it('should analyze photo when provided', async () => {
      const input: DiagnosticianInput = {
        ...baseInput,
        photoUrl: 'https://example.com/photo.jpg',
      };

      const result = await runDiagnosticianAgent(input);

      expect(result.response).toBeTruthy();
    });

    it('should analyze photo for safety verification', async () => {
      const photoUrl = 'https://example.com/power-disconnected.jpg';
      const context = 'Verify that power is disconnected';

      const analysis = await analyzePhoto(photoUrl, context);

      expect(analysis).toBeTruthy();
      expect(typeof analysis).toBe('string');
    });
  });

  describe('Confidence Calculation', () => {
    it('should have high confidence with good manual matches', async () => {
      const result = await runDiagnosticianAgent(baseInput);

      // With manual similarity 0.92 and 0.87, confidence should be high
      expect(result.metadata.confidence).toBeGreaterThan(0.8);
    });

    it('should have low confidence without manual support', async () => {
      const { searchManuals } = await import('@/lib/rag/search');
      vi.mocked(searchManuals).mockResolvedValueOnce([]);

      const result = await runDiagnosticianAgent(baseInput);

      expect(result.metadata.confidence).toBeLessThan(0.5);
    });

    it('should boost confidence when citing manuals', async () => {
      const result = await runDiagnosticianAgent(baseInput);

      // Response includes citations, so should have confidence boost
      if (result.citedManuals.length > 0) {
        expect(result.metadata.confidence).toBeGreaterThan(0.8);
      }
    });
  });

  describe('Conversation History', () => {
    it('should use conversation history in context', async () => {
      const input: DiagnosticianInput = {
        ...baseInput,
        conversationHistory: [
          { role: 'user', content: 'The printer is not working' },
          { role: 'assistant', content: 'Have you checked the power supply?' },
          { role: 'user', content: 'Yes, power is on' },
        ],
      };

      const result = await runDiagnosticianAgent(input);

      expect(result.response).toBeTruthy();
    });

    it('should maintain context across multiple questions', async () => {
      const input: DiagnosticianInput = {
        ...baseInput,
        userMessage: 'What about the fuse?',
        conversationHistory: [
          { role: 'user', content: 'How do I check the power supply?' },
          {
            role: 'assistant',
            content: 'Check voltage at the main terminal block',
          },
        ],
      };

      const result = await runDiagnosticianAgent(input);

      expect(result.response).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle AI API errors gracefully', async () => {
      const { generateText } = await import('ai');
      vi.mocked(generateText).mockRejectedValueOnce(new Error('API error'));

      const result = await runDiagnosticianAgent(baseInput);

      expect(result.response).toContain('trouble accessing');
      expect(result.nextSteps.length).toBeGreaterThan(0);
      expect(result.metadata.confidence).toBe(0.0);
    });

    it('should provide safe fallback response on error', async () => {
      const { generateText } = await import('ai');
      vi.mocked(generateText).mockRejectedValueOnce(new Error('Network error'));

      const result = await runDiagnosticianAgent(baseInput);

      expect(result.response).toContain('powered off');
      expect(result.response).toContain('lockout');
      expect(result.nextSteps).toContain('Ensure equipment is powered off');
    });

    it('should handle photo analysis errors', async () => {
      const { generateText } = await import('ai');
      vi.mocked(generateText).mockRejectedValueOnce(new Error('Vision API error'));

      await expect(
        analyzePhoto('invalid-url', 'Check something')
      ).rejects.toThrow();
    });
  });

  describe('Output Structure', () => {
    it('should return all required fields', async () => {
      const result = await runDiagnosticianAgent(baseInput);

      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('citedManuals');
      expect(result).toHaveProperty('nextSteps');
      expect(result).toHaveProperty('requiresPhoto');
      expect(result).toHaveProperty('metadata');
    });

    it('should have valid metadata structure', async () => {
      const result = await runDiagnosticianAgent(baseInput);

      expect(result.metadata).toHaveProperty('responseType');
      expect(result.metadata).toHaveProperty('confidence');
      expect(result.metadata).toHaveProperty('manualChunksRetrieved');
    });

    it('should return arrays for citedManuals and nextSteps', async () => {
      const result = await runDiagnosticianAgent(baseInput);

      expect(Array.isArray(result.citedManuals)).toBe(true);
      expect(Array.isArray(result.nextSteps)).toBe(true);
    });

    it('should return boolean for requiresPhoto', async () => {
      const result = await runDiagnosticianAgent(baseInput);

      expect(typeof result.requiresPhoto).toBe('boolean');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty conversation history', async () => {
      const input: DiagnosticianInput = {
        ...baseInput,
        conversationHistory: [],
      };

      const result = await runDiagnosticianAgent(input);

      expect(result.response).toBeTruthy();
    });

    it('should handle very long questions', async () => {
      const input: DiagnosticianInput = {
        ...baseInput,
        userMessage: 'a'.repeat(5000),
      };

      const result = await runDiagnosticianAgent(input);

      expect(result).toBeDefined();
    });

    it('should handle questions with special characters', async () => {
      const input: DiagnosticianInput = {
        ...baseInput,
        userMessage: 'What is the voltage? (230V?)',
      };

      const result = await runDiagnosticianAgent(input);

      expect(result.response).toBeTruthy();
    });
  });
});
