'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function ImpersonationBanner() {
    const [impersonating, setImpersonating] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const checkImpersonation = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.user_metadata?.impersonated_by) {
                setImpersonating(true);
            }
        };
        checkImpersonation();
    }, [supabase]);

    const stopImpersonating = async () => {
        // To stop, we need to sign out (clearing the impersonation token)
        // And ideally restore the admin session.
        // For MVP, signing out redirects to login, where admin logs in again.
        // Or if we stored admin token in `admin_restore_token`, we swap back.
        // T124: We didn't implement complex cookie swap.
        // So we just sign out.
        await supabase.auth.signOut();
        router.push('/login'); // Should redirect to login
    };

    if (!impersonating) return null;

    return (
        <div className="bg-amber-600 text-white px-4 py-2 flex items-center justify-between text-sm shadow-md z-50 sticky top-0">
            <div className="flex items-center space-x-2">
                <EyeOff className="h-4 w-4" />
                <span className="font-semibold">Impersonation Active</span>
                <span className="hidden sm:inline">- You are viewing as a user.</span>
            </div>
            <Button
                variant="secondary"
                size="sm"
                onClick={stopImpersonating}
                className="h-7 text-xs bg-white text-amber-700 hover:bg-amber-50 border-0"
                aria-label="Stop Impersonation"
            >
                Stop Impersonating
            </Button>
        </div>
    );
}
