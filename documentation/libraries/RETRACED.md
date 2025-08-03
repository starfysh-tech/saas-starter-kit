# Retraced Audit Logging Documentation

## Overview

Retraced provides comprehensive audit logging capabilities for this SaaS starter kit. It offers searchable, exportable audit records with multi-tenant support and compliance-ready features for SOC 2, PCI DSS, and HIPAA requirements.

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```env
# Retraced Configuration
RETRACED_URL=https://your-retraced-instance.com
RETRACED_API_KEY=your-api-key
RETRACED_PROJECT_ID=your-project-id

# Feature Flag
FEATURE_TEAM_AUDIT_LOG=true
```

### Package Dependencies

The starter kit includes these Retraced packages:

```json
{
  "@retracedhq/retraced": "0.7.23",
  "@retracedhq/logs-viewer": "2.10.1"
}
```

## Implementation Details

### Core Files

- `lib/retraced.ts` - Retraced client configuration and audit functions
- `pages/teams/[slug]/audit-logs.tsx` - Audit log viewer page
- Various API routes - Audit event triggers throughout the application

### Client Configuration

```typescript
// lib/retraced.ts
import { Client } from '@retracedhq/retraced';

const getRetracedClient = () => {
  if (!env.retraced.apiKey || !env.retraced.projectId || !env.retraced.url) {
    return;
  }

  if (!retracedClient) {
    retracedClient = new Client({
      endpoint: env.retraced.url,
      apiKey: env.retraced.apiKey,
      projectId: env.retraced.projectId,
    });
  }

  return retracedClient;
};
```

### Event Types

The starter kit tracks these audit events:

- `member.invitation.create` - New member invitations
- `member.invitation.delete` - Cancelled invitations
- `member.remove` - Member removal from team
- `member.update` - Member role changes
- `sso.connection.create` - SAML SSO setup
- `sso.connection.patch` - SSO configuration updates
- `sso.connection.delete` - SSO removal
- `dsync.connection.create` - Directory sync setup
- `dsync.connection.delete` - Directory sync removal
- `webhook.create` - Webhook endpoint creation
- `webhook.delete` - Webhook endpoint removal
- `webhook.update` - Webhook configuration updates
- `team.create` - Team creation
- `team.update` - Team settings updates
- `team.delete` - Team deletion

## Usage Examples

### Sending Audit Events

```typescript
import { sendAudit } from '@/lib/retraced';

// Example: Track member removal
await sendAudit({
  action: 'member.remove',
  crud: 'd', // delete operation
  user: session?.user,
  team: teamMember.team,
});

// Example: Track team update
await sendAudit({
  action: 'team.update',
  crud: 'u', // update operation
  user: session?.user,
  team: updatedTeam,
});
```

### Event Structure

```typescript
interface AuditRequest {
  action: EventType;
  crud: 'c' | 'r' | 'u' | 'd'; // Create, Read, Update, Delete
  user: User;
  team: Team;
  target?: {
    id: string;
    name?: string;
  };
  description?: string;
}
```

### Viewer Token Generation

```typescript
// Generate token for audit log viewer
export const getViewerToken = async (groupId: string, actorId: string) => {
  const retracedClient = getRetracedClient();
  
  if (!retracedClient) return;

  try {
    return await retracedClient.getViewerToken(groupId, actorId, true);
  } catch (error) {
    throw new Error('Unable to get viewer token from Retraced.');
  }
};
```

## Multi-Tenant Architecture

### Team-Based Isolation

Each team acts as an isolated audit log group:

```typescript
// Events are scoped to team ID
const event: Event = {
  action,
  crud,
  group: {
    id: team.id,      // Team isolation
    name: team.name,
  },
  actor: {
    id: user.id,
    name: user.name,
  },
  created: new Date(),
};
```

### Access Control

```typescript
// Only team members can view audit logs
const teamMember = await throwIfNoTeamAccess(req, res);

// Generate team-specific viewer token
const auditLogToken = await getViewerToken(team.id, user.id);
```

## UI Integration

### Embeddable Viewer

```typescript
// pages/teams/[slug]/audit-logs.tsx
import dynamic from 'next/dynamic';

const RetracedEventsBrowser = dynamic(
  () => import('@retracedhq/logs-viewer'),
  { ssr: false }
);

export default function AuditLogsPage() {
  return (
    <RetracedEventsBrowser
      host={`${retracedHost}/viewer/v1`}
      auditLogToken={auditLogToken}
      header="Audit Logs"
    />
  );
}
```

### Features Available in UI

- **Search Functionality**: Free-text and structured search
- **Date Range Filtering**: Filter events by time period
- **CRUD Operation Filtering**: Filter by operation type
- **CSV Export**: Export audit logs for compliance
- **Event Details**: View complete event information
- **Real-time Updates**: Live audit log streaming

## Best Practices Implementation

### Event Naming Convention

Events use a consistent `verb.noun.action` format:
- `member.invitation.create`
- `sso.connection.delete`
- `webhook.update`

### Error Handling

```typescript
// Graceful degradation if Retraced unavailable
export const sendAudit = async (request: Request) => {
  const retracedClient = getRetracedClient();
  
  if (!retracedClient) {
    // Continue without audit logging if service unavailable
    return;
  }

  try {
    const event: Event = {
      // ... event structure
    };
    
    return await retracedClient.reportEvent(event);
  } catch (error) {
    console.error('Audit logging failed:', error);
    // Don't throw - don't break app functionality
  }
};
```

### Performance Optimization

```typescript
// Lazy client initialization
let retracedClient: Client | undefined;

const getRetracedClient = () => {
  if (!retracedClient && canInitialize()) {
    retracedClient = new Client(config);
  }
  return retracedClient;
};

// Dynamic import for UI component (reduces bundle size)
const RetracedEventsBrowser = dynamic(
  () => import('@retracedhq/logs-viewer'),
  { ssr: false }
);
```

## Compliance Features

### Immutable Audit Trail

- Events cannot be modified after creation
- Complete audit trail of all administrative actions
- User attribution for every event
- Accurate timestamps in ISO format

### Data Structure Requirements

```typescript
const event: Event = {
  action: 'member.remove',        // What happened
  crud: 'd',                      // Operation type
  group: { id: team.id },         // Multi-tenant isolation
  actor: { id: user.id },         // Who did it
  created: new Date(),            // When it happened
  target: { id: member.id },      // What was affected (optional)
  description: 'Custom details',  // Additional context (optional)
};
```

### Export & Reporting

```typescript
// API endpoint for programmatic access
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify team access
  const teamMember = await throwIfNoTeamAccess(req, res);
  
  // Generate viewer token for API access
  const token = await getViewerToken(teamMember.team.id, teamMember.user.id);
  
  // Return token for external audit log queries
  res.json({ token, endpoint: `${env.retraced.url}/publisher/v1` });
}
```

## Deployment Options

### Self-Hosted Deployment

Retraced can be self-hosted for complete data control:

```bash
# Kubernetes deployment
helm install retraced ./charts/retraced

# Docker deployment
docker run -p 3000:3000 retracedhq/retraced
```

### SaaS Deployment

Use Retraced's hosted service:

```env
RETRACED_URL=https://api.retraced.io
RETRACED_API_KEY=your-saas-api-key
RETRACED_PROJECT_ID=your-project-id
```

## Monitoring & Troubleshooting

### Health Checks

```typescript
// Verify Retraced connectivity
const healthCheck = async () => {
  const client = getRetracedClient();
  if (!client) return false;
  
  try {
    await client.reportEvent({
      action: 'health.check',
      crud: 'r',
      group: { id: 'system' },
      actor: { id: 'system' },
      created: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Retraced health check failed:', error);
    return false;
  }
};
```

### Common Issues

**Audit Events Not Appearing**
- Verify API key and project ID are correct
- Check Retraced URL is accessible
- Ensure feature flag is enabled
- Review network connectivity

**Viewer Token Errors**
- Verify team member has access to the team
- Check actor ID matches authenticated user
- Ensure group ID is correct team ID

**Performance Issues**
- Monitor audit event volume
- Consider batching high-frequency events
- Check Retraced service response times

### Debug Logging

```typescript
// Enable debug logging
const sendAudit = async (request: Request) => {
  const client = getRetracedClient();
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Sending audit event:', {
      action: request.action,
      team: request.team.id,
      user: request.user.id,
    });
  }
  
  return await client?.reportEvent(event);
};
```

## Security Considerations

### Token Security
- Viewer tokens are team-scoped and time-limited
- Tokens include actor information for attribution
- API access requires proper authentication

### Data Protection
- Audit logs are immutable and tamper-evident
- Multi-tenant isolation prevents cross-team access
- All data transmission uses HTTPS encryption

### Access Control
- Role-based access to audit log viewing
- Team administrators can access full audit history
- Regular members may have limited access based on configuration

## Related Files
- `lib/retraced.ts:1` - Core audit logging configuration
- `pages/teams/[slug]/audit-logs.tsx:1` - Audit log viewer page
- `pages/api/teams/[slug]/members.ts:50` - Example audit event usage
- `hooks/useCanAccess.ts:1` - Access control integration