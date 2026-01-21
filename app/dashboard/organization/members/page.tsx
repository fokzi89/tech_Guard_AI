'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StatsCard } from '@/app/components/dashboard/StatsCard'
import { Button } from '@/app/components/shared/Button'
import Link from 'next/link'

interface Member {
    id: string
    full_name: string
    email: string
    role: string
    created_at: string
}

export default function OrganizationMembersPage() {
    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [orgName, setOrgName] = useState('')

    useEffect(() => {
        loadMembers()
    }, [])

    const loadMembers = async () => {
        const supabase = createClient()

        // Get current user's organization
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id, organizations(name)')
            .eq('id', user.id)
            .single()

        if (profile?.organizations) {
            setOrgName((profile.organizations as any).name)
        }

        // Get all members in the organization
        const { data: membersData } = await supabase
            .from('profiles')
            .select('id, full_name, email, role, created_at')
            .eq('org_id', profile?.org_id)
            .order('created_at', { ascending: false })

        if (membersData) {
            setMembers(membersData)
        }

        setLoading(false)
    }

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'super_admin':
                return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
            case 'org_admin':
                return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
            case 'technician':
                return 'bg-green-500/20 text-green-300 border-green-500/30'
            default:
                return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-white/20 rounded w-1/4"></div>
                        <div className="h-64 bg-white/10 rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Team Members</h1>
                        <p className="text-blue-200 mt-1">{orgName}</p>
                    </div>
                    <Link href="/dashboard/organization">
                        <Button variant="outline">Back to Organization</Button>
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatsCard
                        title="Total Members"
                        value={members.length}
                        icon={
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        }
                    />
                    <StatsCard
                        title="Administrators"
                        value={members.filter(m => m.role === 'org_admin').length}
                        icon={
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        }
                    />
                    <StatsCard
                        title="Technicians"
                        value={members.filter(m => m.role === 'technician').length}
                        icon={
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        }
                    />
                </div>

                {/* Members Table */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/20">
                        <h2 className="text-lg font-semibold text-white">All Members</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/10">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                                        Joined
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {members.map((member) => (
                                    <tr key={member.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                    {member.full_name?.charAt(0) || 'U'}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-white">{member.full_name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-blue-100">{member.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleBadgeColor(member.role)}`}>
                                                {member.role.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-200">
                                            {new Date(member.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
