'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StatsCard } from '@/app/components/dashboard/StatsCard'
import { Button } from '@/app/components/shared/Button'
import { InviteUserModal } from '@/app/components/dashboard/InviteUserModal'
import Link from 'next/link'

interface Organization {
    id: string
    name: string
    status: string
    subscription_tier: string
    created_at: string
}

export default function OrganizationPage() {
    const [organization, setOrganization] = useState<Organization | null>(null)
    const [memberCount, setMemberCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [currentUserRole, setCurrentUserRole] = useState<'super_admin' | 'org_admin' | 'technician'>('technician')
    const [inviteModalOpen, setInviteModalOpen] = useState(false)

    useEffect(() => {
        loadOrganization()
    }, [])

    const loadOrganization = async () => {
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id, role')
            .eq('id', user.id)
            .single()

        const profileData = profile as any;
        if (profileData?.role) {
            setCurrentUserRole(profileData.role)
        }

        if (profileData?.org_id) {
            const { data: orgData } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', profileData.org_id)
                .single()

            if (orgData) {
                setOrganization(orgData)
            }

            const { count } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('org_id', profileData.org_id)

            setMemberCount(count || 0)
        }

        setLoading(false)
    }

    if (loading) {
        return (
            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-muted rounded w-1/4"></div>
                        <div className="h-64 bg-muted rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (!organization) {
        return (
            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No organization found</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-8 gradient-blue-bg min-h-screen">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold gradient-text">{organization.name}</h1>
                        <p className="gradient-text-muted mt-1">Organization Overview</p>
                    </div>
                    <Link href="/dashboard">
                        <Button variant="outline">Back to Dashboard</Button>
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatsCard
                        title="Total Members"
                        value={memberCount}
                        description="Active team members"
                        icon={
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        }
                    />
                    <StatsCard
                        title="Subscription"
                        value={organization.subscription_tier.charAt(0).toUpperCase() + organization.subscription_tier.slice(1)}
                        description="Current plan"
                        icon={
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                        }
                    />
                    <StatsCard
                        title="Status"
                        value={organization.status.charAt(0).toUpperCase() + organization.status.slice(1)}
                        description="Organization status"
                        icon={
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />
                </div>

                {/* Quick Actions */}
                <div className="glass-panel rounded-lg p-6">
                    <h2 className="text-lg font-semibold gradient-text mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Only show Invite User for super_admin and org_admin */}
                        {currentUserRole !== 'technician' && (
                            <div
                                onClick={() => setInviteModalOpen(true)}
                                className="glass-panel glass-panel-hover rounded-lg p-4 cursor-pointer"
                            >
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-sm font-medium gradient-text">Invite User</h3>
                                        <p className="text-sm gradient-text-muted">Generate invite link for new members</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Link href="/dashboard/organization/settings">
                            <div className="glass-panel glass-panel-hover rounded-lg p-4 cursor-pointer">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-sm font-medium gradient-text">Organization Settings</h3>
                                        <p className="text-sm gradient-text-muted">Update organization details</p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Organization Details */}
                <div className="glass-panel rounded-lg p-6">
                    <h2 className="text-lg font-semibold gradient-text mb-4">Organization Details</h2>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <dt className="text-sm font-medium gradient-text-muted">Organization Name</dt>
                            <dd className="mt-1 text-sm gradient-text">{organization.name}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium gradient-text-muted">Status</dt>
                            <dd className="mt-1">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${organization.status === 'active'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                    }`}>
                                    {organization.status}
                                </span>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium gradient-text-muted">Subscription Tier</dt>
                            <dd className="mt-1 text-sm gradient-text capitalize">{organization.subscription_tier}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium gradient-text-muted">Created</dt>
                            <dd className="mt-1 text-sm gradient-text">
                                {new Date(organization.created_at).toLocaleDateString()}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* Invite User Modal */}
            {inviteModalOpen && organization && (
                <InviteUserModal
                    onClose={() => setInviteModalOpen(false)}
                    currentUserRole={currentUserRole}
                    currentOrgId={organization.id}
                    currentOrgName={organization.name}
                />
            )}
        </div>
    )
}
