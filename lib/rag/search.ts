import { createClient } from '@/lib/supabase/server'

/**
 * Search result type
 */
export interface SearchResult {
    id: string
    title: string
    machineModel: string
    content: string
    similarity: number
    safetyWarnings?: any
    version?: string
}

/**
 * Search manuals using vector similarity
 */
export async function searchManuals(
    query: string,
    queryEmbedding: number[],
    options: {
        orgId?: string
        limit?: number
        similarityThreshold?: number
    } = {}
): Promise<SearchResult[]> {
    const {
        orgId,
        limit = 5,
        similarityThreshold = 0.7,
    } = options

    const supabase = await createClient()

    try {
        // Build the query
        let dbQuery = (supabase
            .rpc as any)('search_manuals', {
                query_embedding: queryEmbedding,
                search_org_id: orgId || null,
                limit_count: limit,
            })

        const { data, error } = await dbQuery

        if (error) {
            console.error('Error searching manuals:', error)
            throw error
        }

        // Filter by similarity threshold and map to SearchResult
        const results: SearchResult[] = (data || [])
            .filter((result: any) => result.similarity >= similarityThreshold)
            .map((result: any) => ({
                id: result.manual_id,
                title: result.title,
                machineModel: result.machine_model || '',
                content: result.content,
                similarity: result.similarity,
                safetyWarnings: result.safety_warnings,
                version: result.version,
            }))

        return results
    } catch (error) {
        console.error('Error in searchManuals:', error)
        throw new Error('Failed to search manuals')
    }
}

/**
 * Search safety blacklist for dangerous actions
 */
export async function searchSafetyBlacklist(
    userInput: string,
    inputEmbedding: number[],
    machineModel: string,
    options: {
        similarityThreshold?: number
    } = {}
): Promise<{
    matched: boolean
    ruleId?: string
    ruleDescription?: string
    severity?: string
    similarity?: number
} | null> {
    const { similarityThreshold = 0.85 } = options

    const supabase = await createClient()

    try {
        const { data, error } = await (supabase
            .rpc as any)('check_safety_blacklist', {
                user_input: userInput,
                machine_model: machineModel,
            })

        if (error) {
            console.error('Error checking safety blacklist:', error)
            return null
        }

        // Check if we have a match above threshold
        const matchData = data as any;
        if (matchData && matchData.length > 0) {
            const match = matchData[0]
            if (match.similarity >= similarityThreshold) {
                return {
                    matched: true,
                    ruleId: match.rule_id,
                    ruleDescription: match.rule_description,
                    severity: match.severity,
                    similarity: match.similarity,
                }
            }
        }

        return { matched: false }
    } catch (error) {
        console.error('Error in searchSafetyBlacklist:', error)
        return null
    }
}

/**
 * Get manual by ID
 */
export async function getManualById(manualId: string): Promise<SearchResult | null> {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('manuals')
            .select('*')
            .eq('id', manualId)
            .single()

        if (error || !data) {
            return null
        }

        const manualData = data as any;
        return {
            id: manualData.id,
            title: manualData.title,
            machineModel: manualData.machine_model,
            content: manualData.content,
            similarity: 1.0, // Exact match
            safetyWarnings: manualData.safety_warnings,
            version: manualData.version,
        }
    } catch (error) {
        console.error('Error getting manual:', error)
        return null
    }
}

/**
 * Get all manuals for an organization
 */
export async function getOrganizationManuals(orgId: string): Promise<SearchResult[]> {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('manuals')
            .select('*')
            .eq('org_id', orgId)
            .eq('status', 'active')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error getting organization manuals:', error)
            return []
        }

        return (data || []).map((manual: any) => ({
            id: manual.id,
            title: manual.title,
            machineModel: manual.machine_model,
            content: manual.content,
            similarity: 1.0,
            safetyWarnings: manual.safety_warnings,
            version: manual.version,
        }))
    } catch (error) {
        console.error('Error in getOrganizationManuals:', error)
        return []
    }
}
