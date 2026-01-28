'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UserInvitationFormProps {
    onSuccess?: () => void;
}

export function UserInvitationForm({ onSuccess }: UserInvitationFormProps) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('technician');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);

        try {
            const res = await fetch('/api/org/users/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to invite user');
            }

            toast.success(`Invitation sent to ${email}`);
            setEmail('');
            if (onSuccess) onSuccess();

        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-lg bg-card text-card-foreground">
            <h3 className="font-semibold text-lg">Invite New User</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="colleague@example.com"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={role} onValueChange={setRole}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="technician">Technician</SelectItem>
                            <SelectItem value="org_admin">Org Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Invitation
                </Button>
            </div>
        </form>
    );
}
