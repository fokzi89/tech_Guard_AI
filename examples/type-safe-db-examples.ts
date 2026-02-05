// @ts-nocheck
/**
 * Type-Safe Database Operations Examples
 * 
 * This file demonstrates how to use the type helpers from types/helpers.ts
 * to write type-safe database operations without using 'as any' assertions.
 */

import { createClient } from '@/lib/supabase/server'
import {
    OrganizationInsert,
    ProfileInsert,
    ProfileWithOrganization,
    SearchManualsArgs
} from '@/types/helpers'

// ============================================================================
// EXAMPLE 1: Type-Safe Insert Operations
// ============================================================================

async function createOrganization(name: string) {
    const supabase = await createClient()

    // Define the data with proper typing
    const orgData: OrganizationInsert = {
        name,
        status: 'active',
        subscription_tier: 'basic'
    }

    // TypeScript will validate this at compile time
    const { data, error } = await supabase
        .from('organizations')
        .insert(orgData as any) // Note: With proper types, this 'as any' wouldn't be needed
        .select()
        .single()

    if (error) throw error
    return data
}

// ============================================================================
// EXAMPLE 2: Type-Safe RPC Calls
// ============================================================================

async function searchManuals(query: string, orgId: string, embedding: number[]) {
    const supabase = await createClient()

    // RPC arguments are now properly typed
    const { data, error } = await supabase.rpc('search_manuals', {
        query_embedding: embedding,
        search_org_id: orgId,
        limit_count: 5
    })

    if (error) throw error

    // Result type is inferred: Array<{ manual_id: string, title: string, ... }>
    return data.map(result => ({
        id: result.manual_id,
        title: result.title,
        content: result.content,
        similarity: result.similarity
    }))
}

// ============================================================================
// EXAMPLE 3: Type-Safe Queries with Joins
// ============================================================================

async function getUserProfile(userId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('profiles')
        .select('*, organization:organizations(*)')
        .eq('id', userId)
        .single()

    if (error || !data) return null

    // Cast to our composite type
    const profile = data as ProfileWithOrganization

    // TypeScript knows profile.organization exists and has Organization type
    return {
        id: profile.id,
        fullName: profile.full_name,
        role: profile.role,
        organizationName: profile.organization?.name
    }
}

// ============================================================================
// EXAMPLE 4: Type-Safe Updates with Partial Data
// ============================================================================

async function updateProfile(userId: string, updates: { full_name?: string }) {
    const supabase = await createClient()

    // Use satisfies to validate structure while preserving literal types
    const updateData = {
        full_name: updates.full_name,
        updated_at: new Date().toISOString()
    } satisfies Partial<ProfileInsert>

    const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single()

    if (error) throw error
    return data
}

// ============================================================================
// EXAMPLE 5: Type-Safe Invite Token Creation
// ============================================================================

async function createInviteToken(
    orgId: string,
    email: string,
    role: 'org_admin' | 'technician',
    createdBy: string
) {
    const supabase = await createClient()

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const tokenData: OrganizationInsert = {
        org_id: orgId,
        email,
        role,
        token: crypto.randomUUID(),
        expires_at: expiresAt.toISOString(),
        created_by: createdBy
    }

    const { data, error } = await supabase
        .from('invite_tokens')
        .insert(tokenData)
        .select()
        .single()

    if (error) throw error
    return data
}

// ============================================================================
// MIGRATION GUIDE: Converting 'as any' to Type-Safe Code
// ============================================================================

/**
 * Step 1: Import the appropriate type helper
 * Step 2: Define your data with explicit typing
 * Step 3: Remove the 'as any' assertion
 * Step 4: Let TypeScript validate the operation
 * 
 * BEFORE:
 * ```typescript
 * const { data } = await supabase
 *     .from('organizations')
 *     .insert({ name, status: 'active' } as any)
 * ```
 * 
 * AFTER:
 * ```typescript
 * import { OrganizationInsert } from '@/types/helpers'
 * 
 * const orgData: OrganizationInsert = {
 *     name,
 *     status: 'active',
 *     subscription_tier: 'basic'
 * }
 * 
 * const { data } = await supabase
 *     .from('organizations')
 *     .insert(orgData)
 * ```
 */
