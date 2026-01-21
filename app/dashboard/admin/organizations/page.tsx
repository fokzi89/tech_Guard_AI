'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StatsCard } from '@/app/components/dashboard/StatsCard'
import Link from 'next/link'

interface Organization {
    id: string
    name: string
    status: string
    subscription_tier: string
    created_at: string
}

export default function AdminOrganizationsPage() {
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        loadOrganizations()
    }, [])

    const loadOrganizations = async () => {
        const supabase = createClient()

        const { data } = await supabase
            .from('organizations')
            .select('*')
            .order('created_at', { ascending: false })

        if (data) {
            setOrganizations(data)
        }

        setLoading(false)
    }

    const toggleOrgStatus = async (orgId: string, currentStatus: string) => {
        const supabase = createClient()
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active'

        const { error } = await supabase
            .from('organizations')
            .update({ status: newStatus })
            .eq('id', orgId)

        if (!error) {
            loadOrganizations()
        }
    }

    const filteredOrgs = organizations.filter(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-64 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
                        <p className="text-gray-600 mt-1">Manage all platform organizations</p>
                    </div>
                    <Link href="/dashboard">
                        <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                            Back to Dashboard
                        </button>
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatsCard
                        title="Total Organizations"
                        value={organizations.length}
                        icon={
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        }
                    />
                    <StatsCard
                        title="Active"
                        value={organizations.filter(o => o.status === 'active').length}
                        icon={
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />
                    <StatsCard
                        title="Suspended"
                        value={organizations.filter(o => o.status === 'suspended').length}
                        icon={
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        }
                    />
                    <StatsCard
                        title="This Month"
                        value={organizations.filter(o => {
                            const created = new Date(o.created_at)
                            const now = new Date()
                            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
                        }).length}
                        icon={
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        }
                    />
                </div>

                {/* Search */}
                <div className="bg-white rounded-lg shadow p-4">
                    <input
                        type="text"
                        placeholder="Search organizations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Organizations Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Organization
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tier
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredOrgs.map((org) => (
                                <tr key={org.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-semibold">
                                                {org.name.charAt(0)}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{org.name}</div>
                                                <div className="text-sm text-gray-500">{org.id.slice(0, 8)}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${org.status === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                            {org.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                                        {org.subscription_tier}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(org.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => toggleOrgStatus(org.id, org.status)}
                                            className={`px-3 py-1 rounded-lg ${org.status === 'active'
                                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                }`}
                                        >
                                            {org.status === 'active' ? 'Suspend' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
