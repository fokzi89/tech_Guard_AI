'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StatsCard } from '@/app/components/dashboard/StatsCard'
import Link from 'next/link'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { MoreVertical, Shield, Power, PowerOff, Loader2, Building } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { Button } from "@/app/components/ui/button"

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
    const router = useRouter()

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
            // @ts-ignore - TypeScript inference issue with Supabase types
            .update({ status: newStatus })
            .eq('id', orgId)

        if (!error) {
            loadOrganizations()
        }
    }

    const [impersonatingOrgId, setImpersonatingOrgId] = useState<string | null>(null)

    const handleImpersonate = async (orgId: string) => {
        setImpersonatingOrgId(orgId)
        const supabase = createClient()
        try {
            console.log('Starting impersonation for org:', orgId)

            // 1. Get Org Admin
            const { data: users, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('org_id', orgId)
                .eq('role', 'org_admin')
                .limit(1)

            if (error) {
                console.error('Error fetching org admin:', error)
                toast.error('Failed to find organization admin: ' + error.message)
                return
            }

            if (!users || users.length === 0) {
                console.warn('No org admin found for org:', orgId)
                toast.error('No Org Admin found in this organization to impersonate.')
                return
            }

            const targetUser = users[0] as any
            console.log('Found target user:', targetUser.id)

            // 2. Request Impersonation Token
            const res = await fetch('/api/admin/impersonate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: targetUser.id })
            })

            console.log('Impersonate API response status:', res.status)

            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}))
                throw new Error(errBody.error || 'Impersonation request failed')
            }

            const { token } = await res.json()
            console.log('Received impersonation token')

            // 3. Set Session
            const { error: sessionError } = await supabase.auth.setSession({
                access_token: token,
                refresh_token: token
            })

            if (sessionError) {
                console.error('Session error:', sessionError)
                toast.error('Failed to establish session: ' + sessionError.message)
                return
            }

            toast.success(`Impersonating ${targetUser.full_name || 'Admin'}`)

            // Force reload to dashboard
            window.location.href = '/dashboard'

        } catch (error: any) {
            console.error('Impersonation critical error:', error)
            toast.error(error.message || 'An unexpected error occurred during impersonation')
        } finally {
            setImpersonatingOrgId(null)
        }
    }

    const filteredOrgs = organizations.filter(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-muted rounded w-1/4"></div>
                        <div className="h-64 bg-muted rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-8">
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
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden overflow-x-auto border dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Organization
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Tier
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredOrgs.map((org) => (
                                <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-semibold shadow-sm">
                                                {org.name.charAt(0)}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{org.name}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{org.id.slice(0, 8)}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${org.status === 'active'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                            }`}>
                                            {org.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 capitalize">
                                        {org.subscription_tier}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(org.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-2">
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className="hidden md:flex bg-blue-600 hover:bg-blue-700 text-white"
                                                onClick={() => handleImpersonate(org.id)}
                                                disabled={impersonatingOrgId === org.id}
                                            >
                                                {impersonatingOrgId === org.id ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Shield className="mr-2 h-4 w-4" />
                                                )}
                                                Impersonate
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreVertical className="h-4 w-4 dark:text-gray-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <Link href={`/dashboard/admin/organizations/${org.id}`}>
                                                        <DropdownMenuItem>
                                                            <Building className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                    </Link>
                                                    <DropdownMenuItem
                                                        onClick={() => handleImpersonate(org.id)}
                                                        disabled={impersonatingOrgId === org.id}
                                                        className="md:hidden"
                                                    >
                                                        <Shield className="mr-2 h-4 w-4" />
                                                        Impersonate Admin
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => toggleOrgStatus(org.id, org.status)}
                                                        className={org.status === 'active' ? 'text-red-600' : 'text-green-600'}
                                                    >
                                                        {org.status === 'active' ? (
                                                            <>
                                                                <PowerOff className="mr-2 h-4 w-4" />
                                                                Suspend Organization
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Power className="mr-2 h-4 w-4" />
                                                                Activate Organization
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
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
