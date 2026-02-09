
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = createAdminClient();

        // List files in manuals bucket
        const { data: listData, error: listError } = await supabase
            .storage
            .from('manuals')
            .list('', { limit: 10, sortBy: { column: 'created_at', order: 'desc' } });

        if (listError) {
            return NextResponse.json({ error: 'List Error', details: listError }, { status: 500 });
        }

        // Try to sign URL for the first file found (if any)
        let signedUrlResult = null;
        if (listData && listData.length > 0) {
            const firstFile = listData[0];
            // listData returns items in the root. 
            // If files are in folders (ORG_ID/...), list('') might return folders?
            // Supabase storage list returns objects and folders.

            // Let's try to sign it anyway
            const { data: signedData, error: signError } = await supabase
                .storage
                .from('manuals')
                .createSignedUrl(firstFile.name, 60);

            signedUrlResult = { data: signedData, error: signError, file: firstFile.name };
        }

        return NextResponse.json({
            files: listData,
            signedUrlResult
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
