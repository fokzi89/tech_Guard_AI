'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { FileText, Trash2, Loader2 } from 'lucide-react';
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
            const res = await fetch('/api/manuals', {
                credentials: 'include'
            });
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
        <Card>
            <CardContent className="p-4">
                <div className="space-y-2">
                    {manuals.map(manual => (
                        <div
                            key={manual.id}
                            className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            {/* PDF Icon */}
                            <div className="flex-shrink-0 p-2 bg-red-500/10 rounded">
                                <FileText className="h-5 w-5 text-red-500" />
                            </div>

                            {/* Title and Size */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                    {manual.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {manual.machine_model}
                                </p>
                            </div>

                            {/* Delete Icon */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="flex-shrink-0 text-destructive hover:bg-destructive/10 h-8 w-8"
                                onClick={() => handleDelete(manual.id, manual.title)}
                                title="Delete manual"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
