
import useSWR from 'swr'
import { authService } from '@/lib/services/auth.service'
import type { Organization } from '@/types/auth'

const fetcher = async () => {
    const result = await authService.getAllOrganizations()
    if (result.success && result.organizations) {
        return result.organizations
    }
    throw new Error(result.error || 'Failed to fetch organizations')
}

export function useOrganizations(shouldFetch: boolean = false) {
    const { data: organizations, error, isLoading, mutate } = useSWR<Organization[]>(
        shouldFetch ? 'organizations' : null, // Only fetch if shouldFetch is true
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
        }
    )

    return {
        organizations: organizations || [],
        loading: isLoading,
        error,
        mutate,
    }
}
