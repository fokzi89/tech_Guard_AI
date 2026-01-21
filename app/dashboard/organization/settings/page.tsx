'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/app/components/shared/Button'
import { Input } from '@/app/components/shared/Input'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Organization {
    id: string
    name: string
    status: string
    subscription_tier: string
}

export default function OrganizationSettingsPage() {
    const router = useRouter()
    const [organization, setOrganization] = useState<Organization | null>(null)
    const [formData, setFormData] = useState({
        name: '',
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    useEffect(() => {
        loadOrganization()
    }, [])

    const loadOrganization = async () => {
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', user.id)
            .single()

        if (profile?.org_id) {
            const { data: orgData } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', profile.org_id)
                .single()

            if (orgData) {
                setOrganization(orgData)
                setFormData({ name: orgData.name })
            }
        }

        setLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage({ type: '', text: '' })

        const supabase = createClient()

        const { error } = await supabase
            .from('organizations')
            .update({ name: formData.name })
            .eq('id', organization?.id)

        if (error) {
            setMessage({ type: 'error', text: 'Failed to update organization' })
        } else {
            setMessage({ type: 'success', text: 'Organization updated successfully!' })
            loadOrganization()
        }

        setSaving(false)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
                <div className="max-w-3xl mx-auto">
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
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Organization Settings</h1>
                        <p className="text-blue-200 mt-1">Manage your organization details</p>
                    </div>
                    <Link href="/dashboard/organization">
                        <Button variant="outline">Back</Button>
                    </Link>
                </div>

                {/* Settings Form */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20">
                    <div className="px-6 py-4 border-b border-white/20">
                        <h2 className="text-lg font-semibold text-white">General Information</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <Input
                            label="Organization Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            helperText="This is how your organization will appear to members"
                        />

                        <div>
                            <label className="block text-sm font-medium text-blue-200 mb-1">
                                Subscription Tier
                            </label>
                            <div className="px-4 py-3 bg-white/5 rounded-lg border border-white/20">
                                <p className="text-sm text-white capitalize font-medium">
                                    {organization?.subscription_tier}
                                </p>
                                <p className="text-xs text-blue-200 mt-1">
                                    Contact support to change your subscription tier
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-blue-200 mb-1">
                                Organization Status
                            </label>
                            <div className="px-4 py-3 bg-white/5 rounded-lg border border-white/20">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${organization?.status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}>
                                    {organization?.status}
                                </span>
                            </div>
                        </div>

                        {message.text && (
                            <div className={`p-4 rounded-lg ${message.type === 'success'
                                ? 'bg-green-50 text-green-800 border border-green-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                                }`}>
                                {message.text}
                            </div>
                        )}

                        <div className="flex justify-end space-x-3">
                            <Link href="/dashboard/organization">
                                <Button type="button" variant="outline">Cancel</Button>
                            </Link>
                            <Button type="submit" isLoading={saving}>
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Danger Zone */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg border-2 border-red-500/50">
                    <div className="px-6 py-4 bg-red-500/20 border-b border-red-500/50">
                        <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
                    </div>
                    <div className="p-6">
                        <p className="text-sm text-blue-200 mb-4">
                            Once you delete your organization, there is no going back. Please be certain.
                        </p>
                        <Button variant="destructive" disabled>
                            Delete Organization
                        </Button>
                        <p className="text-xs text-blue-200 mt-2">
                            Contact support to delete your organization
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
