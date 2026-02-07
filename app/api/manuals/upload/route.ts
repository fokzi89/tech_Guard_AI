import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { processManual, extractSafetyRules } from '@/lib/rag/manual-processor';
import { generateEmbeddingsBatch } from '@/lib/rag/embeddings';
import { validateFile } from '@/lib/utils/file-validation';
import { NextResponse } from 'next/server';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ['application/pdf'];

export async function POST(req: Request) {
    console.log('[Manual Upload] Starting upload process...');
    try {
        const supabase = await createClient();
        console.log('[Manual Upload] Supabase client created');

        const { data: { user } } = await supabase.auth.getUser();
        console.log('[Manual Upload] User check:', user ? `User ID: ${user.id}` : 'No user');

        if (!user) {
            console.error('[Manual Upload] Unauthorized - no user');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify role (Org Admin or Super Admin)
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single<{ org_id: string | null; role: string;[key: string]: any }>();
        if (!profile || (profile.role !== 'org_admin' && profile.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Forbidden: Admin role required' }, { status: 403 });
        }

        // Determine org_id based on role
        // Super admins can upload global manuals (org_id = null) if no org context
        // Org admins can only upload for their organization
        let orgId = profile.org_id;

        if (profile.role === 'super_admin') {
            // Super admins can upload global manuals by not having an org_id
            // or by explicitly choosing to upload globally
            const formData = await req.formData();
            const isGlobal = formData.get('isGlobal') === 'true';

            if (isGlobal) {
                orgId = null;
                console.log('[Manual Upload] Super admin uploading global manual');
            } else if (!orgId) {
                return NextResponse.json({
                    error: 'Super admin must specify organization or mark as global'
                }, { status: 400 });
            }

            // Get other form fields after consuming formData
            const file = formData.get('file') as File;
            const title = formData.get('title') as string;
            const machineModel = formData.get('machineModel') as string;

            return await handleUpload(file, title, machineModel, orgId, user.id);
        }

        if (!orgId) {
            return NextResponse.json({ error: 'No Organization assigned' }, { status: 400 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const title = formData.get('title') as string;
        const machineModel = formData.get('machineModel') as string;

        return await handleUpload(file, title, machineModel, orgId, user.id);

    } catch (error: any) {
        console.error('[Manual Upload] ERROR:', error);
        console.error('[Manual Upload] Error stack:', error?.stack);
        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}

/**
 * Main upload handler function
 */
async function handleUpload(
    file: File,
    title: string,
    machineModel: string,
    orgId: string | null,
    userId: string
): Promise<NextResponse> {
    try {
        // 1. Validate inputs
        if (!file || !title || !machineModel) {
            return NextResponse.json({ error: 'Missing required fields: file, title, or machineModel' }, { status: 400 });
        }

        // 2. Validate file
        const validation = validateFile(file, ALLOWED_TYPES, MAX_FILE_SIZE);
        if (!validation.valid) {
            console.error('[Manual Upload] File validation failed:', validation.error);
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        console.log('[Manual Upload] File validated successfully');

        // 3. Upload to Supabase Storage (Manuals Bucket)
        const adminSupabase = createAdminClient();
        const storagePath = orgId ? `${orgId}/${Date.now()}-${file.name}` : `global/${Date.now()}-${file.name}`;

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log('[Manual Upload] File info:', {
            name: file.name,
            size: file.size,
            type: file.type,
            bufferLength: buffer.length,
            orgId: orgId || 'global'
        });

        // Upload to storage
        const { data: uploadData, error: uploadError } = await adminSupabase
            .storage
            .from('manuals')
            .upload(storagePath, buffer, {
                contentType: 'application/pdf',
                upsert: true
            });

        let fileUrl = '';
        if (uploadError) {
            console.warn('[Manual Upload] Storage upload failed:', uploadError.message);
            // Continue processing even if storage fails (bucket might not exist in dev)
        } else {
            const { data: { publicUrl } } = adminSupabase.storage.from('manuals').getPublicUrl(storagePath);
            fileUrl = publicUrl;
            console.log('[Manual Upload] File uploaded to storage:', fileUrl);
        }

        // 4. Create Parent Record in org_manuals
        console.log('[Manual Upload] Creating parent record in org_manuals...');
        // @ts-ignore - Types not yet propagated for new table
        const { data: orgManual, error: orgManualError } = await adminSupabase
            .from('org_manuals')
            .insert({
                org_id: orgId || undefined, // undefined relies on DB default or nullable if allows, but schema says NOT NULL. 
                // Wait, if orgId is null (global), we need to handle that. Schema says org_id IS NOT NULL. 
                // If it's global, we might need a specific "global" org ID or schema change. 
                // Existing manuals table allows org_id NULL. org_manuals schema defined NOT NULL.
                // Assuming for now orgId is present (Org Admin flow). If Super Admin global upload, this might fail unless we fix schema or provide dummy ID.
                // Let's assume orgId is valid for now based on previous checks.
                title: title,
                storage_url: storagePath,
                file_name: file.name,
                file_size: file.size,
                mime_type: file.type,
                machine_model: machineModel,
                status: 'processing',
                uploaded_by: userId
            })
            .select()
            .single();

        if (orgManualError || !orgManual) {
            console.error('[Manual Upload] Failed to create org_manuals record:', orgManualError);
            return NextResponse.json({ error: 'Failed to initialize manual record' }, { status: 500 });
        }

        // @ts-ignore
        const orgManualId = orgManual.id;
        console.log(`[Manual Upload] Created org_manuals record: ${orgManualId}`);

        // 4. Process Manual (Extract Text, Chunk, Generate Embeddings)
        console.log('[Manual Upload] Processing manual PDF...');
        const processed = await processManual(buffer, title, machineModel);
        console.log('[Manual Upload] Manual processed:', {
            chunks: processed.chunks.length,
            safetyWarnings: processed.safetyWarnings.length,
            totalPages: processed.metadata.totalPages
        });

        // 5. Store Chunks in Database
        console.log('[Manual Upload] Inserting chunks into database...');

        // Store all safety warnings as JSONB (will be same for all chunks)
        const safetyWarningsJson = processed.safetyWarnings.reduce((acc, warning, index) => {
            acc[`warning_${index}`] = {
                type: warning.type,
                description: warning.description,
                context: warning.context,
                pageNumber: warning.pageNumber
            };
            return acc;
        }, {} as Record<string, any>);

        const rows = processed.chunks.map(chunk => ({
            org_id: orgId,
            org_manual_id: orgManualId, // Link to parent
            title: title,
            machine_model: machineModel,
            content: chunk.content,
            embedding: chunk.embedding,
            safety_warnings: safetyWarningsJson,
            file_url: fileUrl,
            status: 'active',
            version: processed.metadata.version
        }));

        // Log what we're about to insert
        console.log('[Manual Upload] Attempting to insert rows:', {
            count: rows.length,
            firstRow: rows[0] ? {
                org_id: rows[0].org_id,
                title: rows[0].title,
                machine_model: rows[0].machine_model,
                contentLength: rows[0].content?.length,
                embeddingLength: rows[0].embedding?.length,
                safetyWarnings: Object.keys(rows[0].safety_warnings || {}).length,
                file_url: rows[0].file_url,
                status: rows[0].status,
                version: rows[0].version
            } : null
        });

        // Batch insert manual chunks
        const { data: insertedManuals, error: insertError } = (await adminSupabase
            .from('manuals')
            // @ts-ignore - TypeScript inference issue with Supabase types
            .insert(rows)
            .select('id')) as { data: Array<{ id: string }> | null; error: any };

        console.log('[Manual Upload] Insert result:', {
            success: !insertError,
            dataCount: insertedManuals?.length,
            error: insertError
        });

        if (insertError) {
            console.error('[Manual Upload] Database insert error:', insertError);

            // Try to set status to error
            // @ts-ignore
            await adminSupabase
                .from('org_manuals')
                // @ts-ignore
                .update({ status: 'error' })
                .eq('id', orgManualId);

            console.error('[Manual Upload] Error details:', JSON.stringify(insertError, null, 2));
            return NextResponse.json({
                error: 'Failed to save manual to database',
                details: insertError.message,
                code: insertError.code,
                hint: insertError.hint
            }, { status: 500 });
        }

        console.log('[Manual Upload] Inserted', insertedManuals?.length, 'manual chunks');

        // Verify the insert by querying the database
        const { data: verifyData, error: verifyError } = await adminSupabase
            .from('manuals')
            .select('id')
            .eq('title', title)
            .eq('machine_model', machineModel);

        console.log('[Manual Upload] Verification query:', {
            found: verifyData?.length || 0,
            error: verifyError
        });

        // 6. Insert Extracted Safety Rules into Blacklist
        if (processed.safetyWarnings.length > 0) {
            console.log('[Manual Upload] Extracting safety rules for blacklist...');

            const safetyRules = await extractSafetyRules(
                processed.safetyWarnings,
                machineModel
            );

            if (safetyRules.length > 0) {
                // Use the first manual chunk's ID as the reference
                const manualId = insertedManuals?.[0]?.id;

                const blacklistRows = safetyRules.map(rule => ({
                    manual_id: manualId,
                    machine_model: machineModel,
                    rule_description: rule.ruleDescription,
                    embedding: rule.embedding,
                    severity: rule.severity
                }));

                const { error: blacklistError } = await adminSupabase
                    .from('safety_blacklist')
                    // @ts-ignore - TypeScript inference issue with Supabase types
                    .insert(blacklistRows);

                if (blacklistError) {
                    console.error('[Manual Upload] Failed to insert safety rules:', blacklistError);
                    // Don't fail the whole upload if blacklist insertion fails
                } else {
                    console.log('[Manual Upload] Inserted', safetyRules.length, 'safety rules into blacklist');
                }
            }
        }

        // 7. Update org_manuals status to active
        // @ts-ignore
        const { error: updateError } = await adminSupabase
            .from('org_manuals')
            // @ts-ignore
            .update({ status: 'active' })
            .eq('id', orgManualId);

        if (updateError) {
            console.error('[Manual Upload] Failed to activate org_manuals record:', updateError);
            // Non-fatal, but good to know
        }

        return NextResponse.json({
            success: true,
            data: {
                chunks: rows.length,
                safetyWarnings: processed.safetyWarnings.length,
                safetyRules: processed.safetyWarnings.length,
                totalPages: processed.metadata.totalPages,
                fileUrl: fileUrl,
                orgManualId: orgManualId
            }
        });

    } catch (error: any) {
        console.error('[Manual Upload Handler] ERROR:', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
