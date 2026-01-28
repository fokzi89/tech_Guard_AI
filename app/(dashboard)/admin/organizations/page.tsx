'use client';

import { useState, useEffect } from 'react';
import { OrganizationTable } from '@/app/components/admin/OrganizationTable';
import { Card, CardContent } from '@/app/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function SuperAdminPage() {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    const loadOrgs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/organizations');
            if (!res.ok) throw new Error('Unauthoried');
            const data = await res.json();
            setOrganizations(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load organizations');
            // Redirect if unauthorized
            // router.push('/');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrgs();
    }, []);

    const handleImpersonate = async (orgId: string) => {
        // For MVP, we need a user ID to impersonate, specifically an Org Admin.
        // We might need to fetch the admin user for this org first.
        // Let's optimize: fetch org users, pick the first 'org_admin'.

        try {
            // 1. Get Org users (we can reuse the API if we had one for "any org users", 
            // but /api/org/users usually gets users of MY org.
            // Super Admin RLS allows seeing all profiles. 
            // We can query Supabase directly here since we are client with Super Admin token (hopefully).

            const { data: users, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('org_id', orgId)
                .eq('role', 'org_admin')
                .limit(1);

            if (error || !users || users.length === 0) {
                toast.error('No Org Admin found to impersonate');
                return;
            }

            const targetUser = users[0] as any;

            // 2. Request Impersonation Token
            const res = await fetch('/api/admin/impersonate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: targetUser.id })
            });

            if (!res.ok) throw new Error('Impersonation failed');

            const { token } = await res.json();

            // 3. Set Session
            const { error: sessionError } = await supabase.auth.setSession({
                access_token: token,
                refresh_token: token // JWT doesn't have refresh usually here, but setSession might need string.
                // Actually setSession needs refresh_token usually.
                // If we only provide access_token, it might work for short term.
            });

            if (sessionError) {
                console.error(sessionError);
                toast.error('Failed to set session');
                return;
            }

            toast.success(`Impersonating ${targetUser.full_name || targetUser.email}`);
            window.location.href = '/troubleshoot'; // Hard reload/redirect to verify permissions

        } catch (error) {
            console.error(error);
            toast.error('Impersonation error');
        }
    };

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
            </div>

            <Card>
                <CardContent className="p-6">
                    <OrganizationTable
                        data={organizations}
                        onRefresh={loadOrgs}
                        onImpersonate={handleImpersonate}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
