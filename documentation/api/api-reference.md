# SaaS Starter Kit - API Reference

## Overview

The SaaS Starter Kit provides a comprehensive REST API built on Next.js with multi-tenant team management, authentication, and enterprise features. This reference provides detailed documentation for all API endpoints.

**Base URL**: `http://localhost:4002/api` (development)  
**Content Type**: `application/json`  
**API Version**: 1.0

## Authentication

### Session Authentication

For web applications using NextAuth.js sessions:

```http
Cookie: next-auth.session-token=...
```

### API Key Authentication

For external integrations and server-to-server communication:

```http
Authorization: Bearer sk_test_your_api_key_here
```

### Error Responses

All endpoints return consistent error format:

```json
{
  "error": {
    "message": "Error description"
  }
}
```

**HTTP Status Codes:**

- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `405` - Method Not Allowed
- `409` - Conflict
- `422` - Unprocessable Entity
- `500` - Internal Server Error

---

## Authentication Endpoints

### Register User

Create a new user account with team creation or invitation acceptance.

**Endpoint**: `POST /api/auth/join`

**Request Body**:

```json
{
  "name": "string (max 104 chars, required)",
  "email": "string (valid email, max 254 chars, required)",
  "password": "string (min 8 chars, max 70 chars, required)",
  "team": "string (max 50 chars, required if no inviteToken)",
  "inviteToken": "string (optional, for invitation-based signup)",
  "recaptchaToken": "string (optional, if reCAPTCHA enabled)"
}
```

**Response**: `201 Created`

```json
{
  "data": {
    "confirmEmail": true
  }
}
```

**Example**:

```bash
curl -X POST http://localhost:4002/api/auth/join \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123!",
    "team": "acme-corp"
  }'
```

### Password Reset Request

Initiate password reset process by sending reset email.

**Endpoint**: `POST /api/auth/forgot-password`

**Request Body**:

```json
{
  "email": "string (valid email, required)",
  "recaptchaToken": "string (optional)"
}
```

**Response**: `200 OK`

```json
{}
```

### Reset Password

Complete password reset using token from email.

**Endpoint**: `POST /api/auth/reset-password`

**Request Body**:

```json
{
  "password": "string (min 8 chars, max 70 chars, required)",
  "token": "string (required)"
}
```

**Response**: `200 OK`

```json
{}
```

### Custom Signout

Sign out user and clear session.

**Endpoint**: `POST /api/auth/custom-signout`  
**Authentication**: Session required

**Response**: `200 OK`

```json
{}
```

### Unlock Account

Unlock a locked user account using unlock token.

**Endpoint**: `POST /api/auth/unlock-account`

**Request Body**:

```json
{
  "email": "string (required)",
  "token": "string (required)"
}
```

**Response**: `200 OK`

```json
{}
```

---

## Team Management

### List Teams

Get all teams for the authenticated user.

**Endpoint**: `GET /api/teams`  
**Authentication**: Session required

**Response**: `200 OK`

```json
{
  "data": [
    {
      "id": "clm123abc",
      "name": "Acme Corporation",
      "slug": "acme-corp",
      "domain": "acme.com",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Create Team

Create a new team.

**Endpoint**: `POST /api/teams`  
**Authentication**: Session required

**Request Body**:

```json
{
  "name": "string (min 1, max 50 chars, required)"
}
```

**Response**: `200 OK`

```json
{
  "data": {
    "id": "clm123abc",
    "name": "Acme Corporation",
    "slug": "acme-corp",
    "domain": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Team

Get details for a specific team.

**Endpoint**: `GET /api/teams/{slug}`  
**Authentication**: Session required  
**Permissions**: Team member

**Parameters**:

- `slug` (path) - Team slug identifier

**Response**: `200 OK`

```json
{
  "data": {
    "id": "clm123abc",
    "name": "Acme Corporation",
    "slug": "acme-corp",
    "domain": "acme.com",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update Team

Update team details.

**Endpoint**: `PUT /api/teams/{slug}`  
**Authentication**: Session required  
**Permissions**: Team Admin or Owner

**Parameters**:

- `slug` (path) - Team slug identifier

**Request Body**:

```json
{
  "name": "string (min 1, max 50 chars, optional)",
  "slug": "string (min 3, max 50 chars, optional)",
  "domain": "string (valid domain, optional)"
}
```

**Response**: `200 OK`

```json
{
  "data": {
    "id": "clm123abc",
    "name": "Updated Name",
    "slug": "updated-slug",
    "domain": "updated.com",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### Delete Team

Delete a team (if feature enabled).

**Endpoint**: `DELETE /api/teams/{slug}`  
**Authentication**: Session required  
**Permissions**: Team Owner only

**Parameters**:

- `slug` (path) - Team slug identifier

**Response**: `204 No Content`

---

## Team Members

### List Team Members

Get all members of a team.

**Endpoint**: `GET /api/teams/{slug}/members`  
**Authentication**: Session or API Key  
**Permissions**: Team member

**Parameters**:

- `slug` (path) - Team slug identifier

**Response**: `200 OK`

```json
{
  "data": [
    {
      "id": "clm456def",
      "role": "OWNER",
      "user": {
        "id": "clm789ghi",
        "name": "John Doe",
        "email": "john@acme.com",
        "image": "https://avatar.url"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Update Member Role

Update a team member's role.

**Endpoint**: `PUT /api/teams/{slug}/members`  
**Authentication**: Session required  
**Permissions**: Team Admin or Owner

**Parameters**:

- `slug` (path) - Team slug identifier

**Request Body**:

```json
{
  "memberId": "string (required)",
  "role": "OWNER|ADMIN|MEMBER (required)"
}
```

**Response**: `200 OK`

```json
{
  "data": {
    "id": "clm456def",
    "role": "ADMIN",
    "user": {
      "id": "clm789ghi",
      "name": "John Doe",
      "email": "john@acme.com"
    }
  }
}
```

### Remove Team Member

Remove a member from the team.

**Endpoint**: `DELETE /api/teams/{slug}/members`  
**Authentication**: Session required  
**Permissions**: Team Admin or Owner

**Parameters**:

- `slug` (path) - Team slug identifier

**Request Body**:

```json
{
  "memberId": "string (required)"
}
```

**Response**: `200 OK`

```json
{}
```

---

## Team Invitations

### List Invitations

Get pending invitations for a team.

**Endpoint**: `GET /api/teams/{slug}/invitations`  
**Authentication**: Session required  
**Permissions**: Team member

**Parameters**:

- `slug` (path) - Team slug identifier
- `sentViaEmail` (query) - Filter by invitation type: "true", "false", or ""

**Response**: `200 OK`

```json
{
  "data": [
    {
      "id": "clm999xyz",
      "email": "invited@example.com",
      "role": "ADMIN",
      "sentViaEmail": true,
      "token": "inv_token_123",
      "expires": "2024-01-08T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Create Invitation

Create a new team invitation.

**Endpoint**: `POST /api/teams/{slug}/invitations`  
**Authentication**: Session required  
**Permissions**: Team Admin or Owner

**Parameters**:

- `slug` (path) - Team slug identifier

**Request Body**:

```json
{
  "email": "string (valid email, required if sentViaEmail=true)",
  "role": "ADMIN|MEMBER (required)",
  "sentViaEmail": "boolean (required)",
  "domains": "string (comma-separated domains, required if sentViaEmail=false)"
}
```

**Response**: `201 Created`

```json
{
  "data": {
    "id": "clm999xyz",
    "email": "invited@example.com",
    "role": "ADMIN",
    "sentViaEmail": true,
    "token": "inv_token_123",
    "expires": "2024-01-08T00:00:00.000Z"
  }
}
```

### Delete Invitation

Delete a pending invitation.

**Endpoint**: `DELETE /api/teams/{slug}/invitations`  
**Authentication**: Session required  
**Permissions**: Team Admin or Owner

**Parameters**:

- `slug` (path) - Team slug identifier

**Request Body**:

```json
{
  "id": "string (required)"
}
```

**Response**: `200 OK`

```json
{}
```

---

## API Keys

### List API Keys

Get all API keys for a team.

**Endpoint**: `GET /api/teams/{slug}/api-keys`  
**Authentication**: Session required  
**Permissions**: Team member

**Parameters**:

- `slug` (path) - Team slug identifier

**Response**: `200 OK`

```json
{
  "data": [
    {
      "id": "clm111aaa",
      "name": "Production API Key",
      "hashedKey": "sha256_hash_here",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "expiresAt": null
    }
  ]
}
```

### Create API Key

Create a new API key for the team.

**Endpoint**: `POST /api/teams/{slug}/api-keys`  
**Authentication**: Session required  
**Permissions**: Team Admin or Owner

**Parameters**:

- `slug` (path) - Team slug identifier

**Request Body**:

```json
{
  "name": "string (max 50 chars, required)"
}
```

**Response**: `201 Created`

```json
{
  "data": {
    "apiKey": {
      "id": "clm111aaa",
      "name": "Production API Key",
      "key": "sk_test_abc123...",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "expiresAt": null
    }
  }
}
```

**Note**: The raw API key is only returned once upon creation.

### Delete API Key

Delete an API key.

**Endpoint**: `DELETE /api/teams/{slug}/api-keys/{apiKeyId}`  
**Authentication**: Session required  
**Permissions**: Team Admin or Owner

**Parameters**:

- `slug` (path) - Team slug identifier
- `apiKeyId` (path) - API key ID

**Response**: `200 OK`

```json
{}
```

---

## Webhooks

### List Webhooks

Get all webhook endpoints for a team.

**Endpoint**: `GET /api/teams/{slug}/webhooks`  
**Authentication**: Session or API Key  
**Permissions**: Team member

**Parameters**:

- `slug` (path) - Team slug identifier

**Response**: `200 OK`

```json
{
  "data": [
    {
      "id": "ep_abc123",
      "description": "Member Events Webhook",
      "url": "https://api.example.com/webhooks",
      "filterTypes": ["member.created", "member.removed"],
      "version": 1,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Create Webhook

Create a new webhook endpoint.

**Endpoint**: `POST /api/teams/{slug}/webhooks`  
**Authentication**: Session required  
**Permissions**: Team Admin or Owner

**Parameters**:

- `slug` (path) - Team slug identifier

**Request Body**:

```json
{
  "name": "string (max 104 chars, required)",
  "url": "string (valid HTTPS URL, required)",
  "eventTypes": ["string"] (min 1 event, required)
}
```

**Available Event Types**:

- `member.created`
- `member.removed`
- `invitation.created`
- `invitation.removed`

**Response**: `200 OK`

```json
{
  "data": {
    "id": "ep_abc123",
    "description": "Member Events Webhook",
    "url": "https://api.example.com/webhooks",
    "filterTypes": ["member.created", "member.removed"],
    "version": 1,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update Webhook

Update an existing webhook endpoint.

**Endpoint**: `PUT /api/teams/{slug}/webhooks/{endpointId}`  
**Authentication**: Session required  
**Permissions**: Team Admin or Owner

**Parameters**:

- `slug` (path) - Team slug identifier
- `endpointId` (path) - Webhook endpoint ID

**Request Body**:

```json
{
  "name": "string (max 104 chars, required)",
  "url": "string (valid HTTPS URL, required)",
  "eventTypes": ["string"] (min 1 event, required),
  "endpointId": "string (required)"
}
```

**Response**: `200 OK`

```json
{
  "data": {
    "id": "ep_abc123",
    "description": "Updated Webhook",
    "url": "https://api.example.com/new-webhooks",
    "filterTypes": ["member.created"],
    "version": 2
  }
}
```

### Delete Webhook

Delete a webhook endpoint.

**Endpoint**: `DELETE /api/teams/{slug}/webhooks`  
**Authentication**: Session required  
**Permissions**: Team Admin or Owner

**Parameters**:

- `slug` (path) - Team slug identifier
- `webhookId` (query) - Webhook ID to delete

**Response**: `200 OK`

```json
{}
```

---

## Payments & Billing

### Get Products and Subscriptions

Get available products and current team subscriptions.

**Endpoint**: `GET /api/teams/{slug}/payments/products`  
**Authentication**: Session required  
**Permissions**: Team member

**Parameters**:

- `slug` (path) - Team slug identifier

**Response**: `200 OK`

```json
{
  "data": {
    "products": [
      {
        "id": "prod_abc123",
        "name": "Pro Plan",
        "description": "Advanced features for growing teams",
        "prices": [
          {
            "id": "price_xyz789",
            "amount": 2900,
            "currency": "usd",
            "interval": "month",
            "serviceId": "pro-monthly"
          }
        ]
      }
    ],
    "subscriptions": [
      {
        "id": "sub_abc123",
        "customerId": "cus_xyz789",
        "active": true,
        "startDate": "2024-01-01T00:00:00.000Z",
        "endDate": "2024-02-01T00:00:00.000Z",
        "product": {},
        "price": {}
      }
    ]
  }
}
```

### Create Checkout Session

Create a Stripe checkout session for subscription.

**Endpoint**: `POST /api/teams/{slug}/payments/create-checkout-session`  
**Authentication**: Session required  
**Permissions**: Team member

**Parameters**:

- `slug` (path) - Team slug identifier

**Request Body**:

```json
{
  "price": "string (Stripe price ID, required)",
  "quantity": "number (optional, default: 1)"
}
```

**Response**: `200 OK`

```json
{
  "data": {
    "url": "https://checkout.stripe.com/pay/..."
  }
}
```

### Create Portal Link

Create a Stripe customer portal link for subscription management.

**Endpoint**: `POST /api/teams/{slug}/payments/create-portal-link`  
**Authentication**: Session required  
**Permissions**: Team member

**Parameters**:

- `slug` (path) - Team slug identifier

**Response**: `200 OK`

```json
{
  "data": {
    "url": "https://billing.stripe.com/session/..."
  }
}
```

---

## User Management

### Update User Profile

Update the authenticated user's profile information.

**Endpoint**: `PUT /api/users`  
**Authentication**: Session required

**Request Body**:

```json
{
  "name": "string (max 104 chars, optional)",
  "email": "string (valid email, optional, if email change allowed)",
  "image": "string (base64 data URL, max 2MB, optional)"
}
```

**Response**: `204 No Content`

### Update Password

Update the authenticated user's password.

**Endpoint**: `PUT /api/password`  
**Authentication**: Session required

**Request Body**:

```json
{
  "currentPassword": "string (min 8 chars, required)",
  "newPassword": "string (min 8 chars, max 70 chars, required)"
}
```

**Response**: `200 OK`

```json
{}
```

**Notes**:

- Validates current password before update
- Invalidates all other user sessions
- Updates password with bcrypt hash

---

## Session Management

### List User Sessions

Get all active sessions for the authenticated user.

**Endpoint**: `GET /api/sessions`  
**Authentication**: Session required

**Response**: `200 OK`

```json
{
  "data": [
    {
      "id": "clm123session",
      "sessionToken": "session_token_hash",
      "expires": "2024-01-15T00:00:00.000Z",
      "isCurrent": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Delete Session

Delete a specific session (logout from device).

**Endpoint**: `DELETE /api/sessions/{id}`  
**Authentication**: Session required

**Parameters**:

- `id` (path) - Session ID

**Response**: `200 OK`

```json
{}
```

---

## Invitations

### Get Invitation Details

Get details for a specific invitation token.

**Endpoint**: `GET /api/invitations/{token}`

**Parameters**:

- `token` (path) - Invitation token

**Response**: `200 OK`

```json
{
  "data": {
    "id": "clm999inv",
    "email": "invited@example.com",
    "role": "ADMIN",
    "team": {
      "id": "clm123team",
      "name": "Acme Corporation",
      "slug": "acme-corp"
    },
    "expires": "2024-01-08T00:00:00.000Z"
  }
}
```

### Accept Invitation

Accept a team invitation.

**Endpoint**: `POST /api/invitations/{token}`  
**Authentication**: Session required

**Parameters**:

- `token` (path) - Invitation token

**Request Body**:

```json
{
  "inviteToken": "string (required)"
}
```

**Response**: `200 OK`

```json
{
  "data": {
    "team": {
      "id": "clm123team",
      "name": "Acme Corporation",
      "slug": "acme-corp"
    }
  }
}
```

---

## System Endpoints

### Health Check

Check system health and version.

**Endpoint**: `GET /api/health`

**Response**: `200 OK`

```json
{
  "version": "1.0.0"
}
```

### Hello Endpoint

Simple test endpoint.

**Endpoint**: `GET /api/hello`

**Response**: `200 OK`

```json
{
  "message": "Hello from SaaS Starter Kit!"
}
```

---

## Webhook Receivers

### Stripe Webhook

Receive Stripe webhook events for payment processing.

**Endpoint**: `POST /api/webhooks/stripe`  
**Authentication**: Stripe webhook signature

**Supported Events**:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**Response**: `200 OK`

```json
{
  "received": true
}
```

### Directory Sync Webhook

Receive directory sync webhook events from identity providers.

**Endpoint**: `POST /api/webhooks/dsync`  
**Authentication**: Jackson webhook signature

**Supported Events**:

- User provisioning/deprovisioning
- Group membership changes
- Profile updates

**Response**: `200 OK`

```json
{
  "received": true
}
```

---

## SCIM Directory Sync

### SCIM Users Endpoint

SCIM 2.0 endpoint for user management.

**Endpoint**: `ALL /api/scim/v2.0/{directoryId}/Users`  
**Authentication**: API secret in Authorization header

**Methods**: GET, POST, PUT, PATCH, DELETE

**Query Parameters**:

- `count` (number) - Number of results per page
- `startIndex` (number) - Starting index for pagination
- `filter` (string) - SCIM filter expression

**Example GET Response**:

```json
{
  "schemas": ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
  "totalResults": 2,
  "startIndex": 1,
  "itemsPerPage": 2,
  "Resources": [
    {
      "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
      "id": "user123",
      "userName": "john.doe@example.com",
      "name": {
        "givenName": "John",
        "familyName": "Doe"
      },
      "emails": [
        {
          "value": "john.doe@example.com",
          "primary": true
        }
      ],
      "active": true
    }
  ]
}
```

### SCIM Groups Endpoint

SCIM 2.0 endpoint for group management.

**Endpoint**: `ALL /api/scim/v2.0/{directoryId}/Groups`  
**Authentication**: API secret in Authorization header

**Methods**: GET, POST, PUT, PATCH, DELETE

**Query Parameters**:

- `count` (number) - Number of results per page
- `startIndex` (number) - Starting index for pagination
- `filter` (string) - SCIM filter expression

---

## Rate Limiting

API endpoints have rate limiting applied:

- **Authentication endpoints**: 5 requests per 15 minutes per email
- **General API endpoints**: 60 requests per minute per IP/API key
- **Webhook endpoints**: No rate limiting

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 2024-01-01T00:01:00.000Z
```

## Examples

### Complete Team Setup Workflow

```bash
# 1. Create team
curl -X POST http://localhost:4002/api/teams \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"name": "Acme Corporation"}'

# 2. Create API key
curl -X POST http://localhost:4002/api/teams/acme-corp/api-keys \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"name": "Production API Key"}'

# 3. Create webhook
curl -X POST http://localhost:4002/api/teams/acme-corp/webhooks \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "name": "Member Events",
    "url": "https://api.example.com/webhooks",
    "eventTypes": ["member.created", "member.removed"]
  }'

# 4. Invite team member
curl -X POST http://localhost:4002/api/teams/acme-corp/invitations \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "email": "user@example.com",
    "role": "ADMIN",
    "sentViaEmail": true
  }'
```

### Using API Key for External Integration

```bash
# Get team members using API key
curl -X GET http://localhost:4002/api/teams/acme-corp/members \
  -H "Authorization: Bearer sk_test_your_api_key_here" \
  -H "Content-Type: application/json"

# Create webhook using API key
curl -X POST http://localhost:4002/api/teams/acme-corp/webhooks \
  -H "Authorization: Bearer sk_test_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Integration Webhook",
    "url": "https://external-api.com/webhook",
    "eventTypes": ["member.created"]
  }'
```

---

## SDK and Client Libraries

While there are no official SDKs yet, you can easily create HTTP clients for any language:

### JavaScript/TypeScript Example

```typescript
class SaasKitClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async getTeamMembers(teamSlug: string) {
    return this.request(`/api/teams/${teamSlug}/members`);
  }

  async createWebhook(teamSlug: string, webhook: any) {
    return this.request(`/api/teams/${teamSlug}/webhooks`, {
      method: 'POST',
      body: JSON.stringify(webhook),
    });
  }
}

// Usage
const client = new SaasKitClient('http://localhost:4002', 'sk_test_...');
const members = await client.getTeamMembers('acme-corp');
```

### Python Example

```python
import requests
from typing import Dict, Any

class SaasKitClient:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        })

    def get_team_members(self, team_slug: str) -> Dict[str, Any]:
        response = self.session.get(f'{self.base_url}/api/teams/{team_slug}/members')
        response.raise_for_status()
        return response.json()

    def create_webhook(self, team_slug: str, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        response = self.session.post(
            f'{self.base_url}/api/teams/{team_slug}/webhooks',
            json=webhook_data
        )
        response.raise_for_status()
        return response.json()

# Usage
client = SaasKitClient('http://localhost:4002', 'sk_test_...')
members = client.get_team_members('acme-corp')
```

This API reference provides comprehensive documentation for integrating with the SaaS Starter Kit platform.
