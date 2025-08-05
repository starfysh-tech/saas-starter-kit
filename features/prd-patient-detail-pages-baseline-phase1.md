# PRD: Patient Detail Pages with Clinical Baseline Data - Phase 1 Foundation

## Overview

**Feature Name**: Patient Detail Pages with Clinical Baseline Data Collection - Phase 1 Foundation  
**Context**: Extension of existing patient management system to support individual patient detail views and clinical baseline data collection capabilities  
**Timeline**: Week 1-2 Foundation Phase  
**Dependencies**: Existing patient management system, TeamTab navigation pattern, HIPAA-compliant architecture

## Problem Statement

The current patient management system provides basic demographics (firstName, lastName, mobile, gender) through modal-based CRUD operations but lacks:

- Individual patient detail pages for comprehensive patient views
- Clinical baseline data collection and storage capabilities
- Tab-based navigation structure for organizing different types of patient data
- Foundation for future patient reported outcomes (PRO) and clinical assessments
- Structured approach to clinical form components and validation

This Phase 1 focuses on establishing the foundational architecture needed for future clinical data features.

## User Stories

### Primary Users

- **Clinical Staff**: Nurses, physicians, clinical coordinators who need to view and manage patient data
- **Team Administrators**: Admin-level users who oversee patient data management and team configurations

### Core User Stories

1. **As a clinical staff member**, I want to navigate to individual patient detail pages so that I can view comprehensive patient information in a structured format rather than through modals.

2. **As a clinical staff member**, I want to record clinical baseline data for patients so that I can capture treatment status, symptoms, and clinical measurements in a standardized format.

3. **As a clinical staff member**, I want to navigate between different sections of patient data using tabs so that I can efficiently access specific types of information (overview, baseline data, future assessments).

4. **As a team administrator**, I want baseline data to be properly scoped to my team so that patient clinical information remains secure and compliant with HIPAA requirements.

5. **As a system user**, I want the patient detail navigation to follow familiar patterns so that the interface feels consistent with existing team management workflows.

## Technical Requirements

### Foundation Architecture

#### 1. PatientBaseline Database Model

- **Requirement**: Create PatientBaseline model with team-scoped constraints
- **Data Fields**: Treatment information, symptom assessments, clinical measurements, assessment metadata
- **HIPAA Compliance**: Soft delete architecture with 7-year retention, audit logging
- **Validation**: Team-scoped constraints ensuring patients can only have baselines within their assigned team

#### 2. Database Schema Extension

- **Requirement**: Update Prisma schema with proper relations
- **Relations**: Patient -> PatientBaseline (one-to-many), Team -> PatientBaseline, User -> PatientBaseline (multiple relations for creator, updater, assessor)
- **Indexes**: Performance indexes on patientId, teamId, assessmentDate, deletedAt
- **Constraints**: Team scope validation at database level

#### 3. Patient Detail Page Structure

- **Requirement**: Create individual patient pages following Next.js dynamic routing
- **Route Structure**: `/teams/[slug]/patients/[patientId]/index.tsx`
- **Navigation**: PatientTab component following TeamTab pattern
- **Layout**: Consistent with existing team page layouts

#### 4. PatientTab Component

- **Requirement**: Tab navigation component following TeamTab.tsx pattern
- **Tabs**: Overview (active), Baseline Data, Assessments (disabled), History (disabled)
- **Permissions**: Integrate with existing permission system using 'team_patient_baseline' resource
- **Styling**: Consistent with existing tab navigation styling

#### 5. Permission System Integration

- **Requirement**: Add 'team_patient_baseline' resource to permission system
- **Access Control**: Role-based access following existing patterns (OWNER/ADMIN/MEMBER)
- **API Security**: Team-scoped API endpoints with proper authorization

### API Design

#### Patient Detail Endpoints

```
GET /api/teams/[slug]/patients/[patientId] - Get patient with summary data
PUT /api/teams/[slug]/patients/[patientId] - Update patient demographics (existing)
DELETE /api/teams/[slug]/patients/[patientId] - Archive patient (existing)
```

#### Baseline Data Endpoints

```
GET /api/teams/[slug]/patients/[patientId]/baseline - List baseline assessments
POST /api/teams/[slug]/patients/[patientId]/baseline - Create baseline assessment
GET /api/teams/[slug]/patients/[patientId]/baseline/[baselineId] - Get specific baseline
PUT /api/teams/[slug]/patients/[patientId]/baseline/[baselineId] - Update baseline
DELETE /api/teams/[slug]/patients/[patientId]/baseline/[baselineId] - Archive baseline
```

### Component Architecture

#### 1. PatientTab Component

- **File**: `components/patient/PatientTab.tsx`
- **Pattern**: Follow TeamTab.tsx structure exactly
- **Features**: Tab navigation with active state, patient header with ID, back to patients link
- **Permissions**: Conditional tab display based on user permissions

#### 2. Patient Overview Page

- **File**: `pages/teams/[slug]/patients/[patientId]/index.tsx`
- **Content**: Patient demographics, summary statistics, recent activity
- **Layout**: Consistent with team overview pages

#### 3. Baseline Data Foundation

- **Components**: Basic structure for future baseline forms and lists
- **Validation**: Zod schemas for baseline data validation
- **Models**: Patient baseline model functions for CRUD operations

## Data Model Specifications

### PatientBaseline Model Structure

```typescript
interface PatientBaselineData {
  id: string;
  patientId: string;
  teamId: string;

  // Treatment Information (JSON fields for flexibility)
  lineOfTreatment?: {
    treatmentStatus?: string;
    currentStatus?: string;
  };
  treatmentDetails?: string;
  currentMedications: string[];

  // Symptom Assessments (JSON for complex checkbox/severity data)
  gastrointestinalSymptoms?: Record<
    string,
    { selected: boolean; severity?: number }
  >;
  neurologicalSymptoms?: Record<
    string,
    { selected: boolean; severity?: number }
  >;
  fatigueSymptoms?: Record<string, { selected: boolean; severity?: number }>;
  painAssessment?: Record<string, { selected: boolean; severity?: number }>;

  // Clinical Measurements
  performanceStatus?: number; // 0-4 scale
  weightKg?: number;
  heightCm?: number;

  // Assessment Metadata
  assessmentDate: Date;
  assessedBy: string;
  notes?: string;

  // Audit Fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;

  // HIPAA Compliance
  deletedAt?: Date;
  deletedBy?: string;
  deletionReason?: string;
  retentionUntil?: Date;
}
```

## Security & Compliance

### HIPAA Compliance Requirements

- **Soft Delete Architecture**: All baseline data uses soft delete with retention periods
- **Audit Logging**: All baseline operations logged via Retraced integration
- **Team Scoping**: Database constraints ensure data isolation between teams
- **Access Control**: Permission-based access to baseline resources

### Data Validation

- **Input Validation**: Zod schemas for all baseline data inputs
- **Team Scope Validation**: API-level checks ensuring patients belong to requesting team
- **Date Validation**: Proper date handling for assessment dates
- **Clinical Data Validation**: Appropriate ranges for clinical measurements

## Success Criteria

### Phase 1 Completion Criteria

1. **Database Foundation**

   - [ ] PatientBaseline model created with proper constraints
   - [ ] Prisma schema updated with all relations
   - [ ] Database migration successfully applied
   - [ ] Indexes created for performance optimization

2. **Navigation Structure**

   - [ ] PatientTab component implemented following TeamTab pattern
   - [ ] Patient detail pages accessible via proper routing
   - [ ] Tab navigation working with active state management
   - [ ] Back navigation to patient list functional

3. **Page Foundation**

   - [ ] Patient overview page displaying demographics and summary
   - [ ] Baseline data page structure in place (even if minimal)
   - [ ] Proper loading states and error handling
   - [ ] Responsive design consistent with existing pages

4. **Permission Integration**

   - [ ] 'team_patient_baseline' resource added to permission system
   - [ ] API endpoints properly secured with team scoping
   - [ ] Role-based access working for all baseline features
   - [ ] Permission checks integrated into UI components

5. **Code Quality**
   - [ ] All components follow existing TypeScript patterns
   - [ ] Error handling consistent with existing patterns
   - [ ] Zod validation schemas implemented
   - [ ] Model functions with proper error handling

### Technical Validation

- **Performance**: Page load times under 2 seconds for patient detail pages
- **Security**: All API endpoints return 403/404 for unauthorized access attempts
- **Compliance**: Audit logs generated for all baseline data operations
- **Usability**: Navigation intuitive to users familiar with team management interface

## Future Considerations (Out of Scope for Phase 1)

- Complex clinical form components (checkboxes with severity, cascading selects)
- Patient reported outcome (PRO) assessments
- Historical timeline and trending
- Bulk data import/export
- Advanced analytics and reporting
- Mobile-responsive clinical forms

## Development Notes

### Key Patterns to Follow

- **TeamTab Pattern**: Exact replication of navigation structure and styling
- **HIPAA Architecture**: Consistent with existing Patient model soft delete approach
- **Permission Integration**: Following existing 'team_patient' resource patterns
- **API Structure**: Consistent with existing team-scoped API patterns

### File Structure

```
components/patient/
├── PatientTab.tsx (new)
├── PatientOverview.tsx (new)
├── baseline/ (new directory for future components)
├── EditPatient.tsx (existing)
├── NewPatient.tsx (existing)
└── Patients.tsx (existing)

pages/teams/[slug]/patients/
├── index.tsx (existing - patient list)
├── [patientId]/
│   ├── index.tsx (new - overview)
│   └── baseline.tsx (new - placeholder)

models/
└── patientBaseline.ts (new)

lib/zod/
└── baseline.ts (new)
```

### Implementation Priority

1. Database schema and migration
2. PatientTab component
3. Patient detail page routing
4. Basic overview page
5. Permission system integration
6. API endpoint foundation

This Phase 1 establishes the foundational architecture needed for comprehensive patient detail pages while maintaining consistency with existing patterns and ensuring HIPAA compliance throughout.
