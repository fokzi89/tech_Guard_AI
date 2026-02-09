// @vitest-environment node
import { describe, it, expect } from 'vitest';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';

describe('Storage Debug', () => {
    it('should list files and sign url', async () => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        console.log('Supabase URL:', supabaseUrl);
        console.log('Supabase Key exists:', !!supabaseServiceRoleKey);

        if (!supabaseUrl || !supabaseServiceRoleKey) {
            console.error('Missing env vars');
            return;
        }

        const supabase = createAdminClient();

        // Check buckets
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        console.log('Buckets:', buckets?.map(b => b.name));
        if (bucketError) console.error('Bucket Error:', bucketError);

        // List files in manuals bucket
        const { data: files, error: listError } = await supabase
            .storage
            .from('manuals')
            .list('2cd16710-a536-4c1a-8b07-a90525bd826c', { limit: 10 });

        console.log('Files in org folder:', files);
        if (listError) console.error('List Error:', listError);

        if (files && files.length > 0) {
            const firstFile = files[0];
            const fullPath = `2cd16710-a536-4c1a-8b07-a90525bd826c/${firstFile.name}`;
            console.log('Trying to sign:', fullPath);
            const { data, error } = await supabase
                .storage
                .from('manuals')
                .createSignedUrl(fullPath, 60);

            console.log('Signed URL Data:', data);
            console.log('Signed URL Error:', error);
        }
    });
});
