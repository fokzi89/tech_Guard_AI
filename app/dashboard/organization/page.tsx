'use client'

import { useState, useEffect } from 'react'
import { authService } from '@/lib/services/auth.service'
import { useRouter } from 'next/navigation'
import { NavigationButton } from '@/app/components/ui/navigation-button'
import { DashboardSkeleton } from '@/app/components/ui/dashboard-skeleton'
import { InviteUserModal } from '@/app/components/dashboard/InviteUserModal'
import type { AuthUser } from '@/types/auth'

export default function OrgAdminDashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [showInviteModal, setShowInviteModal] = useState(false)

    useEffect(() => {
        loadUser()
    }, [])

    const loadUser = async () => {
        const currentUser = await authService.getCurrentUser()

        if (!currentUser) {
            router.push('/auth/login')
            return
        }

        // Only org admins should access this page
        if (currentUser.profile.role !== 'org_admin') {
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
                                Managing {user.organization?.name}
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

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="glass-panel glass-panel-hover rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="gradient-text-muted text-sm font-medium">Organization</p>
                                <p className="text-2xl font-bold gradient-text mt-2">{user.organization?.name}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel glass-panel-hover rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="gradient-text-muted text-sm font-medium">Team Members</p>
                                <p className="text-4xl font-bold gradient-text mt-2">-</p>
                            </div>
                            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel glass-panel-hover rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="gradient-text-muted text-sm font-medium">Subscription</p>
                                <p className="text-2xl font-bold gradient-text mt-2 capitalize">{user.organization?.subscription_tier || 'Basic'}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Invite Members Button */}
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="group bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl p-6 text-left transition-all shadow-lg hover:shadow-2xl hover:scale-105 transform"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xl font-bold text-white mb-1">Invite Members</h4>
                                    <p className="text-blue-100 text-sm">Add org admins or technicians</p>
                                </div>
                                <svg className="w-6 h-6 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>

                        {/* Add Manual Button */}
                        <NavigationButton
                            href="/dashboard/organization/manuals"
                            unstyled
                            className="group w-full bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl p-6 text-left transition-all shadow-lg hover:shadow-2xl hover:scale-105 transform"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xl font-bold text-white mb-1">Add Manual</h4>
                                    <p className="text-purple-100 text-sm">Upload machine documentation</p>
                                </div>
                                <svg className="w-6 h-6 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </NavigationButton>

                        {/* View Report History Button */}
                        <NavigationButton
                            href="/dashboard/organization/reports"
                            unstyled
                            className="group w-full bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl p-6 text-left transition-all shadow-lg hover:shadow-2xl hover:scale-105 transform"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xl font-bold text-white mb-1">Report History</h4>
                                    <p className="text-green-100 text-sm">View all service reports</p>
                                </div>
                                <svg className="w-6 h-6 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </NavigationButton>

                        {/* Settings Button */}
                        <NavigationButton
                            href="/dashboard/organization/settings"
                            unstyled
                            className="group w-full bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl p-6 text-left transition-all shadow-lg hover:shadow-2xl hover:scale-105 transform"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xl font-bold text-white mb-1">Settings</h4>
                                    <p className="text-orange-100 text-sm">Configure organization</p>
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h4 className="text-lg font-semibold gradient-text mb-2">Organization Administrator</h4>
                            <p className="gradient-text-muted text-sm">
                                As an organization administrator, you can invite team members, upload manuals, view reports, and configure organization settings.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Invite Modal */}
            {showInviteModal && (
                <InviteUserModal
                    currentUserRole={user.profile.role}
                    currentOrgId={user.organization?.id}
                    currentOrgName={user.organization?.name}
                    onClose={() => setShowInviteModal(false)}
                />
            )}
        </div>
    )
}
