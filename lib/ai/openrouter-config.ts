import { createOpenAI } from '@ai-sdk/openai'

/**
 * OpenRouter configuration for AI SDK
 * OpenRouter acts as a proxy to various AI models including OpenAI, Anthropic, Google, etc.
 *
 * Available models on OpenRouter (examples):
 * - openai/gpt-4-turbo-preview
 * - openai/gpt-3.5-turbo
 * - anthropic/claude-3-opus
 * - anthropic/claude-3-sonnet
 * - google/gemini-pro
 * - mistralai/mistral-large
 *
 * Free models (good for testing):
 * - google/gemini-flash-1.5-8b (free, fast)
 * - meta-llama/llama-3.2-3b-instruct (free)
 * - allenai/molmo-2-8b (free, vision-language model)
 */

/**
 * Create OpenRouter client for AI SDK
 */
export function createOpenRouterClient() {
    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY is not set in environment variables')
    }

    return createOpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
        headers: {
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'X-Title': 'TechGuard AI',
        },
    })
}

/**
 * Recommended models for different use cases
 */
export const OPENROUTER_MODELS = {
    // Chat models (good for diagnostician agent)
    CHAT_FAST: 'google/gemini-flash-1.5-8b',           // Free, fast, good for quick responses
    CHAT_QUALITY: 'anthropic/claude-3-sonnet',         // Paid, high quality reasoning
    CHAT_BUDGET: 'meta-llama/llama-3.2-11b-instruct', // Free, good balance

    // Vision models (for photo analysis)
    VISION_FREE: 'google/gemini-flash-1.5-8b',        // Free, supports vision
    VISION_QUALITY: 'anthropic/claude-3-opus',        // Paid, best vision capabilities

    // Structured output models (for guardian agent)
    STRUCTURED: 'openai/gpt-4-turbo-preview',         // Paid, reliable structured output
    STRUCTURED_FREE: 'google/gemini-flash-1.5-8b',   // Free, supports structured output
} as const

/**
 * Get the appropriate model based on configuration
 */
export function getOpenRouterModel(type: 'chat' | 'vision' | 'structured' = 'chat'): string {
    const useFreeModels = process.env.NODE_ENV === 'development' ||
                          process.env.USE_FREE_MODELS === 'true'

    switch (type) {
        case 'chat':
            return useFreeModels ? OPENROUTER_MODELS.CHAT_FAST : OPENROUTER_MODELS.CHAT_QUALITY
        case 'vision':
            return useFreeModels ? OPENROUTER_MODELS.VISION_FREE : OPENROUTER_MODELS.VISION_QUALITY
        case 'structured':
            return useFreeModels ? OPENROUTER_MODELS.STRUCTURED_FREE : OPENROUTER_MODELS.STRUCTURED
        default:
            return OPENROUTER_MODELS.CHAT_FAST
    }
}

/**
 * Check if OpenRouter should be used for chat models
 */
export function shouldUseOpenRouter(): boolean {
    return process.env.USE_OPENROUTER_CHAT === 'true'
}
