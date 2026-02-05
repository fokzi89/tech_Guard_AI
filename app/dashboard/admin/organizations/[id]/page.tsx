'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Loader2, ArrowLeft, Shield, Power, PowerOff, Building, Users, Calendar } from 'lucide-react'
import { toast } from 'sonner'

export default function OrganizationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [org, setOrg] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [impersonating, setImpersonating] = useState(false)

    useEffect(() => {
        loadOrgDetails()
    }, [id])

    const loadOrgDetails = async () => {
        const supabase = createClient()

        // Fetch Org + Org Admin Profile
        const { data: orgData, error } = await supabase
            .from('organizations')
            .select(`
                *,
                profiles:profiles(id, full_name, email, role)
            `)
            .eq('id', id)
            .single()

        if (error || !orgData) {
            toast.error('Failed to load organization')
            router.push('/dashboard/admin/organizations')
            return
        }

        setOrg(orgData)
        setLoading(false)
    }

    const handleImpersonate = async () => {
        setImpersonating(true)
        const supabase = createClient()
        try {
            // Find Org Admin
            const orgAdmin = org.profiles.find((p: any) => p.role === 'org_admin')

            if (!orgAdmin) {
                toast.error('No Org Admin found to impersonate')
                return
            }

            const res = await fetch('/api/admin/impersonate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: orgAdmin.id })
            })

            if (!res.ok) throw new Error('Impersonation failed')
            const { token } = await res.json()

            const { error: sessionError } = await supabase.auth.setSession({
                access_token: token,
                refresh_token: token
            })

            if (sessionError) throw sessionError

            toast.success(`Impersonating ${orgAdmin.full_name}`)
            window.location.href = '/dashboard'

        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Impersonation failed')
        } finally {
            setImpersonating(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href="/dashboard/admin/organizations">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{org.name}</h1>
                            <div className="flex items-center space-x-2 mt-1">
                                <Badge variant={org.status === 'active' ? 'default' : 'destructive'}>
                                    {org.status}
                                </Badge>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    ID: {org.id}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="default"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={handleImpersonate}
                            disabled={impersonating}
                        >
                            {impersonating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                            Impersonate Admin
                        </Button>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <Card className="md:col-span-2 dark:bg-gray-800 dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Building className="mr-2 h-5 w-5" />
                                Organization Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Subscription Tier</p>
                                    <p className="text-lg font-semibold dark:text-white capitalize">{org.subscription_tier}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</p>
                                    <p className="text-lg font-semibold dark:text-white">
                                        {new Date(org.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                                    <p className="text-lg font-semibold dark:text-white">{org.profiles?.length || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Users List (Simplified) */}
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Users className="mr-2 h-5 w-5" />
                                Key Users
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {org.profiles?.slice(0, 5).map((profile: any) => (
                                    <div key={profile.id} className="flex items-center justify-between p-2 rounded bg-gray-100 dark:bg-gray-700">
                                        <div>
                                            <p className="font-medium text-sm dark:text-white">{profile.full_name || 'Unnamed'}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{profile.role}</p>
                                        </div>
                                    </div>
                                ))}
                                {(!org.profiles || org.profiles.length === 0) && (
                                    <p className="text-sm text-muted-foreground">No users found.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    )
}
