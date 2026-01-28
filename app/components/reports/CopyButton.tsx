'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CopyButtonProps {
    text: string;
    label?: string;
    className?: string;
}

export function CopyButton({ text, label, className }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success('Copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error('Failed to copy');
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className={className}
            title="Copy to Clipboard"
        >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            {label && <span className="ml-2">{label}</span>}
        </Button>
    );
}
