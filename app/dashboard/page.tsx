'use client'

import { useState, useEffect, useMemo, memo } from 'react'
import { authService } from '@/lib/services/auth.service'
import { useRouter } from 'next/navigation'
import type { AuthUser, Organization } from '@/types/auth'
import { DashboardSkeleton } from '@/app/components/ui/dashboard-skeleton'

export default function DashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<AuthUser | null>(null)
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateOrg, setShowCreateOrg] = useState(false)
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)

    useEffect(() => {
        loadUserData()
    }, [])

    const loadUserData = async () => {
        const currentUser = await authService.getCurrentUser()
        if (!currentUser) {
            router.push('/auth/login')
            return
        }

        setUser(currentUser)

        // If super admin, load all organizations
        if (currentUser.profile.role === 'super_admin') {
            const result = await authService.getAllOrganizations()
            if (result.success && result.organizations) {
                setOrganizations(result.organizations)
            }
        }

        setLoading(false)
    }

    const handleSignOut = async () => {
        await authService.signOut()
        router.push('/auth/login')
    }

    // Memoize statistics calculations for better performance
    const stats = useMemo(() => {
        if (!organizations || organizations.length === 0) return null

        return {
            total: organizations.length,
            active: organizations.filter(org => org.status === 'active').length
        }
    }, [organizations])

    if (loading) {
        return <DashboardSkeleton />
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            {/* Header */}
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">TechGuard AI</h1>
                                <p className="text-blue-200 text-sm">Safety Platform Dashboard</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <p className="text-white font-medium">{user?.profile.full_name}</p>
                                <p className="text-blue-200 text-sm">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-200 border border-blue-500/30">
                                        {user?.profile.role.replace('_', ' ').toUpperCase()}
                                    </span>
                                </p>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-200 rounded-lg transition-all hover:shadow-lg"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-8 shadow-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-4xl font-bold text-white mb-2">
                                Welcome back, {user?.profile.full_name}! 👋
                            </h2>
                            <p className="text-blue-100 text-lg">
                                {user?.profile.role === 'super_admin' && 'Manage organizations, users, and system settings.'}
                                {user?.profile.role === 'org_admin' && `Managing ${user?.organization?.name}`}
                                {user?.profile.role === 'technician' && 'Access troubleshooting tools and resources.'}
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

                {/* Super Admin View */}
                {user?.profile.role === 'super_admin' && (
                    <div className="space-y-8">
                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-200 text-sm font-medium">Total Organizations</p>
                                        <p className="text-4xl font-bold text-white mt-2">{stats?.total || 0}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-green-200 text-sm font-medium">Active Organizations</p>
                                        <p className="text-4xl font-bold text-white mt-2">
                                            {stats?.active || 0}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-purple-200 text-sm font-medium">System Status</p>
                                        <p className="text-2xl font-bold text-white mt-2">Operational</p>
                                    </div>
                                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                                <svg className="w-6 h-6 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Quick Actions
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => setShowCreateOrg(true)}
                                    className="group bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl p-6 text-left transition-all shadow-lg hover:shadow-2xl hover:scale-105 transform"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-xl font-bold text-white mb-1">Create Organization</h4>
                                            <p className="text-blue-100 text-sm">Add a new organization to the system</p>
                                        </div>
                                        <svg className="w-6 h-6 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setShowInviteModal(true)}
                                    className="group bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl p-6 text-left transition-all shadow-lg hover:shadow-2xl hover:scale-105 transform"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-xl font-bold text-white mb-1">Invite User</h4>
                                            <p className="text-purple-100 text-sm">Send invitation to admin or technician</p>
                                        </div>
                                        <svg className="w-6 h-6 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Organizations List */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-white flex items-center">
                                    <svg className="w-6 h-6 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    Organizations
                                </h3>
                                {organizations.length > 0 && (
                                    <span className="px-3 py-1 bg-blue-500/20 text-blue-200 rounded-full text-sm font-medium border border-blue-500/30">
                                        {organizations.length} Total
                                    </span>
                                )}
                            </div>

                            {organizations.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <p className="text-blue-200 text-lg mb-2">No organizations yet</p>
                                    <p className="text-blue-300/70 mb-6">Create your first organization to get started</p>
                                    <button
                                        onClick={() => setShowCreateOrg(true)}
                                        className="inline-flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Create Organization
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {organizations.map((org) => (
                                        <div
                                            key={org.id}
                                            className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl p-5 transition-all cursor-pointer hover:shadow-lg"
                                            onClick={() => setSelectedOrg(org)}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                                    <span className="text-white font-bold text-lg">
                                                        {org.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${org.status === 'active'
                                                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                                    }`}>
                                                    {org.status}
                                                </span>
                                            </div>

                                            <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
                                                {org.name}
                                            </h4>

                                            <div className="space-y-1.5">
                                                <div className="flex items-center text-sm text-blue-200">
                                                    <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                    </svg>
                                                    <span className="capitalize">{org.subscription_tier}</span>
                                                </div>
                                                <div className="flex items-center text-sm text-blue-300/70">
                                                    <svg className="w-4 h-4 mr-2 text-blue-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span>{new Date(org.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setSelectedOrg(org)
                                                        setShowInviteModal(true)
                                                    }}
                                                    className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center transition-colors"
                                                >
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                                    </svg>
                                                    Invite User
                                                </button>
                                                <svg className="w-5 h-5 text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Org Admin View */}
                {user?.profile.role === 'org_admin' && (
                    <div className="space-y-8">
                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-200 text-sm font-medium">Organization</p>
                                        <p className="text-2xl font-bold text-white mt-2">{user?.organization?.name}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-green-200 text-sm font-medium">Team Members</p>
                                        <p className="text-4xl font-bold text-white mt-2">-</p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-purple-200 text-sm font-medium">Subscription</p>
                                        <p className="text-2xl font-bold text-white mt-2 capitalize">{user?.organization?.subscription_tier || 'Basic'}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                                <svg className="w-6 h-6 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Quick Actions
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <a
                                    href="/dashboard/organization"
                                    className="group bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl p-6 text-left transition-all shadow-lg hover:shadow-2xl hover:scale-105 transform"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-xl font-bold text-white mb-1">Organization</h4>
                                            <p className="text-blue-100 text-sm">View organization details</p>
                                        </div>
                                        <svg className="w-6 h-6 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </a>

                                <a
                                    href="/dashboard/organization/members"
                                    className="group bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl p-6 text-left transition-all shadow-lg hover:shadow-2xl hover:scale-105 transform"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-xl font-bold text-white mb-1">Manage Members</h4>
                                            <p className="text-purple-100 text-sm">View and manage team</p>
                                        </div>
                                        <svg className="w-6 h-6 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </a>

                                <a
                                    href="/dashboard/organization/settings"
                                    className="group bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl p-6 text-left transition-all shadow-lg hover:shadow-2xl hover:scale-105 transform"
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
                                            <p className="text-green-100 text-sm">Configure organization</p>
                                        </div>
                                        <svg className="w-6 h-6 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </a>

                                <div className="group bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl p-6 text-left transition-all shadow-lg hover:shadow-2xl hover:scale-105 transform opacity-50 cursor-not-allowed">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center">
                                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-xl font-bold text-white mb-1">Manuals</h4>
                                            <p className="text-orange-100 text-sm">Coming soon</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Info Card */}
                        <div className="bg-blue-500/20 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/30">
                            <div className="flex items-start">
                                <svg className="w-6 h-6 text-blue-400 mr-3 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <h4 className="text-lg font-semibold text-white mb-2">Organization Administrator</h4>
                                    <p className="text-blue-100 text-sm">
                                        As an organization administrator, you can manage team members, configure organization settings, and access advanced features.
                                        Additional features like manual management and analytics will be available soon.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Technician View */}
                {user?.profile.role === 'technician' && (
                    <div className="space-y-8">
                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-200 text-sm font-medium">Active Sessions</p>
                                        <p className="text-4xl font-bold text-white mt-2">0</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-green-200 text-sm font-medium">Resolved Today</p>
                                        <p className="text-4xl font-bold text-white mt-2">0</p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-purple-200 text-sm font-medium">Total Sessions</p>
                                        <p className="text-4xl font-bold text-white mt-2">0</p>
                                    </div>
                                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                                <svg className="w-6 h-6 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Troubleshooting Tools
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="group bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl p-6 text-left transition-all shadow-lg hover:shadow-2xl hover:scale-105 transform opacity-50 cursor-not-allowed">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center">
                                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-xl font-bold text-white mb-1">New Session</h4>
                                            <p className="text-blue-100 text-sm">Start troubleshooting</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="group bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl p-6 text-left transition-all shadow-lg hover:shadow-2xl hover:scale-105 transform opacity-50 cursor-not-allowed">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center">
                                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-xl font-bold text-white mb-1">View Manuals</h4>
                                            <p className="text-purple-100 text-sm">Browse documentation</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="group bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl p-6 text-left transition-all shadow-lg hover:shadow-2xl hover:scale-105 transform opacity-50 cursor-not-allowed">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center">
                                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-xl font-bold text-white mb-1">My Reports</h4>
                                            <p className="text-green-100 text-sm">View service reports</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="group bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl p-6 text-left transition-all shadow-lg hover:shadow-2xl hover:scale-105 transform opacity-50 cursor-not-allowed">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center">
                                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-xl font-bold text-white mb-1">History</h4>
                                            <p className="text-orange-100 text-sm">Past sessions</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-blue-500/20 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/30">
                                <div className="flex items-start">
                                    <svg className="w-6 h-6 text-blue-400 mr-3 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    <div>
                                        <h4 className="text-lg font-semibold text-white mb-2">Safety First</h4>
                                        <p className="text-blue-100 text-sm">
                                            TechGuard AI helps you troubleshoot safely with AI-powered guidance that blocks dangerous actions and provides step-by-step instructions.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-purple-500/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
                                <div className="flex items-start">
                                    <svg className="w-6 h-6 text-purple-400 mr-3 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <h4 className="text-lg font-semibold text-white mb-2">Coming Soon</h4>
                                        <p className="text-purple-100 text-sm">
                                            AI-powered troubleshooting, manual search, photo diagnostics, and automated service reports are currently in development.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Modals */}
            {showCreateOrg && (
                <CreateOrganizationModal
                    onClose={() => setShowCreateOrg(false)}
                    onSuccess={loadUserData}
                />
            )}

            {showInviteModal && (
                <InviteUserModal
                    organizations={organizations}
                    selectedOrg={selectedOrg}
                    onClose={() => {
                        setShowInviteModal(false)
                        setSelectedOrg(null)
                    }}
                />
            )}

            {selectedOrg && !showInviteModal && (
                <OrganizationDetailsModal
                    organization={selectedOrg}
                    onClose={() => setSelectedOrg(null)}
                    onInvite={() => {
                        setShowInviteModal(true)
                    }}
                />
            )}
        </div>
    )
}

// Create Organization Modal Component (Memoized for performance)
const CreateOrganizationModal = memo(function CreateOrganizationModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        name: '',
        subscriptionTier: 'basic' as 'basic' | 'professional' | 'enterprise',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { createOrganization } = await import('@/lib/actions/auth.actions')
        const result = await createOrganization(formData.name, formData.subscriptionTier)

        if (result.success) {
            onSuccess()
            onClose()
        } else {
            setError(result.error || 'Failed to create organization')
        }

        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl animate-slideUp">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">Create Organization</h3>
                    <button
                        onClick={onClose}
                        className="text-white/60 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-blue-100 mb-2">
                            Organization Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Acme Corporation"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-blue-100 mb-2">
                            Subscription Tier *
                        </label>
                        <select
                            value={formData.subscriptionTier}
                            onChange={(e) => setFormData({ ...formData, subscriptionTier: e.target.value as any })}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        >
                            <option value="basic" className="bg-slate-800">Basic - Essential features</option>
                            <option value="professional" className="bg-slate-800">Professional - Advanced features</option>
                            <option value="enterprise" className="bg-slate-800">Enterprise - Full access</option>
                        </select>
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm flex items-start">
                            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <div className="flex space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all disabled:opacity-50 font-medium shadow-lg"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating...
                                </span>
                            ) : (
                                'Create Organization'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
})

// Invite User Modal Component (Memoized for performance)
const InviteUserModal = memo(function InviteUserModal({
    organizations,
    selectedOrg,
    onClose
}: {
    organizations: Organization[]
    selectedOrg: Organization | null
    onClose: () => void
}) {
    const [formData, setFormData] = useState({
        orgId: selectedOrg?.id || '',
        email: '',
        role: 'technician' as 'org_admin' | 'technician',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [inviteLink, setInviteLink] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setInviteLink('')

        const { generateInviteToken } = await import('@/lib/actions/auth.actions')
        const result = await generateInviteToken(
            formData.orgId,
            formData.email,
            formData.role
        )

        if (result.success && result.inviteLink) {
            setInviteLink(result.inviteLink)
        } else {
            setError(result.error || 'Failed to generate invite')
        }

        setLoading(false)
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink)
        // Show a temporary success message
        const btn = document.getElementById('copy-btn')
        if (btn) {
            btn.textContent = 'Copied!'
            setTimeout(() => {
                btn.textContent = 'Copy'
            }, 2000)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl animate-slideUp">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">Invite User</h3>
                    <button
                        onClick={onClose}
                        className="text-white/60 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {!inviteLink ? (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-blue-100 mb-2">
                                Organization *
                            </label>
                            <select
                                required
                                value={formData.orgId}
                                onChange={(e) => setFormData({ ...formData, orgId: e.target.value })}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            >
                                <option value="" className="bg-slate-800">Select organization...</option>
                                {organizations.map((org) => (
                                    <option key={org.id} value={org.id} className="bg-slate-800">{org.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-blue-100 mb-2">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                placeholder="user@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-blue-100 mb-2">
                                Role *
                            </label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            >
                                <option value="technician" className="bg-slate-800">Technician - Field user</option>
                                <option value="org_admin" className="bg-slate-800">Organization Admin - Manager</option>
                            </select>
                        </div>

                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm flex items-start">
                                <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <div className="flex space-x-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all disabled:opacity-50 font-medium shadow-lg"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Generating...
                                    </span>
                                ) : (
                                    'Generate Invite Link'
                                )}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-5">
                        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-start">
                            <svg className="w-6 h-6 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="text-green-200 font-medium">Invite link generated successfully!</p>
                                <p className="text-green-300/70 text-sm mt-1">Share this link with the user to complete registration.</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-blue-100 mb-2">
                                Invite Link
                            </label>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={inviteLink}
                                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm font-mono"
                                    onClick={(e) => (e.target as HTMLInputElement).select()}
                                />
                                <button
                                    id="copy-btn"
                                    onClick={copyToClipboard}
                                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all font-medium shadow-lg hover:shadow-xl"
                                >
                                    Copy
                                </button>
                            </div>
                            <p className="text-blue-300/70 text-xs mt-2">
                                This link expires in 7 days and can only be used once.
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all font-medium"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
})

// Organization Details Modal (Memoized for performance)
const OrganizationDetailsModal = memo(function OrganizationDetailsModal({
    organization,
    onClose,
    onInvite,
}: {
    organization: Organization
    onClose: () => void
    onInvite: () => void
}) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-slate-800 rounded-2xl p-8 max-w-lg w-full border border-white/20 shadow-2xl animate-slideUp">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">Organization Details</h3>
                    <button
                        onClick={onClose}
                        className="text-white/60 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-2xl">
                                {organization.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h4 className="text-2xl font-bold text-white">{organization.name}</h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${organization.status === 'active'
                                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                }`}>
                                {organization.status.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <p className="text-blue-200 text-sm mb-1">Subscription Tier</p>
                            <p className="text-white font-semibold capitalize">{organization.subscription_tier}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <p className="text-blue-200 text-sm mb-1">Created</p>
                            <p className="text-white font-semibold">{new Date(organization.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                        <button
                            onClick={onInvite}
                            className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all font-medium shadow-lg hover:shadow-xl flex items-center justify-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            Invite User to {organization.name}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
})
