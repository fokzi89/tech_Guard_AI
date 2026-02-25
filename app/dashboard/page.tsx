'use client'

import { useState, useEffect, useMemo, memo } from 'react'
import { authService } from '@/lib/services/auth.service'
import { useRouter } from 'next/navigation'
import type { Organization } from '@/types/auth'
import { DashboardSkeleton } from '@/app/components/ui/dashboard-skeleton'
import { InviteUserModal } from '@/app/components/dashboard/InviteUserModal'
import { useUser } from '@/hooks/useUser'
import { useOrganizations } from '@/hooks/useOrganizations'
import { NavigationButton } from '@/app/components/ui/navigation-button'


export default function DashboardPage() {
    const router = useRouter()
    const { user, loading: userLoading, mutate: mutateUser } = useUser()
    const { organizations, loading: orgsLoading, mutate: mutateOrgs } = useOrganizations(user?.profile.role === 'super_admin')
    const [showCreateOrg, setShowCreateOrg] = useState(false)
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)

    useEffect(() => {
        if (!userLoading && !user) {
            router.push('/auth/login')
            return
        }

        // Redirect non-super-admin users to their appropriate dashboards
        if (!userLoading && user) {
            if (user.profile.role === 'org_admin') {
                router.push('/dashboard/organization')
                return
            }
            if (user.profile.role === 'technician') {
                router.push('/dashboard/technician')
                return
            }
        }
    }, [user, userLoading, router])


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

    const isLoading = userLoading || (user?.profile.role === 'super_admin' && orgsLoading)

    if (isLoading) {
        return <DashboardSkeleton />
    }


    return (
        <div className="min-h-screen gradient-blue-bg">
            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="glass-panel rounded-2xl p-8 mb-8 shadow-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-4xl font-bold gradient-text mb-2">
                                Welcome back, {user?.profile.full_name}! 👋
                            </h2>
                            <p className="gradient-text-muted text-lg">
                                Manage organizations, users, and system settings.
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
                            <div className="glass-panel glass-panel-hover rounded-xl p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="gradient-text-muted text-sm font-medium">Total Organizations</p>
                                        <p className="text-4xl font-bold gradient-text mt-2">{stats?.total || 0}</p>
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
                                        <p className="gradient-text-muted text-sm font-medium">Active Organizations</p>
                                        <p className="text-4xl font-bold gradient-text mt-2">
                                            {stats?.active || 0}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-panel glass-panel-hover rounded-xl p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="gradient-text-muted text-sm font-medium">System Status</p>
                                        <p className="text-2xl font-bold gradient-text mt-2">Operational</p>
                                    </div>
                                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="glass-panel rounded-2xl p-6">
                            <h3 className="text-2xl font-bold gradient-text mb-6 flex items-center">
                                <svg className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        <div className="glass-panel rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold gradient-text flex items-center">
                                    <svg className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                            className="group bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-white/20 rounded-xl p-5 transition-all cursor-pointer hover:shadow-lg"
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
            </main>

            {/* Modals */}
            {showCreateOrg && (
                <CreateOrganizationModal
                    onClose={() => setShowCreateOrg(false)}
                    onSuccess={() => {
                        mutateUser()
                        mutateOrgs()
                    }}
                />
            )}

            {showInviteModal && (
                <InviteUserModal
                    organizations={organizations}
                    selectedOrg={selectedOrg}
                    currentUserRole={user?.profile.role || 'technician'}
                    currentOrgId={user?.organization?.id}
                    currentOrgName={user?.organization?.name}
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
