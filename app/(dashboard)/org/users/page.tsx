'use client';

import { useEffect, useState } from 'react';
import { UserInvitationForm } from '@/app/components/admin/UserInvitationForm';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    role: string;
    created_at: string;
    last_sign_in_at?: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/org/users');
            if (!res.ok) throw new Error('Failed to load users');
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error(error);
            toast.error('Could not load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">User Management</h1>

            <div className="mb-8">
                <UserInvitationForm onSuccess={loadUsers} />
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Organization Members</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => loadUsers()} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Full Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.full_name || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'org_admin' ? 'default' : 'secondary'}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">Active</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loading && users.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                        No users found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
