import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { guardianAgent, GuardianInput } from '@/lib/agents/guardian';
import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/rag/embeddings';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/rag/embeddings', () => ({
  generateEmbedding: vi.fn(),
}));

const mockRpc = vi.fn();
const mockSupabase = {
  rpc: mockRpc,
};

describe('Guardian Agent', () => {
  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(generateEmbedding).mockResolvedValue([0.1, 0.2, 0.3]);
    mockRpc.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should BLOCK when a matching safety rule is found', async () => {
    const input: GuardianInput = {
      userMessage: 'Can I jump Terminal 29 to 21?',
      machineModel: 'Domino M230i',
      conversationHistory: [],
      orgId: 'test-org'
    };

    // Mock blacklist match
    mockRpc.mockResolvedValue({
      data: [{
        id: 'rule-123',
        rule_description: 'Do not connect Internal 0V to External 24V',
        machine_model: 'Domino M230i',
        severity: 'CRITICAL',
        required_action: 'disconnect_power',
        similarity: 0.95
      }],
      error: null
    });

    const result = await guardianAgent(input);

    expect(result.decision).toBe('BLOCK');
    expect(result.confidence).toBe(0.95);
    expect(result.matchedRule).toBeDefined();
    expect(result.matchedRule?.ruleId).toBe('rule-123');
    expect(mockRpc).toHaveBeenCalledWith('check_safety_blacklist', expect.objectContaining({
      filter_machine_model: 'Domino M230i'
    }));
  });

  it('should ALLOW when no matching safety rule is found', async () => {
    const input: GuardianInput = {
      userMessage: 'How do I check the print head temperature?',
      machineModel: 'Domino M230i',
      conversationHistory: [],
      orgId: 'test-org'
    };

    // Mock no match
    mockRpc.mockResolvedValue({
      data: [],
      error: null
    });

    const result = await guardianAgent(input);

    expect(result.decision).toBe('ALLOW');
    expect(result.matchedRule).toBeUndefined();
  });

  it('should BLOCK (fail closed) on database error', async () => {
    const input: GuardianInput = {
      userMessage: 'Any message',
      machineModel: 'Domino M230i',
      conversationHistory: [],
      orgId: 'test-org'
    };

    // Mock error
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Database connection failed' }
    });

    const result = await guardianAgent(input);

    expect(result.decision).toBe('BLOCK');
    expect(result.reasoning).toContain('System error');
  });
});
