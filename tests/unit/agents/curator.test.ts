import { describe, it, expect, vi, beforeEach } from 'vitest';
import { curatorAgent, CuratorInput } from '@/lib/agents/curator';
import * as AI from 'ai';

vi.mock('ai', () => ({
    generateObject: vi.fn(),
    CoreMessage: {}, // Mock type?
}));

vi.mock('@ai-sdk/google', () => ({
    google: vi.fn().mockReturnValue('mock-model'),
}));

describe('Curator Agent', () => {
    beforeEach(() => {
        vi.spyOn(AI, 'generateObject').mockResolvedValue({
            object: {
                asFound: 'Machine stopped',
                workPerformed: 'Replaced fuse',
                asLeft: 'Running',
                partsUsed: ['Fuse 5A'],
                recommendations: [],
                summary: 'Fixed fuse',
                confidence: 0.95
            }
        } as any);
    });

    it('should generate a structured report', async () => {
        const input: CuratorInput = {
            conversationHistory: [{ role: 'user', content: 'It is broken' }],
            machineModel: 'TestMachine',
            incidentId: '123'
        };

        const result = await curatorAgent(input);

        expect(result.asFound).toBe('Machine stopped');
        expect(result.partsUsed).toContain('Fuse 5A');

        expect(AI.generateObject).toHaveBeenCalledWith(expect.objectContaining({
            system: expect.stringContaining('TestMachine')
        }));
    });
});
