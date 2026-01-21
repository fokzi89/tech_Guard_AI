# API Routes Contract: TechGuard AI

**Date**: 2026-01-19
**Feature**: TechGuard AI - Industrial Safety Troubleshooting Platform
**Protocol**: REST over HTTPS
**Base URL**: `https://your-domain.com/api`

## Overview

This document defines all REST API endpoints for TechGuard AI. All endpoints are implemented as Next.js API routes under the `app/api/` directory.

## Authentication

All API routes require authentication via Supabase Auth session cookie or Bearer token.

**Headers**:
```
Authorization: Bearer <supabase_access_token>
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Authenticated but lacks permission for this resource

---

## Chat API

### POST /api/chat

Main chat endpoint orchestrating Guardian + Diagnostician agents.

**Request**:
```typescript
{
  "incident_id": "uuid",           // Existing session ID
  "message": "string",             // User's question
  "machine_model": "string",       // Machine being troubleshot
  "photo_url"?: "string"           // Optional: URL to uploaded photo
}
```

**Response** (Streaming):
```typescript
{
  "type": "text" | "safety_warning" | "photo_request",
  "content": "string",             // AI response text
  "is_blocked": boolean,           // True if safety Guardian blocked
  "safety_intervention"?: {
    "rule_id": "uuid",
    "rule_description": "string",
    "severity": "CRITICAL" | "HIGH" | "MEDIUM",
    "required_action": "disconnect_power" | "lockout_tagout"
  }
}
```

**Success**: `200 OK` with streaming Server-Sent Events
**Errors**:
- `400 Bad Request`: Invalid message or missing required fields
- `404 Not Found`: incident_id does not exist or user lacks access
- `429 Too Many Requests`: Rate limit exceeded

**Rate Limiting**: 60 requests per minute per user

**Example**:
```bash
curl -X POST https://your-domain.com/api/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "incident_id": "123e4567-e89b-12d3-a456-426614174000",
    "message": "Can I jump Terminal 29 to Terminal 21?",
    "machine_model": "Domino M230i"
  }'
```

---

### POST /api/chat/session

Create a new troubleshooting session.

**Request**:
```typescript
{
  "machine_model": "string",       // Required
  "external_ticket_id"?: "string"  // Optional CMMS work order #
}
```

**Response**:
```typescript
{
  "incident_id": "uuid",
  "machine_model": "string",
  "external_ticket_id": "string | null",
  "created_at": "ISO8601 timestamp"
}
```

**Success**: `201 Created`
**Errors**:
- `400 Bad Request`: Missing machine_model

---

## Safety API

### POST /api/safety/check

Check if user input matches safety blacklist (used internally by Guardian Agent).

**Request**:
```typescript
{
  "user_input": "string",
  "machine_model": "string"
}
```

**Response**:
```typescript
{
  "is_blacklisted": boolean,
  "matched_rule": {
    "id": "uuid",
    "rule_description": "string",
    "severity": "CRITICAL" | "HIGH" | "MEDIUM"
  } | null
}
```

**Success**: `200 OK`
**Errors**:
- `400 Bad Request`: Missing required fields

---

### POST /api/safety/verify-photo

Verify photo shows proper isolation (power disconnected).

**Request** (multipart/form-data):
```
file: <image file>
incident_id: uuid
```

**Response**:
```typescript
{
  "verified": boolean,
  "confidence": number,            // 0.0 - 1.0
  "details": {
    "power_disconnected": boolean,
    "visible_isolation": boolean,
    "identified_objects": string[]
  },
  "photo_url": "string"            // URL to stored photo
}
```

**Success**: `200 OK`
**Errors**:
- `400 Bad Request`: Missing file or invalid format
- `413 Payload Too Large`: File exceeds 10MB limit

---

## Reports API

### POST /api/reports/generate

Generate CMMS-compatible service report for completed session.

**Request**:
```typescript
{
  "incident_id": "uuid"
}
```

**Response**:
```typescript
{
  "report_id": "uuid",
  "work_order": "string | null",
  "as_found": "string",
  "work_performed": "string",
  "as_left": "string",
  "formatted_text": "string",      // Ready for clipboard copy
  "generated_at": "ISO8601 timestamp"
}
```

**Success**: `200 OK`
**Errors**:
- `400 Bad Request`: incident_id is missing
- `404 Not Found`: Incident does not exist or user lacks access
- `409 Conflict`: Session is still open (not resolved)

---

### GET /api/reports/:reportId

Retrieve existing report.

**Response**:
```typescript
{
  "report_id": "uuid",
  "work_order": "string | null",
  "as_found": "string",
  "work_performed": "string",
  "as_left": "string",
  "formatted_text": "string",
  "generated_at": "ISO8601 timestamp"
}
```

**Success**: `200 OK`
**Errors**:
- `404 Not Found`: Report does not exist or user lacks access

---

## Manuals API

### POST /api/manuals/upload

Upload and process a machine manual (Org Admin only).

**Request** (multipart/form-data):
```
file: <PDF file>
title: string
machine_model: string
```

**Response**:
```typescript
{
  "manual_id": "uuid",
  "title": "string",
  "machine_model": "string",
  "chunks_created": number,        // Number of text chunks generated
  "safety_warnings_extracted": number,
  "file_url": "string",
  "status": "processing" | "complete"
}
```

**Success**: `202 Accepted` (async processing)
**Errors**:
- `400 Bad Request`: Invalid file type (must be PDF)
- `403 Forbidden`: User is not Org Admin
- `413 Payload Too Large`: File exceeds 50MB limit

---

### GET /api/manuals/search

Search manuals using RAG (vector similarity).

**Query Parameters**:
```
q: string                   // Search query
machine_model?: string      // Filter by machine model
limit?: number              // Max results (default: 5, max: 20)
```

**Response**:
```typescript
{
  "results": [
    {
      "manual_id": "uuid",
      "title": "string",
      "machine_model": "string",
      "excerpt": "string",         // Matched text snippet
      "similarity": number,        // 0.0 - 1.0
      "page_number": number | null
    }
  ],
  "query": "string",
  "count": number
}
```

**Success**: `200 OK`
**Errors**:
- `400 Bad Request`: Missing query parameter

---

### GET /api/manuals/:manualId

Get manual details.

**Response**:
```typescript
{
  "manual_id": "uuid",
  "title": "string",
  "machine_model": "string",
  "file_url": "string",
  "version": "string",
  "status": "active" | "archived",
  "created_at": "ISO8601 timestamp"
}
```

**Success**: `200 OK`
**Errors**:
- `404 Not Found`: Manual does not exist or user lacks access

---

### DELETE /api/manuals/:manualId

Archive a manual (Org Admin only).

**Success**: `204 No Content`
**Errors**:
- `403 Forbidden`: User is not Org Admin or Super Admin
- `404 Not Found`: Manual does not exist

---

## Admin API (Super Admin Only)

### GET /api/admin/organizations

List all organizations.

**Query Parameters**:
```
status?: "active" | "suspended" | "all"
page?: number
limit?: number
```

**Response**:
```typescript
{
  "organizations": [
    {
      "id": "uuid",
      "name": "string",
      "status": "active" | "suspended",
      "subscription_tier": "basic" | "professional" | "enterprise",
      "user_count": number,
      "created_at": "ISO8601 timestamp"
    }
  ],
  "page": number,
  "total_count": number
}
```

**Success**: `200 OK`
**Errors**:
- `403 Forbidden`: User is not Super Admin

---

### PATCH /api/admin/organizations/:orgId

Update organization status (suspend/activate).

**Request**:
```typescript
{
  "status": "active" | "suspended"
}
```

**Response**:
```typescript
{
  "id": "uuid",
  "name": "string",
  "status": "active" | "suspended",
  "updated_at": "ISO8601 timestamp"
}
```

**Success**: `200 OK`
**Errors**:
- `400 Bad Request`: Invalid status value
- `403 Forbidden`: User is not Super Admin
- `404 Not Found`: Organization does not exist

---

### POST /api/admin/impersonate

Impersonate an Org Admin for support purposes.

**Request**:
```typescript
{
  "org_id": "uuid"
}
```

**Response**:
```typescript
{
  "impersonation_token": "string",  // JWT with org_id claim
  "org_name": "string",
  "expires_at": "ISO8601 timestamp"
}
```

**Success**: `200 OK`
**Errors**:
- `403 Forbidden`: User is not Super Admin
- `404 Not Found`: Organization does not exist

---

## Org Admin API

### GET /api/org/users

List users in current organization (Org Admin only).

**Response**:
```typescript
{
  "users": [
    {
      "id": "uuid",
      "full_name": "string",
      "role": "org_admin" | "technician",
      "created_at": "ISO8601 timestamp"
    }
  ]
}
```

**Success**: `200 OK`
**Errors**:
- `403 Forbidden`: User is not Org Admin

---

### POST /api/org/users/invite

Invite a new user to the organization (Org Admin only).

**Request**:
```typescript
{
  "email": "string",
  "full_name": "string",
  "role": "org_admin" | "technician"
}
```

**Response**:
```typescript
{
  "invitation_sent": boolean,
  "email": "string"
}
```

**Success**: `201 Created`
**Errors**:
- `400 Bad Request`: Invalid email or role
- `403 Forbidden`: User is not Org Admin
- `409 Conflict`: User with this email already exists

---

## Error Response Format

All errors follow this consistent format:

```typescript
{
  "error": {
    "code": "string",              // Machine-readable error code
    "message": "string",           // Human-readable error message
    "details"?: any                // Optional additional context
  }
}
```

**Common Error Codes**:
- `auth/unauthorized`: Authentication required
- `auth/forbidden`: Insufficient permissions
- `validation/invalid_input`: Request validation failed
- `not_found`: Resource does not exist
- `rate_limit/exceeded`: Too many requests
- `internal_error`: Server error

---

## Rate Limiting

All API routes implement rate limiting:

| Endpoint Group          | Limit                     |
|-------------------------|---------------------------|
| Chat endpoints          | 60 requests/minute/user   |
| Manual upload           | 10 uploads/hour/org       |
| Safety check            | 100 requests/minute/user  |
| Admin operations        | 120 requests/minute/user  |
| All other endpoints     | 120 requests/minute/user  |

**Rate Limit Headers**:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
```

---

## Versioning

API version is included in all responses:

```
X-API-Version: 1.0.0
```

Future breaking changes will use URL versioning (`/api/v2/...`).

---

## Webhooks (Future)

Post-MVP: Support webhooks for event notifications (manual processed, incident resolved, etc.).
