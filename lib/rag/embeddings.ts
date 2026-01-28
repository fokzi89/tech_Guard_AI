import OpenAI from 'openai'

/**
 * OpenAI client for embedding generation
 */
let openaiClient: OpenAI | null = null

function getOpenAIClient() {
    if (!openaiClient) {
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        })
    }
    return openaiClient
}

/**
 * Embedding model configuration
 */
const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIMENSIONS = 1536

/**
 * Generate embedding for a single text string
 */
export async function generateEmbedding(text: string): Promise<number[]> {
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
        throw new Error('Failed to generate embedding')
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
