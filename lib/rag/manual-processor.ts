const pdfParse = require('pdf-parse');
import { generateEmbedding, prepareTextForEmbedding } from './embeddings'

/**
 * Manual chunk type
 */
export interface ManualChunk {
    content: string
    embedding: number[]
    pageNumber?: number
    chunkIndex: number
}

/**
 * Processed manual type
 */
export interface ProcessedManual {
    title: string
    machineModel: string
    content: string
    chunks: ManualChunk[]
    safetyWarnings: SafetyWarning[]
    metadata: {
        totalPages: number
        version?: string
        extractedAt: string
    }
}

/**
 * Safety warning type
 */
export interface SafetyWarning {
    type: 'DANGER' | 'WARNING' | 'CAUTION'
    description: string
    context: string
    pageNumber?: number
}

/**
 * Extract text from PDF buffer
 */
/**
 * Extract text from PDF buffer
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<{
    text: string
    totalPages: number
}> {
    try {
        const data = await pdfParse(pdfBuffer);

        return {
            text: data.text,
            totalPages: data.numpages,
        }
    } catch (error) {
        console.error('Error extracting text from PDF:', error)
        throw new Error('Failed to extract text from PDF')
    }
}

/**
 * Split text into chunks with overlap
 * This helps maintain context across chunk boundaries
 */
export function chunkText(
    text: string,
    options: {
        chunkSize?: number
        overlap?: number
    } = {}
): string[] {
    const { chunkSize = 1000, overlap = 200 } = options

    const chunks: string[] = []
    let startIndex = 0

    while (startIndex < text.length) {
        const endIndex = Math.min(startIndex + chunkSize, text.length)
        const chunk = text.substring(startIndex, endIndex)
        chunks.push(chunk.trim())

        // Move to next chunk with overlap
        startIndex = endIndex - overlap

        // Prevent infinite loop if we're at the end
        if (startIndex + overlap >= text.length) {
            break
        }
    }

    return chunks
}

/**
 * Extract safety warnings from manual text
 * Looks for common safety warning patterns
 */
export function extractSafetyWarnings(text: string): SafetyWarning[] {
    const warnings: SafetyWarning[] = []

    // Patterns for different warning types
    const patterns = {
        DANGER: /(?:DANGER|⚠️\s*DANGER)[:\s]+(.*?)(?:\n\n|$)/gi,
        WARNING: /(?:WARNING|⚠️\s*WARNING)[:\s]+(.*?)(?:\n\n|$)/gi,
        CAUTION: /(?:CAUTION|⚠️\s*CAUTION)[:\s]+(.*?)(?:\n\n|$)/gi,
    }

    // Extract each type of warning
    Object.entries(patterns).forEach(([type, pattern]) => {
        let match
        while ((match = pattern.exec(text)) !== null) {
            const description = match[1].trim()

            // Get surrounding context (100 chars before and after)
            const matchIndex = match.index
            const contextStart = Math.max(0, matchIndex - 100)
            const contextEnd = Math.min(text.length, matchIndex + match[0].length + 100)
            const context = text.substring(contextStart, contextEnd).trim()

            warnings.push({
                type: type as 'DANGER' | 'WARNING' | 'CAUTION',
                description,
                context,
            })
        }
    })

    return warnings
}

/**
 * Extract machine model from manual text
 * Looks for common patterns like "Model: XYZ" or "Machine: XYZ"
 */
export function extractMachineModel(text: string): string | null {
    const patterns = [
        /(?:Model|Machine)\s*(?:Number|#)?[:\s]+([A-Z0-9\-]+)/i,
        /(?:Part\s*Number|P\/N)[:\s]+([A-Z0-9\-]+)/i,
    ]

    for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match) {
            return match[1].trim()
        }
    }

    return null
}

/**
 * Extract version from manual text
 */
export function extractVersion(text: string): string | null {
    const patterns = [
        /Version[:\s]+([0-9.]+)/i,
        /Rev(?:ision)?[:\s]+([0-9.]+)/i,
        /v([0-9.]+)/i,
    ]

    for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match) {
            return match[1].trim()
        }
    }

    return null
}

/**
 * Process a PDF manual completely
 * Extracts text, chunks it, generates embeddings, and extracts safety warnings
 */
export async function processManual(
    pdfBuffer: Buffer,
    title: string,
    machineModel?: string
): Promise<ProcessedManual> {
    try {
        // Extract text from PDF
        const { text, totalPages } = await extractTextFromPDF(pdfBuffer)

        // Extract metadata
        const extractedModel = machineModel || extractMachineModel(text) || 'Unknown'
        const version = extractVersion(text) || '1.0'

        // Extract safety warnings
        const safetyWarnings = extractSafetyWarnings(text)

        // Chunk the text
        const textChunks = chunkText(text, {
            chunkSize: 1000,
            overlap: 200,
        })

        // Generate embeddings for each chunk
        const chunks: ManualChunk[] = []
        for (let i = 0; i < textChunks.length; i++) {
            const chunkText = textChunks[i]
            const preparedText = prepareTextForEmbedding(chunkText)
            const embedding = await generateEmbedding(preparedText)

            chunks.push({
                content: chunkText,
                embedding,
                chunkIndex: i,
            })
        }

        return {
            title,
            machineModel: extractedModel,
            content: text,
            chunks,
            safetyWarnings,
            metadata: {
                totalPages,
                version,
                extractedAt: new Date().toISOString(),
            },
        }
    } catch (error) {
        console.error('Error processing manual:', error)
        throw new Error('Failed to process manual')
    }
}

/**
 * Extract safety rules for blacklist from safety warnings
 * Converts warnings into searchable safety rules with embeddings
 */
export async function extractSafetyRules(
    safetyWarnings: SafetyWarning[],
    machineModel: string
): Promise<Array<{
    ruleDescription: string
    embedding: number[]
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'
}>> {
    const rules: Array<{
        ruleDescription: string
        embedding: number[]
        severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'
    }> = []

    for (const warning of safetyWarnings) {
        // Map warning types to severity levels
        const severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' = warning.type === 'DANGER' ? 'CRITICAL'
            : warning.type === 'WARNING' ? 'HIGH'
                : 'MEDIUM'

        // Prepare the rule description
        const ruleDescription = `${warning.type}: ${warning.description}`
        const preparedText = prepareTextForEmbedding(ruleDescription)

        // Generate embedding
        const embedding = await generateEmbedding(preparedText)

        rules.push({
            ruleDescription,
            embedding,
            severity,
        })
    }

    return rules
}
