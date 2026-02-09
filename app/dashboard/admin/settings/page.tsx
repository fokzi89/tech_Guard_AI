'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/shared/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Switch } from '@/app/components/ui/switch';
import { User, Building, Bell, Shield, Info, ArrowLeft, RefreshCw } from 'lucide-react';
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
}

interface Organization {
  id: string;
  name: string;
  status: string;
  subscription_tier: string;
  created_at: string;
}

export default function SuperAdminSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    full_name: '',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  // Platform stats
  const [stats, setStats] = useState({
    totalOrgs: 0,
    totalUsers: 0,
    totalSessions: 0,
    totalReports: 0,
  });

  useEffect(() => {
    loadUserData();
    loadPlatformStats();
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

    if (profileData) {
      const profile = profileData as any;
      setProfile({ ...profile, email: user.email || '' });
      setProfileForm({ full_name: profile.full_name });

      // Verify super admin role
      if (profile.role !== 'super_admin') {
        router.push('/dashboard');
        return;
      }
    }

    setLoading(false);
  };

  const loadPlatformStats = async () => {
    setStatsLoading(true);
    try {
      const supabase = createClient();

      const [orgs, users, sessions, reports] = await Promise.all([
        supabase.from('organizations').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('incidents').select('id', { count: 'exact', head: true }),
        supabase.from('service_reports').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        totalOrgs: orgs.count || 0,
        totalUsers: users.count || 0,
        totalSessions: sessions.count || 0,
        totalReports: reports.count || 0,
      });
    } catch (error) {
      console.error('Error loading platform stats:', error);
      toast.error('Failed to load platform statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handlePreferenceChange = async (key: keyof UserPreferences, value: boolean) => {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = createClient();
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ full_name: profileForm.full_name })
        .eq('id', profile?.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      loadUserData();
    } catch (error) {
      toast.error('Failed to update profile');
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

    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setPasswordForm({
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
              <h1 className="text-xl font-bold">Super Admin Settings</h1>
              <p className="text-sm opacity-80">Manage platform configuration</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="platform" className="flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span>Platform</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>Alerts</span>
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
                    helperText="Email cannot be changed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Role</label>
                  <div className="px-4 py-3 bg-muted rounded-lg border border-border">
                    <p className="text-sm font-medium flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-primary" />
                      Super Administrator
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Full platform access and management capabilities
                    </p>
                  </div>
                </div>

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

          {/* Platform Tab */}
          <TabsContent value="platform" className="space-y-6">
            <div className="gradient-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Platform Statistics</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadPlatformStats}
                  disabled={statsLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Total Organizations</p>
                  <p className="text-3xl font-bold">{statsLoading ? '...' : stats.totalOrgs}</p>
                </div>
                <div className="bg-muted rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                  <p className="text-3xl font-bold">{statsLoading ? '...' : stats.totalUsers}</p>
                </div>
                <div className="bg-muted rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Total Sessions</p>
                  <p className="text-3xl font-bold">{statsLoading ? '...' : stats.totalSessions}</p>
                </div>
                <div className="bg-muted rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Reports Generated</p>
                  <p className="text-3xl font-bold">{statsLoading ? '...' : stats.totalReports}</p>
                </div>
              </div>
            </div>

            <div className="gradient-card p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/dashboard/admin/organizations')}
                >
                  <Building className="h-4 w-4 mr-2" />
                  Manage Organizations
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => toast.info('Audit logs coming soon')}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  View Audit Logs
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="gradient-card p-6">
              <h2 className="text-lg font-semibold mb-4">Platform Alerts</h2>
              {preferences ? (
                <div className="space-y-2">
                  <Switch
                    label="New User Alerts"
                    description="Notify when new users join organizations"
                    checked={preferences.admin_new_user_alerts}
                    onCheckedChange={(checked) => handlePreferenceChange('admin_new_user_alerts', checked)}
                  />
                  <Switch
                    label="Safety Incident Alerts"
                    description="Alert on critical safety incidents across platform"
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
                    description="Receive email updates about platform events"
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Role Level</label>
                    <p className="text-sm">Super Administrator</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Access Level</label>
                    <p className="text-sm">Full Platform Access</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
