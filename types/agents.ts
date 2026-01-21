/**
 * Agent Input/Output Types
 */

/**
 * Guardian Agent Types
 * Analyzes user input for safety violations
 */
export interface GuardianInput {
    userMessage: string
    machineModel: string
    conversationHistory?: Array<{
        role: 'user' | 'assistant'
        content: string
    }>
}

export interface GuardianOutput {
    decision: 'ALLOW' | 'BLOCK'
    confidence: number // 0-1
    reasoning: string
    matchedRule?: {
        id: string
        description: string
        severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'
        similarity: number
    }
}

/**
 * Diagnostician Agent Types
 * Provides troubleshooting guidance using RAG
 */
export interface DiagnosticianInput {
    userMessage: string
    machineModel: string
    conversationHistory: Array<{
        role: 'user' | 'assistant' | 'system'
        content: string
    }>
    photoUrl?: string
    incidentId: string
}

export interface DiagnosticianOutput {
    response: string
    sources?: Array<{
        manualId: string
        title: string
        excerpt: string
        similarity: number
    }>
    confidence: number // 0-1
    requiresPhotoVerification?: boolean
}

/**
 * Curator Agent Types
 * Generates CMMS service reports from conversations
 */
export interface CuratorInput {
    incidentId: string
    conversationHistory: Array<{
        role: 'user' | 'assistant' | 'system'
        content: string
        timestamp: string
    }>
    machineModel: string
    workOrder?: string
}

export interface CuratorOutput {
    asFound: string
    workPerformed: string
    asLeft: string
    summary: string
    duration?: number // in minutes
    partsUsed?: string[]
}

/**
 * Common Agent Types
 */

export type AgentRole = 'guardian' | 'diagnostician' | 'curator'

export interface AgentMetadata {
    agentRole: AgentRole
    timestamp: string
    processingTime: number // in milliseconds
    modelUsed?: string
}

export interface AgentError {
    code: string
    message: string
    details?: any
}

/**
 * Safety Levels
 */
export type SafetyLevel = 'SAFE' | 'CAUTION' | 'DANGER' | 'CRITICAL'

/**
 * Confidence Score Helpers
 */
export function getConfidenceLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (score >= 0.8) return 'HIGH'
    if (score >= 0.5) return 'MEDIUM'
    return 'LOW'
}

export function getSafetyLevel(severity?: string): SafetyLevel {
    switch (severity) {
        case 'CRITICAL':
            return 'CRITICAL'
        case 'HIGH':
            return 'DANGER'
        case 'MEDIUM':
            return 'CAUTION'
        default:
            return 'SAFE'
    }
}
