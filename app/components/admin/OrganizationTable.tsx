'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Loader2, Users, Power, PowerOff, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface Organization {
    id: string;
    name: string;
    status: 'active' | 'suspended';
    subscription_tier: string;
    created_at: string;
    profiles?: { count: number }[]; // From query
}

interface OrganizationTableProps {
    data: Organization[];
    onRefresh: () => void;
    onImpersonate: (orgId: string) => void;
}

export function OrganizationTable({ data, onRefresh, onImpersonate }: OrganizationTableProps) {
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const toggleStatus = async (orgId: string, currentStatus: string) => {
        if (!confirm(`Are you sure you want to ${currentStatus === 'active' ? 'SUSPEND' : 'ACTIVATE'} this organization?`)) return;

        setActionLoading(orgId);
        try {
            const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
            const res = await fetch(`/api/admin/organizations/${orgId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) throw new Error('Update failed');

            toast.success(`Organization ${newStatus}`);
            onRefresh();
        } catch (error) {
            toast.error('Failed to update status');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Users</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map(org => (
                        <TableRow key={org.id}>
                            <TableCell className="font-medium">{org.name}</TableCell>
                            <TableCell>
                                <Badge variant={org.status === 'active' ? 'default' : 'destructive'}>
                                    {org.status}
                                </Badge>
                            </TableCell>
                            <TableCell>{org.subscription_tier}</TableCell>
                            <TableCell>{org.profiles?.[0]?.count ?? 'N/A'}</TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleStatus(org.id, org.status)}
                                    disabled={actionLoading === org.id}
                                >
                                    {actionLoading === org.id ? <Loader2 className="h-4 w-4 animate-spin" /> :
                                        org.status === 'active' ? <PowerOff className="h-4 w-4 text-destructive" /> :
                                            <Power className="h-4 w-4 text-green-500" />
                                    }
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => onImpersonate(org.id)}
                                    title="Impersonate Org Admin"
                                >
                                    <Shield className="h-4 w-4 mr-2" />
                                    Impersonate
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {data.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No organizations found</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
