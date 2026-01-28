'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { FileText, Trash2, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';

interface Manual {
    id: string; // ID of one chunk representing the manual
    title: string;
    machine_model: string;
    created_at: string;
    status: string;
    file_url?: string;
}

export function ManualsList({ refreshTrigger }: { refreshTrigger: number }) {
    const [manuals, setManuals] = useState<Manual[]>([]);
    const [loading, setLoading] = useState(true);

    const loadManuals = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/manuals');
            if (res.ok) {
                const data = await res.json();
                setManuals(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadManuals();
    }, [refreshTrigger]);

    const handleDelete = async (manualId: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"? This will be removed from search.`)) return;

        try {
            const res = await fetch(`/api/manuals/${manualId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Manual deleted');
                loadManuals();
            } else {
                toast.error('Failed to delete manual');
            }
        } catch (error) {
            toast.error('Error deleting manual');
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>;

    if (manuals.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground border-dashed border-2 rounded-lg">
                No manuals found. Upload one to get started.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {manuals.map(manual => (
                <Card key={manual.id} className="overflow-hidden">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-start space-x-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{manual.title}</h3>
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                    <span>{manual.machine_model}</span>
                                    <span>•</span>
                                    <span>{new Date(manual.created_at).toLocaleDateString()}</span>
                                    {manual.status !== 'active' && <Badge variant="secondary">{manual.status}</Badge>}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            {manual.file_url && (
                                <Button variant="ghost" size="icon" asChild>
                                    <a href={manual.file_url} target="_blank" rel="noopener noreferrer">
                                        <Download className="h-4 w-4" />
                                    </a>
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(manual.id, manual.title)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
