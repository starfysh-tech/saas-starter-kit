# Team Patient Management Feature Specification

## Overview

**Feature Name**: Team Patient Management  
**Context**: Healthcare SaaS for patient reported outcome data  
**Scope**: Team-scoped patient management with HIPAA compliance considerations  
**Current State**: Fully implemented with HIPAA-compliant soft delete architecture

## Problem Statement

Healthcare teams need a secure, multi-tenant system to manage patient demographics and track patient-reported outcome data. The system has been fully implemented with:

• ✅ Database models for patient data with soft delete architecture
• ✅ API endpoints for patient operations with HIPAA compliance
• ✅ Permission system integration for role-based access control
• ✅ Data validation and security measures
• ✅ HIPAA-compliant audit trails and 7-year retention policy

## Solution Overview

Implement a complete patient management system following existing architectural patterns:

• **Database Model**: Team-scoped Patient entity with audit fields
• **API Layer**: RESTful endpoints following `/api/teams/[slug]/patients` pattern
• **Permission System**: Role-based access control for patient operations
• **UI Integration**: Connect existing UI to backend implementation
• **Compliance**: HIPAA-aware data handling and audit logging

## Current State Analysis

### Implemented Components ✅

• ✅ Complete UI implementation at `/pages/teams/[slug]/patients.tsx`
• ✅ Feature flag `FEATURE_TEAM_PATIENTS` configured and operational
• ✅ Navigation integration complete
• ✅ Multi-tenant architecture patterns established
• ✅ Database Patient model with HIPAA-compliant soft delete fields
• ✅ Patient CRUD model functions with audit tracking (`/models/patient.ts`)
• ✅ API endpoints with comprehensive validation (`/pages/api/teams/[slug]/patients/`)
• ✅ Permission system integration (`team_patient` resource)
• ✅ Validation schemas for all patient operations
• ✅ Complete backend-frontend integration with audit logging

## Technical Requirements

### Database Model

**Entity**: Patient  
**Pattern**: Team-scoped with standard audit fields  
**Fields**:

```typescript
model Patient {
  id              String   @id @default(uuid())
  teamId          String
  firstName       String
  lastName        String
  mobile          String?
  gender          Gender?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @default(now())
  createdBy       String
  updatedBy       String?
  
  // HIPAA-compliant soft delete fields
  deletedAt       DateTime?
  deletedBy       String?
  deletionReason  String?
  retentionUntil  DateTime?

  team    Team @relation(fields: [teamId], references: [id], onDelete: Cascade)
  creator User @relation("PatientCreator", fields: [createdBy], references: [id])
  updater User? @relation("PatientUpdater", fields: [updatedBy], references: [id])
  deleter User? @relation("PatientDeleter", fields: [deletedBy], references: [id])

  @@index([teamId])
  @@index([teamId, createdAt])
  @@index([teamId, deletedAt])
}

enum Gender {
  MALE
  FEMALE
  OTHER
  PREFER_NOT_TO_SAY
}
```

### Permission Model

**Resource**: `team_patient`  
**Actions**: `create`, `read`, `update`, `delete`  
**Role Access**:
• OWNER: Full access (_)
• ADMIN: Full access (_)
• MEMBER: Read-only access

### API Design

**Base Route**: `/api/teams/[slug]/patients`

**Endpoints**:
• `GET /api/teams/[slug]/patients` - List patients (paginated, excludes archived)
• `POST /api/teams/[slug]/patients` - Create patient
• `GET /api/teams/[slug]/patients/[patientId]` - Get patient details
• `PUT /api/teams/[slug]/patients/[patientId]` - Update patient
• `DELETE /api/teams/[slug]/patients/[patientId]` - Archive patient (soft delete with 7-year retention)

### Validation Schema

```typescript
const createPatientSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  mobile: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});
```

## Security & Compliance Considerations

### HIPAA Compliance

• **Data Minimization**: Collect only necessary demographics
• **Access Controls**: Role-based permissions for patient data
• **Audit Logging**: Comprehensive tracking via Retraced for all patient operations
• **Soft Delete Architecture**: 7-year retention period with automatic purging
• **Data Encryption**: Sensitive fields encrypted at rest and in transit
• **Session Management**: Secure authentication for all operations
• **Deletion Tracking**: Full audit trail for archive/restore operations
• **Retention Management**: Automated compliance with healthcare data retention requirements

### Multi-Tenant Isolation

• **Team Scoping**: All queries include team-based filtering
• **Permission Validation**: Verify user access to team before operations
• **Data Isolation**: No cross-team patient data access
• **Audit Boundaries**: Team-scoped audit logs

## Implementation Phases

### Phase 1: Core CRUD Operations (MVP)

**Scope**: Basic patient management functionality  
**Estimated Effort**: 2-3 development sessions

**Deliverables**:
• Database Patient model with migrations
• Basic CRUD model functions
• API endpoints with validation
• Permission system integration
• UI-backend connection

**Acceptance Criteria**:
• Teams can create, view, edit, and delete patients
• All operations respect role-based permissions
• Data validation prevents invalid entries
• Multi-tenant isolation enforced

### Phase 2: Enhanced Features

**Scope**: Search, filtering, and improved UX  
**Estimated Effort**: 1-2 development sessions

**Deliverables**:
• Patient search functionality
• Status and gender filtering
• Pagination improvements
• Export capabilities (if compliance allows)
• Enhanced audit logging

### Phase 3: Integration & Analytics

**Scope**: Integration with outcome tracking  
**Estimated Effort**: 2-3 development sessions

**Deliverables**:
• Patient outcome data relationships
• Reporting and analytics
• Bulk import/export
• Advanced filtering and search

## Quality Assurance

### Testing Requirements

• **Unit Tests**: Model functions and validation schemas
• **Integration Tests**: API endpoints with proper authentication
• **E2E Tests**: Complete user workflows through UI
• **Security Tests**: Permission boundary validation
• **Performance Tests**: Large patient datasets and concurrent users

### Code Quality Standards

• **TypeScript**: Strict typing for all patient-related code
• **Error Handling**: Comprehensive error responses and logging
• **Documentation**: JSDoc comments for all public functions
• **Code Review**: Peer review focusing on security and data privacy

## Migration Strategy

### Database Changes

```sql
-- Add Patient model to schema
-- Add Gender and PatientStatus enums
-- Create indexes for performance
-- Add User.patients relation
```

### Permission Updates

```typescript
// Add team_patient resource to permissions.ts
// Update role definitions to include patient access
```

### Feature Flag Integration

```typescript
// Existing FEATURE_TEAM_PATIENTS flag controls access
// No additional configuration needed
```

## Monitoring & Observability

### Metrics to Track

• Patient creation/modification rates per team
• API response times for patient operations
• Permission denial rates
• Search query performance
• Database query optimization metrics

### Logging Requirements

• **Audit Logs**: All patient data access and modifications
• **Security Logs**: Permission violations and unauthorized access attempts
• **Performance Logs**: Slow queries and high resource usage
• **Error Logs**: Application errors with proper context

## Risk Assessment

### High Risk Items

• **Data Privacy**: Patient data exposure across teams
• **Permission Bypass**: Inadequate access control validation
• **Data Integrity**: Concurrent modification conflicts
• **Performance**: Large patient datasets affecting response times

### Mitigation Strategies

• **Comprehensive Testing**: Focus on permission boundaries
• **Code Review**: Security-focused peer review process
• **Gradual Rollout**: Feature flag allows controlled deployment
• **Monitoring**: Real-time alerts for anomalies

## Dependencies

### Internal Dependencies

• Existing team membership verification
• Permission system functionality
• Audit logging infrastructure
• Database connection and ORM

### External Dependencies

• PostgreSQL database
• Prisma ORM
• NextAuth.js for authentication
• Zod for validation

## Success Metrics

### Functional Success

• Teams can manage patient records efficiently
• All CRUD operations work correctly
• Permission system prevents unauthorized access
• UI provides intuitive patient management experience

### Non-Functional Success

• API response times under 200ms for typical operations
• Database queries optimized for team-scoped access
• No cross-team data leakage incidents
• Comprehensive audit trail for compliance

## Technical Debt Considerations

### Immediate Debt

• UI placeholder needs backend integration
• Missing validation schemas
• No audit logging for patient operations

### Future Debt Prevention

• Consistent error handling patterns
• Comprehensive test coverage
• Documentation for healthcare compliance
• Performance monitoring from day one

## Conclusion

This feature specification provides a comprehensive implementation plan for team patient management, following established architectural patterns while addressing healthcare-specific requirements. The phased approach allows for iterative development and validation, with strong emphasis on security, compliance, and multi-tenant isolation.

The implementation will transform the existing UI placeholder into a fully functional patient management system, providing healthcare teams with the tools needed to securely manage patient demographics and support outcome tracking workflows.
