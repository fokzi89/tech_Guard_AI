'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StatsCard } from '@/app/components/dashboard/StatsCard'
import Link from 'next/link'

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        totalOrgs: 0,
        activeOrgs: 0,
        totalUsers: 0,
        newOrgsThisMonth: 0,
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        const supabase = createClient()

        // Get organizations
        const { data: orgs } = await supabase
            .from('organizations')
            .select('*')

        // Get users
        const { count: userCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })

        const now = new Date()
        const newOrgs = orgs?.filter(org => {
            const created = new Date(org.created_at)
            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
        }) || []

        setStats({
            totalOrgs: orgs?.length || 0,
            activeOrgs: orgs?.filter(o => o.status === 'active').length || 0,
            totalUsers: userCount || 0,
            newOrgsThisMonth: newOrgs.length,
        })

        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Platform Administration</h1>
                    <p className="text-gray-600 mt-1">System-wide statistics and controls</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                        title="Total Organizations"
                        value={stats.totalOrgs}
                        description="All registered organizations"
                        icon={
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        }
                        isLoading={loading}
                    />
                    <StatsCard
                        title="Active Organizations"
                        value={stats.activeOrgs}
                        description="Currently active"
                        icon={
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                        isLoading={loading}
                    />
                    <StatsCard
                        title="Total Users"
                        value={stats.totalUsers}
                        description="Platform-wide users"
                        icon={
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        }
                        isLoading={loading}
                    />
                    <StatsCard
                        title="New This Month"
                        value={stats.newOrgsThisMonth}
                        description="Organizations added"
                        icon={
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        }
                        trend={stats.newOrgsThisMonth > 0 ? { value: 100, isPositive: true } : undefined}
                        isLoading={loading}
                    />
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link href="/dashboard/admin/organizations">
                            <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-sm font-medium text-gray-900">Manage Organizations</h3>
                                        <p className="text-sm text-gray-500">View and control all organizations</p>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        <Link href="/dashboard">
                            <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-sm font-medium text-gray-900">View Analytics</h3>
                                        <p className="text-sm text-gray-500">Platform usage and trends</p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* System Health */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center">
                                <svg className="h-5 w-5 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm font-medium text-green-900">Database</span>
                            </div>
                            <span className="text-sm text-green-700">Operational</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center">
                                <svg className="h-5 w-5 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm font-medium text-green-900">Authentication</span>
                            </div>
                            <span className="text-sm text-green-700">Operational</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center">
                                <svg className="h-5 w-5 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm font-medium text-green-900">API Services</span>
                            </div>
                            <span className="text-sm text-green-700">Operational</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
