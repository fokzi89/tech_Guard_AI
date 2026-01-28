'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const MACHINE_MODELS = [
    'Domino M230i',
    'Domino A-Series',
    'Videojet 1580',
    'Markem-Imaje 9029',
    'Generic'
];

export default function NewSessionPage() {
    const router = useRouter();
    const [machineModel, setMachineModel] = useState('');
    const [ticketId, setTicketId] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!machineModel) {
            toast.error('Please select a machine model');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/chat/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    machineModel,
                    externalTicketId: ticketId
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to start session');
            }

            const session = await res.json();
            router.push(`/troubleshoot/${session.id}`);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto max-w-lg py-12">
            <Card>
                <CardHeader>
                    <CardTitle>Start Troubleshooting Session</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label>Machine Model</Label>
                            <Select value={machineModel} onValueChange={setMachineModel}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select machine model" />
                                </SelectTrigger>
                                <SelectContent>
                                    {MACHINE_MODELS.map(m => (
                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Work Order / Ticket ID (Optional)</Label>
                            <Input
                                placeholder="e.g. WO-12345"
                                value={ticketId}
                                onChange={(e) => setTicketId(e.target.value)}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Start Session
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
