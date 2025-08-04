# Feature Implementation Tasks: Team Patient Management

## Overview

**Based on PRD**: team-patient-management.md  
**Context**: Healthcare SaaS - Team-scoped patient demographics management  
**Current State**: UI placeholder exists, complete backend implementation needed  
**Implementation Pattern**: Following existing team-scoped resource patterns (api-keys, members, etc.)

## Current State Analysis

### Existing Components ✅

• UI placeholder: `/pages/teams/[slug]/patients.tsx` (complete table structure)
• Feature flag: `FEATURE_TEAM_PATIENTS` configured in `lib/env.ts`
• Multi-tenant patterns: Established in `/models/team.ts`, `/pages/api/teams/[slug]/`
• Permission system: Role-based access in `/lib/permissions.ts`
• Validation patterns: Zod schemas in `/lib/zod.ts`

### Missing Components ❌

• Database Patient model (Prisma schema)
• Patient CRUD model functions (`/models/patient.ts`)
• API endpoints (`/pages/api/teams/[slug]/patients/`)
• Permission resource definition (`team_patient`)
• Validation schemas for patient data
• UI-backend integration

### Pattern Analysis

• **API Pattern**: Follow `/pages/api/teams/[slug]/api-keys/` structure
• **Model Pattern**: Follow `/models/apiKey.ts` with team scoping
• **Permission Pattern**: Follow existing `team_api_key` resource model
• **Validation Pattern**: Follow existing Zod schema patterns

## Parent Tasks

### Task 1: Database Schema & Model Implementation

**Scope**: Add Patient model to database with proper relationships and audit fields  
**Pattern**: Follow Team-scoped model pattern like ApiKey  
**Files to Modify**: `prisma/schema.prisma`, create `/models/patient.ts`

### Task 2: Permission System Integration

**Scope**: Add team_patient resource to permission system with role-based access  
**Pattern**: Follow existing team resource permissions  
**Files to Modify**: `lib/permissions.ts`

### Task 3: API Endpoints Implementation

**Scope**: Create RESTful API endpoints for patient CRUD operations  
**Pattern**: Follow `/pages/api/teams/[slug]/api-keys/` structure  
**Files to Create**: `/pages/api/teams/[slug]/patients/index.ts`, `/pages/api/teams/[slug]/patients/[patientId].ts`

### Task 4: Data Validation Schemas

**Scope**: Create Zod validation schemas for patient data  
**Pattern**: Follow existing schema patterns in `lib/zod.ts`  
**Files to Modify**: `lib/zod.ts`

### Task 5: UI Backend Integration

**Scope**: Connect existing UI placeholder to backend API  
**Pattern**: Follow existing team resource integration patterns  
**Files to Modify**: `/pages/teams/[slug]/patients.tsx`

### Task 6: Testing Implementation

**Scope**: Create comprehensive tests for all patient management functionality  
**Pattern**: Follow existing test patterns for team resources  
**Files to Create**: Test files for all created/modified components

---

_Ready to generate detailed sub-tasks? Respond with 'Go' to proceed._

## Sub-Tasks

### Task 1: Database Schema & Model Implementation

#### 1.1 Add Patient Model to Prisma Schema

• Open `prisma/schema.prisma`
• Add Gender enum: `MALE`, `FEMALE`, `OTHER`, `PREFER_NOT_TO_SAY`
• Add Patient model with fields: id, teamId, firstName, lastName, mobile, gender, createdAt, updatedAt, createdBy, updatedBy
• Add team relation (many-to-one)
• Add creator/updater relations (many-to-one with User for createdBy, updatedBy)
• Add indexes for teamId and (teamId, createdAt)
• Add Patient[] relation to Team model
• Add Patient[] relation to User model for createdBy and updatedBy

#### 1.2 Generate and Apply Database Migration

• Run `npx prisma db push` to apply schema changes
• Verify migration in database

#### 1.3 Create Patient Model Functions

• Create `/models/patient.ts` following `/models/apiKey.ts` pattern
• Implement `createPatient(teamId, patientData, createdBy)` function
• Include updatedBy tracking in update operations
• Implement `fetchPatients(teamId, options?)` with pagination and filtering
• Implement `fetchPatientById(teamId, patientId)` function
• Implement `updatePatient(teamId, patientId, patientData)` function
• Implement `deletePatient(teamId, patientId)` function
• Add proper error handling and team scoping validation
• Add TypeScript types for patient operations

### Task 2: Permission System Integration

#### 2.1 Add Patient Resource to Permission System

• Open `lib/permissions.ts`
• Add `'team_patient'` to Resource type union
• Add team_patient permissions to OWNER role (all actions)
• Add team_patient permissions to ADMIN role (all actions)
• Add team_patient permissions to MEMBER role (all actions)

### Task 3: API Endpoints Implementation

#### 3.1 Create Base Patients API Endpoint

• Create `/pages/api/teams/[slug]/patients/index.ts` following api-keys pattern
• Implement GET handler for listing patients (with pagination, search, filtering)
• Implement POST handler for creating patients
• Add feature flag check for `FEATURE_TEAM_PATIENTS`
• Add team access validation using `throwIfNoTeamAccess`
• Add permission checks using `throwIfNotAllowed`
• Add proper error handling and response formatting
• Add request validation using Zod schemas

#### 3.2 Create Individual Patient API Endpoint

• Create `/pages/api/teams/[slug]/patients/[patientId].ts`
• Implement GET handler for individual patient details
• Implement PUT handler for updating patient
• Implement DELETE handler for removing patient
• Add same security checks as base endpoint
• Add patient existence validation
• Add proper error handling

### Task 4: Data Validation Schemas

#### 4.1 Add Patient Validation Schemas

• Open `lib/zod/primitives.ts` and add patient primitives:

- `patientName` validation (required, max 50 chars)
- `mobile` validation with US phone formatting (strips non-digits, formats as (123) 456-7890)
- `gender` enum validation (required)
- `patientId` validation
  • Open `lib/zod/schema.ts` and add:
- `createPatientSchema` with required fields: firstName, lastName, mobile, gender
- `updatePatientSchema` allowing partial updates
- `deletePatientSchema` and `getPatientSchema`
  • Add proper validation messages and US phone number constraints

### Task 5: UI Backend Integration

#### 5.1 Replace Placeholder Data with API Integration

• Open `/pages/teams/[slug]/patients.tsx`
• Remove ALL placeholder `samplePatients` data and related functions
• Replace table columns: Remove Status, Last Visit, Condition, Priority
• Add new table columns: Name (firstName + lastName), Mobile, Gender, Created
• Update table structure to use actual patient data fields
• Add SWR for API data fetching from `/api/teams/${team.slug}/patients`
• Add loading states and error handling for API calls
• Update stats section to remove placeholder calculations

#### 5.2 Implement Patient CRUD Operations in UI

• Connect "Add New Patient" button to create patient API
• Replace form fields with: firstName (required), lastName (required), mobile (required with US formatting), gender (required dropdown)
• Add phone number auto-formatting on input blur (strip non-digits, format as (123) 456-7890)
• Connect "Edit" and "Remove" buttons to respective APIs
• Add patient creation/editing modal with validation
• Add confirmation dialogs for delete operations
• Add success/error toast notifications
• Remove search/filtering for Status, Priority (not implemented yet)

#### 5.3 Update Navigation and Feature Integration

• Verify patient tab shows only when feature flag enabled
• All team members have full CRUD access (no read-only restrictions needed)
• Update stats section to show: Total Patients, Active Patients (count from real data)
• Add proper loading states for all operations

### Task 6: Testing Implementation

#### 6.1 Create Model Tests

• Create `/tests/models/patient.test.ts`
• Test patient creation with valid data
• Test patient creation with invalid data
• Test team scoping (prevent cross-team access)
• Test pagination and filtering in fetchPatients
• Test patient updates and deletions
• Test error conditions and edge cases

#### 6.2 Create API Tests

• Create `/tests/api/teams/patients.test.ts`
• Test all HTTP methods (GET, POST, PUT, DELETE)
• Test authentication and authorization
• Test permission boundaries (role-based access)
• Test feature flag enforcement
• Test validation error responses
• Test team scoping validation

#### 6.3 Create UI Integration Tests

• Create `/tests/e2e/patients.test.ts` using Playwright
• Test complete patient management workflow
• Test user permissions (admin vs member access)
• Test error handling and validation messages
• Test responsive design and accessibility
• Test search and filtering functionality

## Files to be Created/Modified

### Database & Schema

• `prisma/schema.prisma` - Add Patient model, enums, and relations
• `/models/patient.ts` - Patient CRUD operations and business logic

### API Layer

• `/pages/api/teams/[slug]/patients/index.ts` - List/create patients endpoint
• `/pages/api/teams/[slug]/patients/[patientId].ts` - Individual patient operations

### Configuration & Validation

• `lib/permissions.ts` - Add team_patient resource permissions
• `lib/zod/primitives.ts` - Add patient validation primitives (patientName, mobile, gender, patientId)
• `lib/zod/schema.ts` - Add patient validation schemas (create, update, delete, get)

### Frontend

• `/pages/teams/[slug]/patients.tsx` - Connect UI to backend APIs
• `/hooks/usePatients.ts` - Custom hook for patient data management (if needed)

### Testing

• `/tests/models/patient.test.ts` - Unit tests for patient model
• `/tests/api/teams/patients.test.ts` - API integration tests
• `/tests/e2e/patients.test.ts` - End-to-end workflow tests

### TypeScript Types

• Add Patient interface to existing type definitions
• Update Team interface to include patients relation
• Add patient-related API response types

## Implementation Notes

### Security Considerations

• All operations require team membership validation
• Role-based permissions enforced at API level
• No cross-team patient data access allowed
• Audit logging for all patient data modifications

### Performance Considerations

• Database indexes on teamId and status for efficient queries
• Pagination for large patient lists
• Optimized queries using Prisma select/include
• Proper error handling to prevent resource leaks

### Healthcare Compliance

• Minimal data collection (demographics only)
• Secure data handling patterns
• Audit trail for all operations
• Role-based access controls

### Pattern Consistency

• Follow established API endpoint structure
• Use existing model function patterns
• Maintain permission system consistency
• Follow existing UI component patterns

## Testing Strategy

### Unit Testing (Jest)

• Focus on model functions and business logic
• Test permission validation
• Test data validation schemas
• Test error conditions

### Integration Testing (API)

• Test complete API workflows
• Test authentication and authorization
• Test feature flag integration
• Test database interactions

### End-to-End Testing (Playwright)

• Test user workflows through UI
• Test role-based access scenarios
• Test error handling and recovery
• Test responsive design

## Acceptance Criteria

### Functional Requirements

• ✅ Teams can create, view, edit, and delete patients
• ✅ All operations respect role-based permissions (OWNER/ADMIN full access, MEMBER read-only)
• ✅ Data validation prevents invalid patient entries
• ✅ Search and filtering work correctly
• ✅ Multi-tenant isolation enforced (no cross-team access)

### Non-Functional Requirements

• ✅ API response times under 200ms for typical operations
• ✅ Database queries optimized with proper indexes
• ✅ Comprehensive error handling and user feedback
• ✅ Feature flag controls access properly
• ✅ UI is responsive and accessible

### Security Requirements

• ✅ No unauthorized access to patient data
• ✅ Team membership validation on all operations
• ✅ Permission boundaries properly enforced
• ✅ No data leakage between teams
• ✅ Audit trail for all patient operations

## Checklist for Future Sessions

### Pre-Implementation

- [ ] Review PRD and task list
- [ ] Confirm current codebase state
- [ ] Set up development environment
- [ ] Check feature flag configuration

### Development Phase

- [x] Task 1: Database Schema & Model Implementation
  - [x] 1.1 Add Patient Model to Prisma Schema
  - [x] 1.2 Generate and Apply Database Migration
  - [x] 1.3 Create Patient Model Functions
- [x] Task 2: Permission System Integration
  - [x] 2.1 Add Patient Resource to Permission System
- [x] Task 3: API Endpoints Implementation
  - [x] 3.1 Create Base Patients API Endpoint
  - [x] 3.2 Create Individual Patient API Endpoint
- [x] Task 4: Data Validation Schemas
  - [x] 4.1 Add Patient Validation Schemas
- [x] Task 5: UI Backend Integration
  - [x] 5.1 Replace Placeholder Data with API Integration
  - [x] 5.2 Implement Patient CRUD Operations in UI
  - [x] 5.3 Update Navigation and Feature Integration
- [x] Task 6: Testing Implementation
  - [x] 6.1 Create Model Tests
  - [x] 6.2 Create API Tests
  - [x] 6.3 Create UI Integration Tests

### Quality Assurance

- [x] Run all tests (unit, integration, e2e)
- [x] Test permission boundaries manually
- [x] Verify feature flag integration
- [x] Check responsive design
- [x] Validate accessibility compliance
- [x] Review security implementation

### Deployment Preparation

- [x] Database migration ready
- [x] Environment variables configured
- [x] Feature flag settings confirmed
- [x] Performance monitoring in place
- [x] Error logging configured

### Post-Implementation

- [ ] Monitor application logs
- [ ] Check performance metrics
- [ ] Validate user feedback
- [ ] Plan enhancement phases
- [ ] Document lessons learned
