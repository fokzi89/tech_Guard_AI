'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/shared/Input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Switch } from '@/app/components/ui/switch'
import { ConfirmationDialog } from '@/app/components/ui/confirmation-dialog'
import { Building, Users, Bell, AlertTriangle, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { UserPreferences } from '@/types/settings'

interface Organization {
    id: string
    name: string
    status: string
    subscription_tier: string
}

interface Profile {
    id: string
    full_name: string
    email: string
    role: string
}

export default function OrganizationSettingsPage() {
    const router = useRouter()
    const [organization, setOrganization] = useState<Organization | null>(null)
    const [preferences, setPreferences] = useState<UserPreferences | null>(null)
    const [teamMembers, setTeamMembers] = useState<Profile[]>([])
    const [formData, setFormData] = useState({
        name: '',
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [deleteForm, setDeleteForm] = useState({
        password: '',
        confirmationText: '',
    })

    useEffect(() => {
        loadOrganization()
        loadPreferences()
        loadTeamMembers()
    }, [])

    const loadOrganization = async () => {
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/auth/login')
            return
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id, role')
            .eq('id', user.id)
            .single()

        const profileData = profile as any;

        if (!profileData?.org_id || (profileData.role !== 'org_admin' && profileData.role !== 'super_admin')) {
            router.push('/dashboard')
            return
        }

        if (profileData?.org_id) {
            const { data: orgData } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', profileData.org_id)
                .single()

            const organization = orgData as any;

            if (organization) {
                setOrganization(organization)
                setFormData({ name: organization.name })
            }
        }

        setLoading(false)
    }

    const loadPreferences = async () => {
        try {
            const response = await fetch('/api/user/preferences', {
                credentials: 'include'
            })
            if (response.ok) {
                const data = await response.json()
                setPreferences(data.preferences)
            }
        } catch (error) {
            console.error('Error loading preferences:', error)
        }
    }

    const loadTeamMembers = async () => {
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', user.id)
            .single()

        const profileData2 = profile as any;

        if (profileData2?.org_id) {
            const { data: members } = await supabase
                .from('profiles')
                .select('id, full_name, role, created_at')
                .eq('org_id', profileData2.org_id)
                .order('created_at', { ascending: false })

            if (members) {
                // Add email from auth.users
                const membersWithEmail = await Promise.all(
                    members.map(async (member: any) => {
                        const { data: authUser } = await supabase.auth.admin.getUserById(member.id)
                        return {
                            ...member,
                            email: authUser.user?.email || 'N/A'
                        }
                    })
                )
                setTeamMembers(membersWithEmail as Profile[])
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const response = await fetch('/api/org/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name: formData.name }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to update organization')
            }

            toast.success('Organization updated successfully!')
            loadOrganization()
        } catch (error: any) {
            toast.error(error.message || 'Failed to update organization')
        } finally {
            setSaving(false)
        }
    }

    const handlePreferenceChange = async (key: keyof UserPreferences, value: boolean) => {
        try {
            const response = await fetch('/api/user/preferences', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ [key]: value }),
            })

            if (!response.ok) {
                throw new Error('Failed to update preference')
            }

            const data = await response.json()
            setPreferences(data.preferences)
            toast.success('Preference updated')
        } catch (error) {
            toast.error('Failed to update preference')
            console.error(error)
            loadPreferences()
        }
    }

    const handleDeleteOrganization = async () => {
        setDeleteLoading(true)

        try {
            // Check for active team members first
            if (teamMembers.length > 1) {
                toast.error('Cannot delete organization with active members. Remove all members first.')
                setDeleteLoading(false)
                return
            }

            toast.error('Organization deletion is not yet implemented. Contact support.')
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete organization')
        } finally {
            setDeleteLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-muted rounded w-1/4"></div>
                        <div className="h-64 bg-muted rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-nav text-nav-foreground">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/dashboard')}
                            className="text-nav-foreground hover:bg-nav-hover"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold">Organization Settings</h1>
                            <p className="text-sm opacity-80">Manage your organization details</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <Tabs defaultValue="general" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="general" className="flex items-center space-x-2">
                            <Building className="h-4 w-4" />
                            <span>General</span>
                        </TabsTrigger>
                        <TabsTrigger value="team" className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>Team</span>
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="flex items-center space-x-2">
                            <Bell className="h-4 w-4" />
                            <span>Notifications</span>
                        </TabsTrigger>
                        <TabsTrigger value="danger" className="flex items-center space-x-2">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Danger Zone</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* General Tab */}
                    <TabsContent value="general" className="space-y-6">
                        <div className="gradient-card p-6">
                            <h2 className="text-lg font-semibold mb-4">General Information</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <Input
                                    label="Organization Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    helperText="This is how your organization will appear to members"
                                />

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Subscription Tier
                                    </label>
                                    <div className="px-4 py-3 bg-muted rounded-lg border border-border">
                                        <p className="text-sm font-medium capitalize">
                                            {organization?.subscription_tier}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Contact support to change your subscription tier
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Organization Status
                                    </label>
                                    <div className="px-4 py-3 bg-muted rounded-lg border border-border">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${organization?.status === 'active'
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                            }`}>
                                            {organization?.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.push('/dashboard')}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={saving}>
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </TabsContent>

                    {/* Team Tab */}
                    <TabsContent value="team" className="space-y-6">
                        <div className="gradient-card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold">Team Members</h2>
                                <Button
                                    size="sm"
                                    onClick={() => router.push('/dashboard/organization/members')}
                                >
                                    Manage Team
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {teamMembers.length > 0 ? (
                                    teamMembers.map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border"
                                        >
                                            <div>
                                                <p className="text-sm font-medium">{member.full_name}</p>
                                                <p className="text-xs text-muted-foreground">{member.email}</p>
                                            </div>
                                            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded capitalize">
                                                {member.role.replace('_', ' ')}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        No team members found
                                    </p>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Notifications Tab */}
                    <TabsContent value="notifications" className="space-y-6">
                        <div className="gradient-card p-6">
                            <h2 className="text-lg font-semibold mb-4">Admin Notifications</h2>
                            {preferences ? (
                                <div className="space-y-2">
                                    <Switch
                                        label="New User Alerts"
                                        description="Notify when new users join your organization"
                                        checked={preferences.admin_new_user_alerts}
                                        onCheckedChange={(checked) => handlePreferenceChange('admin_new_user_alerts', checked)}
                                    />
                                    <Switch
                                        label="Safety Incident Alerts"
                                        description="Alert on critical safety incidents in your organization"
                                        checked={preferences.admin_safety_incident_alerts}
                                        onCheckedChange={(checked) => handlePreferenceChange('admin_safety_incident_alerts', checked)}
                                    />
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Loading preferences...</p>
                            )}
                        </div>

                        <div className="gradient-card p-6">
                            <h2 className="text-lg font-semibold mb-4">Email Notifications</h2>
                            {preferences ? (
                                <div className="space-y-2">
                                    <Switch
                                        label="Email Notifications"
                                        description="Receive email updates about organization events"
                                        checked={preferences.email_notifications}
                                        onCheckedChange={(checked) => handlePreferenceChange('email_notifications', checked)}
                                    />
                                    <Switch
                                        label="Safety Alerts"
                                        description="Get notified about safety warnings via email"
                                        checked={preferences.email_safety_alerts}
                                        onCheckedChange={(checked) => handlePreferenceChange('email_safety_alerts', checked)}
                                    />
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Loading preferences...</p>
                            )}
                        </div>
                    </TabsContent>

                    {/* Danger Zone Tab */}
                    <TabsContent value="danger" className="space-y-6">
                        <div className="gradient-card p-6 border-2 border-destructive/50">
                            <h2 className="text-lg font-semibold text-destructive mb-4">Danger Zone</h2>
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Once you delete your organization, there is no going back. All data will be permanently removed.
                                </p>
                                {teamMembers.length > 1 && (
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                            Cannot Delete Organization
                                        </p>
                                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                            You have {teamMembers.length} team members. Remove all members before deleting the organization.
                                        </p>
                                    </div>
                                )}
                                <Button
                                    variant="destructive"
                                    disabled
                                    onClick={() => setShowDeleteDialog(true)}
                                >
                                    Delete Organization
                                </Button>
                                <p className="text-xs text-muted-foreground">
                                    Contact support to delete your organization
                                </p>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Delete Organization Confirmation Dialog */}
            <ConfirmationDialog
                open={showDeleteDialog}
                onClose={() => {
                    setShowDeleteDialog(false)
                    setDeleteForm({ password: '', confirmationText: '' })
                }}
                onConfirm={handleDeleteOrganization}
                title="Delete Organization"
                description="This action cannot be undone. All data associated with this organization will be permanently deleted."
                confirmText="Delete Organization"
                confirmButtonVariant="destructive"
                requireTextConfirmation={true}
                confirmationText="DELETE ORGANIZATION"
                isLoading={deleteLoading}
            >
                <div className="space-y-4">
                    <Input
                        label="Password"
                        type="password"
                        value={deleteForm.password}
                        onChange={(e) => setDeleteForm({ ...deleteForm, password: e.target.value })}
                        placeholder="Enter your password"
                        required
                    />
                </div>
            </ConfirmationDialog>
        </div>
    )
}
