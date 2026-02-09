
import useSWR from 'swr'
import { authService } from '@/lib/services/auth.service'
import type { AuthUser } from '@/types/auth'

const fetcher = async () => {
    const user = await authService.getCurrentUser()
    return user
}

export function useUser() {
    const { data: user, error, isLoading, mutate } = useSWR<AuthUser | null>('currentUser', fetcher, {
        revalidateOnFocus: false, // Don't refetch on window focus to avoid unnecessary hits
        revalidateIfStale: false, // Don't refetch if we have data (unless manually invalidated)
        shouldRetryOnError: true,
    })

    return {
        user,
        loading: isLoading,
        error,
        mutate,
    }
}
