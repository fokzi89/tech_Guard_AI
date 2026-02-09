'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/services/auth.service'
import { VerticalNav } from '@/app/components/shared/VerticalNav'
import type { AuthUser } from '@/types/auth'
import { DashboardSkeleton } from '@/app/components/ui/dashboard-skeleton'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    const currentUser = await authService.getCurrentUser()

    if (!currentUser) {
      router.push('/auth/login')
      return
    }

    setUser(currentUser)
    setLoading(false)
  }

  const handleSignOut = async () => {
    await authService.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <DashboardSkeleton />
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <VerticalNav
        userRole={user.profile.role}
        userName={user.profile.full_name}
        orgName={user.organization?.name}
        onSignOut={handleSignOut}
      />

      {/* Main content area - offset for the fixed nav */}
      <main className="lg:pl-64">
        {children}
      </main>
    </div>
  )
}
