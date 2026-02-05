# Manual Upload Feature - Technical Documentation

## Overview

The Manual Upload feature is a core component of TechGuard AI that enables administrators to upload machine manuals in PDF format. The system automatically processes these manuals through a sophisticated RAG (Retrieval-Augmented Generation) pipeline that:

1. Extracts text content from PDFs
2. Identifies and extracts safety warnings
3. Chunks the content for optimal retrieval
4. Generates embeddings for semantic search
5. Populates the safety blacklist for the Guardian Agent

## Architecture

### Database Schema

#### `manuals` Table
Stores chunked manual content with embeddings:

```sql
create table public.manuals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id),  -- NULL for global manuals
  title text not null,
  machine_model text not null,
  content text not null,
  embedding vector(1536) not null,  -- OpenAI text-embedding-3-small
  safety_warnings jsonb default '{}',
  file_url text,
  status text default 'active',  -- 'active' | 'archived'
  version text default '1.0',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

**Key Points:**
- One manual = multiple chunks (rows)
- Each chunk has its own embedding for RAG search
- `org_id = NULL` means global manual (accessible to all organizations)
- `safety_warnings` stores all extracted warnings as JSONB

#### `safety_blacklist` Table
Stores prohibited actions extracted from manuals:

```sql
create table public.safety_blacklist (
  id uuid primary key default gen_random_uuid(),
  manual_id uuid references manuals(id) on delete CASCADE,
  machine_model text not null,
  rule_description text not null,  -- e.g., "DANGER: Do not connect Terminal 21 to 29"
  embedding vector(1536) not null,
  severity text default 'CRITICAL',  -- 'CRITICAL' | 'HIGH' | 'MEDIUM'
  created_at timestamptz default now()
);
```

**Key Points:**
- Automatically populated when manuals are uploaded
- Guardian Agent uses vector similarity search against this table
- CASCADE delete ensures safety rules are removed when manual is deleted

## RAG Pipeline

### Step 1: PDF Text Extraction

**Library:** `pdf2json` (CommonJS module)
**Location:** `lib/rag/manual-processor.ts`

```typescript
const { text, totalPages } = await extractTextFromPDF(pdfBuffer);
```

- Extracts all text from PDF pages
- Decodes URI-encoded characters
- Returns total page count for metadata

### Step 2: Safety Warning Extraction

**Pattern Matching:**
- `DANGER` → CRITICAL severity
- `WARNING` → HIGH severity
- `CAUTION` → MEDIUM severity

```typescript
const safetyWarnings = extractSafetyWarnings(text);
// Returns array of { type, description, context, pageNumber }
```

**Example Extracted Warning:**
```json
{
  "type": "DANGER",
  "description": "Do not connect Terminal 21 to Terminal 29. External voltage hazard.",
  "context": "...surrounding text for context...",
  "pageNumber": 12
}
```

### Step 3: Text Chunking

**Strategy:** Overlapping chunks for context preservation

```typescript
chunkText(text, {
  chunkSize: 1000,  // characters per chunk
  overlap: 200      // overlap between chunks
});
```

**Why Overlap?**
- Prevents information loss at chunk boundaries
- Improves retrieval accuracy when user questions span multiple sentences

### Step 4: Embedding Generation

**Model:** OpenAI `text-embedding-3-small`
**Dimensions:** 1536

```typescript
for (const chunk of chunks) {
  const embedding = await generateEmbedding(prepareTextForEmbedding(chunk));
  // Store in database
}
```

**Text Preparation:**
- Normalize whitespace
- Remove excessive newlines
- Limit to 8000 characters (model limit)

### Step 5: Safety Blacklist Population

```typescript
const safetyRules = await extractSafetyRules(safetyWarnings, machineModel);
// Each warning becomes a searchable rule with its own embedding
```

**Process:**
1. Convert each safety warning into a rule description
2. Generate embedding for the rule
3. Map warning type to severity level
4. Insert into `safety_blacklist` table

## API Endpoints

### POST /api/manuals/upload

**Purpose:** Upload and process a new manual

**Authentication:** Required (Org Admin or Super Admin)

**Request:** `multipart/form-data`

```typescript
{
  file: File,              // PDF file (max 50MB)
  title: string,           // Manual title
  machineModel: string,    // Machine model identifier
  isGlobal?: boolean       // Super Admin only: upload as global manual
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "chunks": 45,
    "safetyWarnings": 12,
    "safetyRules": 12,
    "totalPages": 120,
    "fileUrl": "https://..."
  }
}
```

**Flow:**

1. **Authentication & Authorization**
   - Verify user is authenticated
   - Check role is `org_admin` or `super_admin`
   - Determine `org_id` (null for global manuals)

2. **File Validation**
   - Check file type (PDF only)
   - Check file size (max 50MB)

3. **Storage Upload**
   - Upload to Supabase Storage (`manuals` bucket)
   - Path: `{org_id}/{timestamp}-{filename}` or `global/{timestamp}-{filename}`

4. **PDF Processing**
   - Extract text
   - Extract safety warnings
   - Chunk text
   - Generate embeddings

5. **Database Storage**
   - Insert manual chunks into `manuals` table
   - Insert safety rules into `safety_blacklist` table

6. **Return Success**

### GET /api/manuals

**Purpose:** List all manuals for the current organization

**Response:**

```json
[
  {
    "id": "uuid",
    "title": "Domino M230i Service Manual",
    "machine_model": "Domino M230i",
    "created_at": "2026-01-30T...",
    "status": "active",
    "file_url": "https://..."
  }
]
```

**Note:** Deduplicates chunks to show one entry per manual

### GET /api/manuals/[id]

**Purpose:** Get a specific manual chunk by ID

**Response:**

```json
{
  "id": "uuid",
  "org_id": "uuid",
  "title": "Manual Title",
  "machine_model": "Model XYZ",
  "content": "Chunk content...",
  "embedding": [0.123, ...],
  "safety_warnings": { ... },
  "file_url": "https://...",
  "status": "active",
  "version": "1.0"
}
```

### DELETE /api/manuals/[id]

**Purpose:** Delete a manual and all its chunks

**Process:**
1. Verify ownership (org_id must match or super_admin)
2. Delete all chunks with same `title` and `org_id`
3. Cascade delete associated `safety_blacklist` entries

**Response:**

```json
{
  "success": true,
  "message": "Manual and associated safety rules deleted successfully"
}
```

### PATCH /api/manuals/[id]

**Purpose:** Archive or activate a manual

**Request:**

```json
{
  "status": "archived"  // or "active"
}
```

**Note:** Updates all chunks with the same title

## Frontend Components

### Upload UI

**Location:** `app/dashboard/organization/manuals/page.tsx`

**Features:**
- Form with title, machine model, and file upload
- File preview showing name and size
- Upload progress indicator
- Automatic list refresh after upload

**Code Example:**

```tsx
<form onSubmit={handleUpload}>
  <Input value={title} onChange={e => setTitle(e.target.value)} />
  <Input value={machineModel} onChange={e => setMachineModel(e.target.value)} />
  <Input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} />
  <Button type="submit" disabled={uploading}>
    {uploading ? 'Processing...' : 'Upload & Process'}
  </Button>
</form>
```

### Manuals List

**Location:** `app/components/admin/ManualsList.tsx`

**Features:**
- Displays all uploaded manuals
- Shows title, machine model, and PDF icon
- Delete button with confirmation
- Empty state when no manuals exist

## Row Level Security (RLS)

### Manuals Table Policies

```sql
-- Super Admins can manage all manuals
CREATE POLICY "super_admin_all_manuals"
ON manuals FOR ALL
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Users can see global manuals (org_id IS NULL)
CREATE POLICY "users_global_manuals"
ON manuals FOR SELECT
TO authenticated
USING (org_id IS NULL AND status = 'active');

-- Users can see their organization's manuals
CREATE POLICY "users_org_manuals"
ON manuals FOR SELECT
TO authenticated
USING (
  org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  AND status = 'active'
);

-- Org Admins can insert/update/delete their org's manuals
CREATE POLICY "org_admin_manage_manuals"
ON manuals FOR ALL
TO authenticated
USING (
  org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'org_admin'
);
```

## Usage Examples

### For Org Admins

1. Navigate to `/dashboard/organization/manuals`
2. Fill in manual title (e.g., "Service Manual V2.1")
3. Enter machine model (e.g., "Domino M230i")
4. Select PDF file
5. Click "Upload & Process"
6. Wait for processing (typically 30-60 seconds)
7. Manual appears in list when complete

### For Super Admins

**Option 1: Upload org-specific manual**
- Same as org admin flow

**Option 2: Upload global manual**
- Add `isGlobal: true` to the form data
- Manual will be accessible to ALL organizations

## Guardian Agent Integration

When the Guardian Agent analyzes user input for safety violations:

1. Generate embedding for user's message
2. Vector similarity search against `safety_blacklist` table
3. If similarity > 0.85, retrieve matched rule
4. If matched rule severity is CRITICAL or HIGH, BLOCK response
5. Trigger Isolation Protocol UI

**Example Query (conceptual):**

```sql
SELECT rule_description, severity, 1 - (embedding <=> $userEmbedding) as similarity
FROM safety_blacklist
WHERE machine_model = $machineModel
AND 1 - (embedding <=> $userEmbedding) > 0.85
ORDER BY similarity DESC
LIMIT 1;
```

## Diagnostician Agent Integration

When the Diagnostician Agent needs manual context:

1. Generate embedding for user's question
2. Vector similarity search against `manuals` table
3. Retrieve top 3-5 most relevant chunks
4. Inject chunks into LLM context
5. Generate response with citations

**Example Query (conceptual):**

```sql
SELECT content, title, 1 - (embedding <=> $userEmbedding) as similarity
FROM manuals
WHERE (org_id = $userOrgId OR org_id IS NULL)
AND machine_model = $machineModel
AND status = 'active'
ORDER BY similarity DESC
LIMIT 5;
```

## Error Handling

### Common Errors

1. **File Too Large (>50MB)**
   - Error: "File size exceeds limit"
   - Solution: Split PDF or compress

2. **Invalid File Type**
   - Error: "Invalid file type"
   - Solution: Only PDF files are supported

3. **PDF Extraction Failed**
   - Error: "Failed to extract text from PDF"
   - Causes: Corrupted PDF, scanned images without OCR, encrypted PDF
   - Solution: Ensure PDF has selectable text

4. **Embedding Generation Failed**
   - Error: "Failed to generate embedding"
   - Cause: OpenAI API key missing or invalid
   - Solution: Check `OPENAI_API_KEY` environment variable

5. **Storage Upload Failed**
   - Warning: "Storage upload failed (bucket missing?)"
   - Behavior: Continues processing without file URL
   - Solution: Create `manuals` bucket in Supabase Storage

### Logging

All operations are logged with `[Manual Upload]` prefix:

```
[Manual Upload] Starting upload process...
[Manual Upload] User check: User ID: abc123
[Manual Upload] File validated successfully
[Manual Upload] File uploaded to storage: https://...
[Manual Upload] Processing manual PDF...
[Manual Upload] Manual processed: {chunks: 45, safetyWarnings: 12, totalPages: 120}
[Manual Upload] Inserting chunks into database...
[Manual Upload] Inserted 45 manual chunks
[Manual Upload] Extracting safety rules for blacklist...
[Manual Upload] Inserted 12 safety rules into blacklist
```

## Performance Considerations

### Upload Time

Typical processing time for a 100-page manual:
- PDF extraction: 2-5 seconds
- Chunking: <1 second
- Embedding generation: 20-40 seconds (45 chunks × 0.5s per chunk)
- Database insertion: 2-3 seconds
- **Total: ~30-50 seconds**

### Optimization Opportunities

1. **Batch Embedding Generation**
   - Current: Sequential (one chunk at a time)
   - Potential: Use `generateEmbeddingsBatch` for parallel processing
   - Improvement: ~50% faster

2. **Background Processing**
   - Current: Synchronous upload
   - Potential: Queue-based processing with job status tracking
   - Improvement: Immediate response to user, process in background

3. **Caching**
   - Current: No caching
   - Potential: Cache extracted text for re-processing
   - Use case: Regenerating embeddings with different model

## Testing

### Unit Tests (TODO)

```typescript
// tests/unit/manual-processor.test.ts
describe('extractSafetyWarnings', () => {
  it('should extract DANGER warnings', () => {
    const text = "DANGER: Do not touch live wires.\n\nProceed with caution.";
    const warnings = extractSafetyWarnings(text);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].type).toBe('DANGER');
  });
});
```

### E2E Tests (TODO)

```typescript
// tests/e2e/manual-upload.spec.ts
test('should upload PDF and populate safety blacklist', async ({ page }) => {
  await page.goto('/dashboard/organization/manuals');
  await page.fill('[name="title"]', 'Test Manual');
  await page.fill('[name="machineModel"]', 'TestModel-X');
  await page.setInputFiles('[type="file"]', 'fixtures/test-manual.pdf');
  await page.click('button[type="submit"]');

  await expect(page.locator('text=Manual uploaded successfully')).toBeVisible();

  // Verify safety blacklist was populated
  const blacklistCount = await db.from('safety_blacklist')
    .select('count')
    .eq('machine_model', 'TestModel-X');
  expect(blacklistCount.count).toBeGreaterThan(0);
});
```

## Configuration

### Environment Variables

```bash
# Required for embedding generation
OPENAI_API_KEY=sk-...

# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Supabase Storage

**Bucket Name:** `manuals`

**Required Configuration:**
1. Create bucket in Supabase Dashboard
2. Set as public or configure access policies
3. Enable file size limit (recommended: 50MB)

**Path Structure:**
```
manuals/
├── {org_id}/
│   ├── 1706657890123-service-manual-v2.pdf
│   └── 1706657891456-safety-guide.pdf
└── global/
    └── 1706657892789-universal-safety.pdf
```

## Future Enhancements

### Phase 1 (Completed)
- ✅ PDF upload and text extraction
- ✅ Safety warning extraction
- ✅ Embedding generation
- ✅ Safety blacklist population
- ✅ Global manual support

### Phase 2 (Planned)
- [ ] OCR for scanned PDFs (using Tesseract.js)
- [ ] Manual versioning system
- [ ] Diff view for manual updates
- [ ] Bulk upload support
- [ ] Manual preview in UI

### Phase 3 (Future)
- [ ] AI-powered safety rule suggestions
- [ ] Manual quality scoring
- [ ] Automatic translation
- [ ] Integration with equipment databases
- [ ] Manual expiration/review reminders

## Troubleshooting Guide

### Problem: "Unauthorized" error

**Cause:** User not logged in or session expired

**Solution:**
1. Refresh the page
2. Log in again
3. Check browser console for auth errors

### Problem: Processing takes > 2 minutes

**Cause:** Large PDF with many pages

**Solution:**
1. Check PDF page count
2. Consider splitting into multiple manuals
3. Monitor server logs for errors

### Problem: No safety warnings extracted

**Cause:** PDF doesn't contain "DANGER", "WARNING", or "CAUTION" keywords

**Solution:**
1. Verify PDF has safety warnings
2. Check warning format matches pattern
3. Manually add to safety blacklist if needed

### Problem: Manual not appearing in chat context

**Cause:** Several possibilities

**Solution:**
1. Verify `status = 'active'`
2. Check `machine_model` matches user's selection
3. Verify RLS policies allow access
4. Check embeddings were generated successfully

## Support

For issues or questions:
1. Check server logs for error messages
2. Verify database schema matches latest migration
3. Ensure all environment variables are set
4. Review this documentation for configuration requirements

## Related Documentation

- [RAG Engine Documentation](./rag-engine.md)
- [Guardian Agent Specification](../specs/001-techguard-ai-mvp/contracts/agent-contracts.md)
- [Database Schema](../specs/001-techguard-ai-mvp/data-model.md)
- [API Routes Contract](../specs/001-techguard-ai-mvp/contracts/api-routes.md)
