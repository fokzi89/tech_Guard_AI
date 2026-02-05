'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/shared/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Switch } from '@/app/components/ui/switch';
import { ConfirmationDialog } from '@/app/components/ui/confirmation-dialog';
import { User, Lock, Bell, Palette, Info, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { UserPreferences } from '@/types/settings';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  org_id: string | null;
  created_at: string;
  deleted_at?: string | null;
  delete_requested_at?: string | null;
}

interface Organization {
  id: string;
  name: string;
  status: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    full_name: '',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Delete account form
  const [deleteForm, setDeleteForm] = useState({
    password: '',
    confirmationText: '',
  });

  useEffect(() => {
    loadUserData();
    loadPreferences();
  }, []);

  const loadUserData = async () => {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Get profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const profile = profileData as any;

    if (profile) {
      setProfile({ ...profile, email: user.email || '' });
      setProfileForm({ full_name: profile.full_name });

      // Get organization if user has one
      if (profile.org_id) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profile.org_id)
          .single();

        const organization = orgData as any;

        if (organization) {
          setOrganization(organization);
        }
      }
    }

    setLoading(false);
  };

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: profileForm.full_name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      toast.success('Profile updated successfully');
      loadUserData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update password');
      }

      toast.success('Password updated successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceChange = async (key: keyof UserPreferences, value: boolean) => {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });

      if (!response.ok) {
        throw new Error('Failed to update preference');
      }

      const data = await response.json();
      setPreferences(data.preferences);
      toast.success('Preference updated');
    } catch (error) {
      toast.error('Failed to update preference');
      console.error(error);
      // Reload preferences to revert UI
      loadPreferences();
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);

    try {
      const response = await fetch('/api/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: deleteForm.password,
          confirmationText: deleteForm.confirmationText,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to request account deletion');
      }

      const data = await response.json();
      toast.success(data.message || 'Account deletion scheduled');
      setShowDeleteDialog(false);
      loadUserData(); // Reload to show deletion status
    } catch (error: any) {
      toast.error(error.message || 'Failed to request account deletion');
      console.error(error);
    } finally {
      setDeleteLoading(false);
    }
  };

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
    );
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
              <h1 className="text-xl font-bold">Settings</h1>
              <p className="text-sm opacity-80">Manage your account preferences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Lock className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center space-x-2">
              <Info className="h-4 w-4" />
              <span>Account</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="gradient-card p-6">
              <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <Input
                  label="Full Name"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  required
                />

                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <Input
                    value={profile?.email || ''}
                    disabled
                    helperText="Email cannot be changed. Contact support if needed."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Role</label>
                  <div className="px-4 py-3 bg-muted rounded-lg border border-border">
                    <p className="text-sm font-medium capitalize">{profile?.role?.replace('_', ' ')}</p>
                  </div>
                </div>

                {organization && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Organization</label>
                    <div className="px-4 py-3 bg-muted rounded-lg border border-border">
                      <p className="text-sm font-medium">{organization.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Status: <span className="capitalize">{organization.status}</span>
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="gradient-card p-6">
              <h2 className="text-lg font-semibold mb-4">Change Password</h2>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <Input
                  label="New Password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                  helperText="Must be at least 8 characters"
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                />

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </div>

            <div className="gradient-card p-6">
              <h2 className="text-lg font-semibold mb-4">Active Sessions</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Manage your active sessions across devices.
              </p>
              <div className="bg-muted rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Current Session</p>
                    <p className="text-xs text-muted-foreground mt-1">This device</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const supabase = createClient();
                      await supabase.auth.signOut();
                      router.push('/auth/login');
                    }}
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="gradient-card p-6">
              <h2 className="text-lg font-semibold mb-4">Email Notifications</h2>
              {preferences ? (
                <div className="space-y-2">
                  <Switch
                    label="Email Notifications"
                    description="Receive email updates about your sessions"
                    checked={preferences.email_notifications}
                    onCheckedChange={(checked) => handlePreferenceChange('email_notifications', checked)}
                  />
                  <Switch
                    label="Safety Alerts"
                    description="Get notified about safety warnings via email"
                    checked={preferences.email_safety_alerts}
                    onCheckedChange={(checked) => handlePreferenceChange('email_safety_alerts', checked)}
                  />
                  <Switch
                    label="Report Ready"
                    description="Notify when reports are ready"
                    checked={preferences.email_report_ready}
                    onCheckedChange={(checked) => handlePreferenceChange('email_report_ready', checked)}
                  />
                  <Switch
                    label="Session Summary"
                    description="Receive session summary emails"
                    checked={preferences.email_session_summary}
                    onCheckedChange={(checked) => handlePreferenceChange('email_session_summary', checked)}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Loading preferences...</p>
              )}
            </div>

            <div className="gradient-card p-6">
              <h2 className="text-lg font-semibold mb-4">In-App Notifications</h2>
              {preferences ? (
                <div className="space-y-2">
                  <Switch
                    label="In-App Notifications"
                    description="Show notifications within the app"
                    checked={preferences.in_app_notifications}
                    onCheckedChange={(checked) => handlePreferenceChange('in_app_notifications', checked)}
                  />
                  <Switch
                    label="Safety Alerts"
                    description="Show safety warnings in the app"
                    checked={preferences.in_app_safety_alerts}
                    onCheckedChange={(checked) => handlePreferenceChange('in_app_safety_alerts', checked)}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Loading preferences...</p>
              )}
            </div>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <div className="gradient-card p-6">
              <h2 className="text-lg font-semibold mb-4">Account Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">User ID</label>
                    <p className="text-sm font-mono">{profile?.id.slice(0, 8)}...</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Account Created</label>
                    <p className="text-sm">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>

                {organization && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Organization ID</label>
                      <p className="text-sm font-mono">{organization.id.slice(0, 8)}...</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Subscription Tier</label>
                      <p className="text-sm capitalize">Basic</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="gradient-card p-6 border-2 border-destructive/50">
              <h2 className="text-lg font-semibold text-destructive mb-4">Danger Zone</h2>
              {profile?.delete_requested_at ? (
                <div className="space-y-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Account Deletion Scheduled
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      Your account will be deleted on{' '}
                      {profile.deleted_at ? new Date(profile.deleted_at).toLocaleDateString() : 'unknown date'}.
                      You have {profile.deleted_at ? Math.ceil((new Date(profile.deleted_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0} days to cancel.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/user/delete', { method: 'DELETE' });
                        if (response.ok) {
                          toast.success('Account deletion canceled');
                          loadUserData();
                        } else {
                          toast.error('Failed to cancel deletion');
                        }
                      } catch (error) {
                        toast.error('Failed to cancel deletion');
                      }
                    }}
                  >
                    Cancel Deletion
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Once you delete your account, there is no going back. Your account will be scheduled for deletion with a 30-day grace period.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    Delete Account
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeleteForm({ password: '', confirmationText: '' });
        }}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        description="This action will schedule your account for deletion in 30 days. You can cancel the deletion during this period."
        confirmText="Delete My Account"
        confirmButtonVariant="destructive"
        requireTextConfirmation={true}
        confirmationText="DELETE MY ACCOUNT"
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
  );
}
