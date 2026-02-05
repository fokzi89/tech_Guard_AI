'use client';

import { useState } from 'react';
import { ManualsList } from '@/app/components/admin/ManualsList';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Loader2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

export default function ManualsPage() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [uploading, setUploading] = useState(false);

    // Upload Form State
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [machineModel, setMachineModel] = useState('');

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title || !machineModel) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('machineModel', machineModel);

        try {
            const res = await fetch('/api/manuals/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Upload failed');
            }

            toast.success('Manual uploaded and processed successfully');
            setFile(null);
            setTitle('');
            setMachineModel('');
            // Reset file input
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            setRefreshTrigger(prev => prev + 1); // Refresh list
        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="container mx-auto py-8 space-y-8 px-8">
            <h1 className="text-3xl font-bold pl-4">Manual Management</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4">
                {/* Upload Form */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload New Manual</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpload} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Manual Title</Label>
                                    <Input
                                        placeholder="e.g. Service Manual V2"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        disabled={uploading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Machine Model</Label>
                                    <Input
                                        placeholder="e.g. Domino M230i"
                                        value={machineModel}
                                        onChange={e => setMachineModel(e.target.value)}
                                        disabled={uploading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>PDF File</Label>
                                    <Input
                                        type="file"
                                        accept=".pdf"
                                        onChange={e => setFile(e.target.files?.[0] || null)}
                                        disabled={uploading}
                                        className="cursor-pointer"
                                    />
                                    {file && (
                                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border/50">
                                            <div className="flex-shrink-0 p-2 bg-red-500/10 rounded">
                                                <svg
                                                    className="w-6 h-6 text-red-500"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                                    />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <Button type="submit" className="w-full" disabled={uploading || !file}>
                                    {uploading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <UploadCloud className="mr-2 h-4 w-4" />
                                            Upload & Process
                                        </>
                                    )}
                                </Button>
                                <p className="text-xs text-muted-foreground text-center">
                                    Processing includes extraction, chunking, and embedding generation. This may take a minute.
                                </p>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* List */}
                <div className="lg:col-span-2">
                    <ManualsList refreshTrigger={refreshTrigger} />
                </div>
            </div>
        </div>
    );
}
