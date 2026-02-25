'use client'

import { useState, useEffect } from 'react'
import { authService } from '@/lib/services/auth.service'
import { useRouter } from 'next/navigation'
import { NavigationButton } from '@/app/components/ui/navigation-button'
import { DashboardSkeleton } from '@/app/components/ui/dashboard-skeleton'
import type { AuthUser } from '@/types/auth'

export default function TechnicianDashboardPage() {
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

        // Only technicians should access this page
        if (currentUser.profile.role !== 'technician') {
            router.push('/dashboard')
            return
        }

        setUser(currentUser)
        setLoading(false)
    }

    if (loading) {
        return <DashboardSkeleton />
    }

    if (!user) return null

    return (
        <div className="min-h-screen gradient-blue-bg">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="glass-panel rounded-2xl p-8 mb-8 shadow-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-4xl font-bold gradient-text mb-2">
                                Welcome, {user.profile.full_name}! 👋
                            </h2>
                            <p className="gradient-text-muted text-lg">
                                {user.organization?.name} Technician
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-2xl">
                                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="glass-panel rounded-2xl p-6 mb-8">
                    <h3 className="text-2xl font-bold gradient-text mb-6 flex items-center">
                        <svg className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Quick Actions
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* New Troubleshoot Session */}
                        <NavigationButton
                            href="/dashboard/troubleshoot/new"
                            unstyled
                            className="group w-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl p-6 text-left transition-all shadow-lg hover:shadow-2xl hover:scale-105 transform"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xl font-bold text-white mb-1">New Session</h4>
                                    <p className="text-blue-100 text-sm">Start troubleshooting</p>
                                </div>
                                <svg className="w-6 h-6 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </NavigationButton>

                        {/* View Company Manuals */}
                        <NavigationButton
                            href="/dashboard/technician/manuals"
                            unstyled
                            className="group w-full bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl p-6 text-left transition-all shadow-lg hover:shadow-2xl hover:scale-105 transform"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xl font-bold text-white mb-1">View Manuals</h4>
                                    <p className="text-purple-100 text-sm">Company documentation</p>
                                </div>
                                <svg className="w-6 h-6 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </NavigationButton>

                        {/* View My Report History */}
                        <NavigationButton
                            href="/dashboard/technician/reports"
                            unstyled
                            className="group w-full bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl p-6 text-left transition-all shadow-lg hover:shadow-2xl hover:scale-105 transform"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xl font-bold text-white mb-1">Report History</h4>
                                    <p className="text-green-100 text-sm">View my reports</p>
                                </div>
                                <svg className="w-6 h-6 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </NavigationButton>
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-blue-500/10 dark:bg-blue-500/20 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/20 dark:border-blue-500/30">
                    <div className="flex items-start">
                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <div>
                            <h4 className="text-lg font-semibold gradient-text mb-2">AI-Powered Troubleshooting</h4>
                            <p className="gradient-text-muted text-sm">
                                TechGuard AI helps you troubleshoot safely with AI-powered guidance, step-by-step instructions, and access to company manuals. Start a new session to begin!
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
