import OpenAI from 'openai'

/**
 * OpenAI/OpenRouter client for embedding generation
 */
let openaiClient: OpenAI | null = null

function getOpenAIClient() {
    if (!openaiClient) {
        const useOpenRouter = process.env.USE_OPENROUTER_EMBEDDINGS === 'true'

        if (useOpenRouter) {
            // Use OpenRouter as a proxy to OpenAI's embedding models
            openaiClient = new OpenAI({
                apiKey: process.env.OPENROUTER_API_KEY,
                baseURL: 'https://openrouter.ai/api/v1',
                defaultHeaders: {
                    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                    'X-Title': 'TechGuard AI',
                }
            })
            console.log('[Embeddings] Using OpenRouter for embeddings')
        } else {
            // Use OpenAI directly
            openaiClient = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            })
            console.log('[Embeddings] Using OpenAI for embeddings')
        }
    }
    return openaiClient
}

/**
 * Embedding model configuration
 * OpenRouter supports OpenAI models through their proxy
 */
const EMBEDDING_MODEL = process.env.USE_OPENROUTER_EMBEDDINGS === 'true'
    ? 'openai/text-embedding-3-small'  // OpenRouter format includes provider prefix
    : 'text-embedding-3-small'          // Direct OpenAI format
const EMBEDDING_DIMENSIONS = 1536

/**
 * Generate a mock embedding (for development when OpenAI quota is exceeded)
 */
function generateMockEmbedding(text: string): number[] {
    // Create a deterministic embedding based on text hash
    const hash = text.split('').reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);

    // Generate 1536 random-ish numbers between -1 and 1
    const embedding: number[] = [];
    for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
        const seed = (hash + i) * 2654435761; // Use golden ratio for better distribution
        embedding.push((Math.sin(seed) * Math.cos(seed * 0.5)));
    }

    return embedding;
}

/**
 * Generate embedding for a single text string
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    // Development mode: Use mock embeddings if OPENAI_API_KEY is not set or USE_MOCK_EMBEDDINGS is true
    if (process.env.USE_MOCK_EMBEDDINGS === 'true') {
        console.warn('[Embeddings] Using MOCK embeddings (development mode)');
        return generateMockEmbedding(text);
    }

    try {
        const client = getOpenAIClient()
        const response = await client.embeddings.create({
            model: EMBEDDING_MODEL,
            input: text,
            encoding_format: 'float',
        })

        return response.data[0].embedding
    } catch (error) {
        console.error('Error generating embedding:', error)
        console.error('Error details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            apiKey: process.env.OPENAI_API_KEY ? 'Set (length: ' + process.env.OPENAI_API_KEY.length + ')' : 'NOT SET'
        })

        // If quota exceeded and in development, fallback to mock embeddings
        if (error instanceof Error && error.message.includes('quota') && process.env.NODE_ENV === 'development') {
            console.warn('[Embeddings] OpenAI quota exceeded, falling back to MOCK embeddings');
            return generateMockEmbedding(text);
        }

        throw error // Re-throw original error
    }
}

/**
 * Generate embeddings for multiple text strings in batch
 * More efficient than calling generateEmbedding multiple times
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    try {
        const client = getOpenAIClient()
        // OpenAI has a limit on batch size, so we chunk if necessary
        const BATCH_SIZE = 100
        const embeddings: number[][] = []

        for (let i = 0; i < texts.length; i += BATCH_SIZE) {
            const batch = texts.slice(i, i + BATCH_SIZE)

            const response = await client.embeddings.create({
                model: EMBEDDING_MODEL,
                input: batch,
                encoding_format: 'float',
            })

            embeddings.push(...response.data.map((d: any) => d.embedding))
        }

        return embeddings
    } catch (error) {
        console.error('Error generating embeddings batch:', error)
        throw new Error('Failed to generate embeddings batch')
    }
}

/**
 * Calculate cosine similarity between two embeddings
 * Returns a value between -1 and 1, where 1 means identical
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error('Embeddings must have the same length')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i]
        normA += a[i] * a[i]
        normB += b[i] * b[i]
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Prepare text for embedding generation
 * Cleans and normalizes text
 */
export function prepareTextForEmbedding(text: string): string {
    return text
        .trim()
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/\n+/g, ' ') // Replace newlines with spaces
        .substring(0, 8000) // Limit to ~8000 characters (model limit is ~8191 tokens)
}

export { EMBEDDING_MODEL, EMBEDDING_DIMENSIONS }
