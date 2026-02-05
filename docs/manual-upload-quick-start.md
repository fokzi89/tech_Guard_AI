# Manual Upload - Quick Start Guide

## Overview

The manual upload feature allows administrators to upload PDF machine manuals that power TechGuard AI's RAG (Retrieval-Augmented Generation) system and safety features.

## What Happens When You Upload a Manual?

```
PDF Upload
    ↓
1. File Validation (PDF, <50MB)
    ↓
2. Storage (Supabase Storage)
    ↓
3. Text Extraction (pdf2json)
    ↓
4. Safety Warning Detection (DANGER/WARNING/CAUTION)
    ↓
5. Text Chunking (1000 chars with 200 char overlap)
    ↓
6. Embedding Generation (OpenAI text-embedding-3-small)
    ↓
7. Database Storage
   ├─→ Manual chunks in `manuals` table
   └─→ Safety rules in `safety_blacklist` table
```

## Quick Upload

### Via UI

1. Navigate to `/dashboard/organization/manuals`
2. Enter manual details:
   - **Title**: e.g., "Service Manual V2.1"
   - **Machine Model**: e.g., "Domino M230i"
   - **PDF File**: Select your PDF (max 50MB)
3. Click "Upload & Process"
4. Wait ~30-60 seconds for processing
5. Manual appears in list when complete

### Via API

```bash
curl -X POST http://localhost:3000/api/manuals/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/manual.pdf" \
  -F "title=Service Manual V2.1" \
  -F "machineModel=Domino M230i"
```

## Checking Your Uploads

### Using the Query Script

```bash
# List all manuals
node scripts/query-manuals.js list

# View safety blacklist
node scripts/query-manuals.js blacklist

# Show statistics
node scripts/query-manuals.js stats

# Run all checks
node scripts/query-manuals.js all
```

### Expected Output

```
╔════════════════════════════════════════════════════════════╗
║          TechGuard AI - Manual Query Tool                 ║
╚════════════════════════════════════════════════════════════╝

📋 UPLOADED MANUALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total chunks in database: 45
Unique manuals: 1

1. Domino M230i Service Manual
   Machine: Domino M230i
   Scope: Org-Specific
   Status: active
   Safety Warnings: 12
   Uploaded: 1/30/2026, 2:30:45 PM
```

## Key Features

### ✅ Multi-Tenant Isolation
- Org Admins can only upload/view their organization's manuals
- Super Admins can upload global manuals (accessible to all orgs)
- RLS (Row Level Security) enforces data isolation

### ✅ Automatic Safety Extraction
- Detects DANGER, WARNING, CAUTION keywords
- Generates embeddings for safety rules
- Populates `safety_blacklist` for Guardian Agent
- Severity mapping:
  - DANGER → CRITICAL
  - WARNING → HIGH
  - CAUTION → MEDIUM

### ✅ RAG-Ready Chunks
- Text chunked with overlap for better retrieval
- Each chunk has 1536-dimension embedding
- Searchable via vector similarity
- Powers Diagnostician Agent responses

### ✅ File Management
- Upload to Supabase Storage
- Delete manuals (cascades to safety rules)
- Archive manuals (status: 'archived')
- View upload history

## Database Schema

### Manuals Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Unique chunk identifier |
| `org_id` | uuid | Organization (NULL = global) |
| `title` | text | Manual title |
| `machine_model` | text | Machine identifier |
| `content` | text | Chunk content |
| `embedding` | vector(1536) | Semantic embedding |
| `safety_warnings` | jsonb | Extracted warnings |
| `file_url` | text | Storage URL |
| `status` | text | 'active' or 'archived' |
| `version` | text | Manual version |

### Safety Blacklist Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Unique rule identifier |
| `manual_id` | uuid | Reference to manual |
| `machine_model` | text | Machine identifier |
| `rule_description` | text | Safety rule text |
| `embedding` | vector(1536) | Semantic embedding |
| `severity` | text | CRITICAL/HIGH/MEDIUM |

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/manuals/upload` | Upload new manual |
| GET | `/api/manuals` | List all manuals |
| GET | `/api/manuals/[id]` | Get specific chunk |
| DELETE | `/api/manuals/[id]` | Delete manual |
| PATCH | `/api/manuals/[id]` | Update status |

## Global Manuals (Super Admin Only)

Super Admins can upload manuals accessible to all organizations:

### Via API
```bash
curl -X POST http://localhost:3000/api/manuals/upload \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -F "file=@/path/to/manual.pdf" \
  -F "title=Universal Safety Guide" \
  -F "machineModel=All Models" \
  -F "isGlobal=true"
```

### Database
Global manuals have `org_id = NULL` in the database.

## Troubleshooting

### Upload Fails

**Problem**: "Invalid file type"
- **Solution**: Only PDF files are supported

**Problem**: "File size exceeds limit"
- **Solution**: Max size is 50MB. Compress or split PDF.

**Problem**: "Failed to extract text from PDF"
- **Causes**:
  - Scanned PDF without OCR
  - Encrypted PDF
  - Corrupted file
- **Solution**: Ensure PDF has selectable text

### No Safety Warnings Extracted

**Problem**: Uploaded manual but `safety_blacklist` is empty

**Possible Causes**:
1. PDF doesn't contain "DANGER", "WARNING", or "CAUTION" keywords
2. Text extraction failed
3. Pattern matching didn't find formatted warnings

**Check**:
```bash
node scripts/query-manuals.js blacklist
```

**Solution**: Verify PDF contains safety sections with proper formatting

### Storage Upload Failed

**Warning**: "Storage upload failed (bucket missing?)"

**Note**: System continues processing even if storage fails (for development)

**Solution**: Create `manuals` bucket in Supabase Dashboard:
1. Go to Storage in Supabase Dashboard
2. Create new bucket named `manuals`
3. Set public access if needed
4. Re-upload manual

## Environment Setup

Required environment variables:

```bash
# OpenAI (for embeddings)
OPENAI_API_KEY=sk-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Testing

### Test with Sample PDF

1. Create a simple test PDF with safety warnings:
   ```
   DANGER: Do not connect Terminal 21 to Terminal 29.
   WARNING: Disconnect power before maintenance.
   CAUTION: Wear protective equipment.
   ```

2. Upload via UI
3. Check results:
   ```bash
   node scripts/query-manuals.js all
   ```

### Verify RAG Integration

After uploading, the manual should:
- ✅ Appear in manuals list
- ✅ Have chunks with embeddings in database
- ✅ Have safety rules in blacklist
- ✅ Be searchable by Guardian Agent
- ✅ Provide context to Diagnostician Agent

## Performance

### Typical Upload Time (100-page PDF)

- PDF extraction: **2-5 seconds**
- Chunking: **<1 second**
- Embedding generation: **20-40 seconds**
- Database insertion: **2-3 seconds**
- **Total: ~30-50 seconds**

### Optimization Tips

1. **Batch uploads**: Upload multiple manuals sequentially
2. **Off-peak processing**: Upload during low-traffic hours
3. **Pre-process PDFs**: Optimize PDFs before upload
4. **Monitor logs**: Check server logs for bottlenecks

## Next Steps

After uploading manuals:

1. **Test Guardian Agent**: Try asking about dangerous procedures
2. **Test Diagnostician**: Ask troubleshooting questions
3. **Verify Search**: Check manual content is retrieved correctly
4. **Review Safety Rules**: Ensure critical warnings were extracted

## Related Documentation

- [Full Technical Documentation](./manual-upload-feature.md)
- [RAG Engine Guide](../specs/001-techguard-ai-mvp/quickstart.md)
- [Guardian Agent Spec](../specs/001-techguard-ai-mvp/contracts/agent-contracts.md)
