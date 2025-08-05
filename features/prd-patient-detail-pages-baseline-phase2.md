# PRD: Patient Detail Pages with Clinical Baseline Data - Phase 2 Clinical Forms

## Overview

**Feature Name**: Patient Detail Pages with Clinical Baseline Data - Phase 2 Clinical Forms  
**Context**: Building on Phase 1 foundation to implement comprehensive clinical data entry forms  
**Timeline**: Week 3-4 Clinical Forms Implementation  
**Dependencies**: Phase 1 foundation (PatientBaseline model, API endpoints, patient detail pages)

## Problem Statement

Phase 1 established the foundational architecture for patient detail pages and baseline data storage, but the clinical workflow still lacks:

• Complex form components for clinical data entry (checkboxes with severity, cascading selects)
• Team-specific form configurations to support different clinical specialties
• Comprehensive baseline assessment forms with proper validation
• Integration between clinical forms and the existing baseline API endpoints
• Dynamic form generation based on team specialization (oncology, cardiology, etc.)

Phase 2 focuses on creating the clinical form components and team-specific configuration system to enable meaningful clinical data collection.

## User Stories

### Primary Users

• **Clinical Staff**: Nurses, physicians, clinical coordinators who need to record detailed clinical assessments
• **Team Administrators**: Admin-level users who configure team-specific clinical forms
• **Oncology Teams**: Specialized workflows for cancer patient assessments
• **Cardiology Teams**: Specialized workflows for cardiac patient assessments

### Core User Stories

1. **As a clinical staff member**, I want to record patient symptoms with severity levels so that I can track symptom progression and treatment response accurately.

2. **As a clinical staff member**, I want to use cascading dropdown menus for treatment information so that I can efficiently select from relevant options based on previous selections.

3. **As an oncology team member**, I want access to oncology-specific assessment forms (staging, ECOG status, IMWG criteria) so that I can capture cancer-specific clinical data.

4. **As a cardiology team member**, I want access to cardiology-specific assessment forms (NYHA class, ejection fraction, arrhythmias) so that I can capture cardiac-specific clinical data.

5. **As a team administrator**, I want to configure which clinical forms and fields are available to my team so that the interface matches our clinical specialty and workflow requirements.

6. **As a clinical staff member**, I want form validation and error handling so that I can be confident the data I'm entering is complete and accurate.

7. **As a clinical staff member**, I want to save draft assessments and return to complete them later so that I can manage interruptions in clinical workflow.

## Technical Requirements

### Core Form Components

#### 1. CheckboxWithSeverity Component

**Requirement**: Checkbox component with integrated severity scale selection

**Features**:

- Checkbox selection with immediate severity scale activation
- 4-level severity scale (Mild, Moderate, Severe, Very Severe)
- Visual indicators for severity levels with color coding
- Support for required validation and custom labels
- Integration with React Hook Form

**Use Cases**:

- Symptom assessment (fatigue, pain, nausea with severity)
- Side effect tracking with intensity levels
- Quality of life indicators

#### 2. CascadingSelect Component

**Requirement**: Dependent dropdown selection component

**Features**:

- Parent-child dropdown relationships
- Dynamic option loading based on parent selection
- Support for multi-level cascading (3+ levels)
- Loading states during option fetching
- Clear dependent selections when parent changes
- Integration with React Hook Form

**Use Cases**:

- Treatment selection: Category → Specific Treatment → Dosage
- Medical history: System → Condition → Severity
- Medication selection: Class → Drug → Strength

#### 3. BaselineAssessmentForm Component

**Requirement**: Main clinical data entry form with team-specific configuration

**Features**:

- Dynamic form generation based on team configuration
- Section-based organization (demographics, symptoms, treatments, measurements)
- Form state management with draft saving capability
- Comprehensive validation using Zod schemas
- Success/error notifications with user feedback
- Loading states and progress indicators

### Team Configuration System

#### 4. Team Form Configuration Model

**Requirement**: Database model for team-specific form configurations

**Schema Extension**:

```sql
-- Team form configuration
CREATE TABLE TeamFormConfig (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES Team(id) ON DELETE CASCADE,
  form_type VARCHAR(50) NOT NULL, -- 'baseline_assessment'
  config JSONB NOT NULL, -- Form configuration data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES User(id),
  updated_by UUID NOT NULL REFERENCES User(id),

  UNIQUE(team_id, form_type)
);
```

**Configuration Structure**:

```typescript
interface BaselineFormConfig {
  sections: {
    demographics: boolean;
    symptoms: {
      enabled: boolean;
      items: SymptomConfig[];
    };
    treatments: {
      enabled: boolean;
      cascading_options: CascadingOption[];
    };
    clinical_measurements: {
      enabled: boolean;
      items: MeasurementConfig[];
    };
    performance_status: {
      enabled: boolean;
      scale_type: 'ecog' | 'karnofsky' | 'nyha';
    };
  };
}
```

#### 5. Specialty-Specific Configurations

**Requirement**: Pre-built configurations for clinical specialties

**Oncology Configuration**:

- Stage assessment (RSS I/II/III radio buttons)
- ECOG Performance Status (0-4 dropdown with descriptions)
- Co-morbidities (checkbox group with multiple selections)
- Risk Stratification by IMWG Criteria (checkbox group)
- Line of Treatment (radio buttons: Front-line, On/Off treatment)
- Symptom assessment with severity (fatigue, nausea, pain, etc.)

**Cardiology Configuration**:

- NYHA Functional Class (I-IV with descriptions)
- Ejection Fraction percentage input
- Arrhythmia types (checkbox group)
- Cardiac medications with dosing
- Exercise tolerance assessment
- Symptom assessment (chest pain, shortness of breath, palpitations)

### API Extensions

#### 6. Team Configuration Endpoints

```
GET /api/teams/[slug]/form-config/baseline - Get team baseline form configuration
PUT /api/teams/[slug]/form-config/baseline - Update team baseline form configuration
POST /api/teams/[slug]/form-config/baseline/reset - Reset to specialty default
```

#### 7. Enhanced Baseline Endpoints

```
POST /api/teams/[slug]/patients/[patientId]/baseline/draft - Save draft assessment
GET /api/teams/[slug]/patients/[patientId]/baseline/draft - Get draft assessment
DELETE /api/teams/[slug]/patients/[patientId]/baseline/draft - Clear draft assessment
```

### Data Validation & Processing

#### 8. Zod Schema Validation

**Requirement**: Comprehensive validation schemas for clinical data

**Features**:

- Dynamic schema generation based on team configuration
- Clinical data type validation (numeric ranges, required fields)
- Cross-field validation (symptom severity requires symptom selection)
- Custom validation messages for clinical context

#### 9. Clinical Data Processing

**Requirement**: Specialized processing for clinical data types

**Features**:

- Severity score calculations and trending
- Clinical decision support rules (alerts for concerning values)
- Data normalization for different measurement units
- Audit trail for all clinical data modifications

## Implementation Plan

### Week 3: Core Form Components

**Days 1-2: CheckboxWithSeverity Component**

- Create component with severity scale integration
- Implement visual design with color coding
- Add React Hook Form integration
- Create comprehensive test suite

**Days 3-4: CascadingSelect Component**

- Implement parent-child dropdown logic
- Add loading states and error handling
- Create flexible configuration system
- Test with sample clinical data sets

**Days 5-7: Team Configuration System**

- Create TeamFormConfig database model
- Implement configuration API endpoints
- Build configuration management interface
- Create oncology and cardiology default configs

### Week 4: Form Integration & Testing

**Days 1-3: BaselineAssessmentForm Component**

- Build main form component with section organization
- Integrate CheckboxWithSeverity and CascadingSelect components
- Implement dynamic form generation from team config
- Add form state management and draft saving

**Days 4-5: API Integration & Validation**

- Connect forms to baseline API endpoints
- Implement comprehensive Zod validation schemas
- Add success/error notification system
- Test end-to-end clinical workflows

**Days 6-7: Testing & Refinement**

- Comprehensive testing of all form components
- User acceptance testing with clinical scenarios
- Performance optimization for large forms
- Documentation and deployment preparation

## Success Metrics

### Functional Metrics

- ✅ CheckboxWithSeverity component handles symptom + severity data entry
- ✅ CascadingSelect component supports 3-level treatment selection hierarchies
- ✅ BaselineAssessmentForm generates different forms for oncology vs cardiology teams
- ✅ Team administrators can configure form fields for their clinical specialty
- ✅ Clinical staff can save draft assessments and resume later
- ✅ All clinical data passes validation before submission

### Technical Metrics

- ✅ Form components integrate seamlessly with React Hook Form
- ✅ Zod validation prevents invalid clinical data submission
- ✅ API endpoints handle team-scoped form configurations correctly
- ✅ Database schema supports flexible clinical data storage
- ✅ Draft saving works reliably without data loss

### User Experience Metrics

- ✅ Clinical forms load and render within 2 seconds
- ✅ Form validation provides clear, actionable error messages
- ✅ Cascading selects respond immediately to parent selection changes
- ✅ Severity scales provide intuitive visual feedback
- ✅ Forms support both mouse and keyboard navigation

## Technical Risks & Mitigations

### Risk 1: Complex Form State Management

**Mitigation**: Use React Hook Form with controlled components and comprehensive testing

### Risk 2: Team Configuration Complexity

**Mitigation**: Start with two well-defined specialty configurations (oncology, cardiology) before expanding

### Risk 3: Clinical Data Validation Complexity

**Mitigation**: Implement incremental validation with clear error boundaries and fallbacks

### Risk 4: Performance with Large Forms

**Mitigation**: Implement form section lazy loading and optimize rendering with React.memo

## Dependencies & Assumptions

### Dependencies

- Phase 1 foundation (PatientBaseline model, API endpoints, patient detail pages)
- Existing permission system and team-scoped security
- React Hook Form and Zod validation libraries
- Current UI component library (daisyUI)

### Assumptions

- Clinical staff are familiar with the terminology used in specialty forms
- Team administrators have authority to configure clinical forms
- Clinical data entry will be primarily desktop/tablet based
- Integration with external clinical systems is not required in Phase 2

## Future Considerations

### Phase 3: Advanced Clinical Features

- Patient reported outcome (PRO) questionnaires
- Clinical decision support rules and alerts
- Trending and analytics for baseline data
- Integration with external EHR systems

### Phase 4: Enhanced User Experience

- Mobile-optimized clinical forms
- Voice-to-text data entry capabilities
- Bulk patient assessment workflows
- Advanced clinical reporting and dashboards

This PRD establishes the comprehensive clinical form capabilities needed to transform the baseline patient data system into a fully functional clinical assessment platform, while maintaining the flexibility to support different medical specialties and clinical workflows.
