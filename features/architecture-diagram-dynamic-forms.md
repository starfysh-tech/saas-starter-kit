# System Architecture Diagram: Dynamic Form Templates

## Overview

This diagram shows the complete system architecture for the dynamic form template system using the hybrid EAV (Entity-Attribute-Value) storage approach.

## Database Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                DATABASE LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐                 │
│  │   FormTemplate  │    │      Team       │    │      User       │                 │
│  │─────────────────│    │─────────────────│    │─────────────────│                 │
│  │ id (PK)         │    │ id (PK)         │    │ id (PK)         │                 │
│  │ name            │    │ name            │    │ name            │                 │
│  │ category        │    │ slug            │    │ email           │                 │
│  │ description     │    │ created_at      │    │ created_at      │                 │
│  │ config (JSON)   │    │                 │    │                 │                 │
│  │ created_by ────────────────────────────────────────────────── │                 │
│  │ created_at      │    │                 │    │                 │                 │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘                 │
│          │                       │                                                  │
│          │                       │                                                  │
│          ▼                       ▼                                                  │
│  ┌─────────────────────────────────────┐                                           │
│  │         FormAssignment              │    ┌─────────────────┐                    │
│  │─────────────────────────────────────│    │  TeamMember     │                    │
│  │ id (PK)                             │    │─────────────────│                    │
│  │ template_id (FK) ──────────────────┐│    │ id (PK)         │                    │
│  │ team_id (FK) ──────────────────────┼┼────│ team_id (FK)    │                    │
│  │ version                            ││    │ user_id (FK)    │                    │
│  │ assigned_by (FK)                   ││    │ role            │                    │
│  │ active                             ││    │                 │                    │
│  │ created_at                         ││    └─────────────────┘                    │
│  └─────────────────────────────────────┘│                                           │
│                    │                    │                                           │
│                    ▼                    │                                           │
│  ┌─────────────────────────────────────┐│                                           │
│  │            Patient                  ││                                           │
│  │─────────────────────────────────────││         CORE FIELDS                      │
│  │ id (PK)                             ││       (Typed Columns)                    │
│  │ firstName                           ││                                           │
│  │ lastName                            ││                                           │
│  │ mobile                              ││                                           │
│  │ gender                              ││                                           │
│  │ form_assignment_id (FK) ────────────┘│                                           │
│  │ team_id (FK)                        │                                           │
│  │ created_by (FK)                     │                                           │
│  │ created_at                          │                                           │
│  └─────────────────────────────────────┘                                           │
│                    │                                                               │
│                    ▼                                                               │
│  ┌─────────────────────────────────────┐                                           │
│  │        PatientFieldValue            │         DYNAMIC FIELDS                    │
│  │─────────────────────────────────────│         (EAV Pattern)                    │
│  │ id (PK)                             │                                           │
│  │ patient_id (FK) ────────────────────┼───────────────┐                          │
│  │ field_name                          │               │                          │
│  │ field_value                         │               │                          │
│  │ field_type                          │               │                          │
│  │ form_assignment_id (FK)             │               │                          │
│  │ created_at                          │               │                          │
│  └─────────────────────────────────────┘               │                          │
│                                                        │                          │
│  ┌─────────────────────────────────────┐               │                          │
│  │     PatientLymphomaView            │◄──────────────┘                          │
│  │    (Materialized View)             │      ANALYTICS LAYER                      │
│  │─────────────────────────────────────│    (Optimized Queries)                   │
│  │ patient_id                          │                                           │
│  │ firstName                           │                                           │
│  │ lastName                            │                                           │
│  │ lymphoma_subtype                    │                                           │
│  │ treatment_status                    │                                           │
│  │ current_status                      │                                           │
│  └─────────────────────────────────────┘                                           │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## API Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                  API LAYER                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         TEMPLATE MANAGEMENT APIS                            │   │
│  │─────────────────────────────────────────────────────────────────────────────│   │
│  │                                                                             │   │
│  │  GET  /api/admin/form-templates          ┌─────────────────────────────┐    │   │
│  │  POST /api/admin/form-templates          │                             │    │   │
│  │  PUT  /api/admin/form-templates/[id]     │    Template Service         │    │   │
│  │  DELETE /api/admin/form-templates/[id]   │  ─────────────────────────  │    │   │
│  │                                          │  • validateTemplate()       │    │   │
│  │  POST /api/teams/[slug]/form-assignment  │  • createTemplate()         │    │   │
│  │  GET  /api/teams/[slug]/form-assignment  │  • assignToTeam()           │    │   │
│  │                                          │  • getTeamTemplate()        │    │   │
│  │                                          └─────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                     │                                               │
│                                     ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                          PATIENT DATA APIS                                 │   │
│  │─────────────────────────────────────────────────────────────────────────────│   │
│  │                                                                             │   │
│  │  GET  /api/teams/[slug]/patients         ┌─────────────────────────────┐    │   │
│  │  POST /api/teams/[slug]/patients         │                             │    │   │
│  │  PUT  /api/teams/[slug]/patients/[id]    │   Data Transformer          │    │   │
│  │  GET  /api/teams/[slug]/patients/[id]    │  ─────────────────────────  │    │   │
│  │                                          │  • transformForStorage()    │    │   │
│  │                                          │  • splitCoreAndDynamic()    │    │   │
│  │                                          │  • validateAgainstTemplate()│    │   │
│  │                                          │  • reconstructFormData()    │    │   │
│  │                                          └─────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                     │                                               │
│                                     ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                        VALIDATION ENGINE                                   │   │
│  │─────────────────────────────────────────────────────────────────────────────│   │
│  │                                                                             │   │
│  │  ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────┐  │   │
│  │  │  Schema Generator   │    │  Field Validator    │    │   Type Checker   │  │   │
│  │  │ ─────────────────── │    │ ─────────────────── │    │ ─────────────── │  │   │
│  │  │ generateZodSchema() │    │ validateField()     │    │ checkFieldType() │  │   │
│  │  │ parseTemplate()     │    │ checkRequired()     │    │ coerceValue()    │  │   │
│  │  └─────────────────────┘    └─────────────────────┘    └─────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Frontend Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                               FRONTEND LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                            FORM COMPONENTS                                  │   │
│  │─────────────────────────────────────────────────────────────────────────────│   │
│  │                                                                             │   │
│  │  ┌─────────────────────┐              ┌─────────────────────────────────┐   │   │
│  │  │    DynamicForm      │              │       FieldRenderer             │   │   │
│  │  │ ─────────────────── │              │ ─────────────────────────────── │   │   │
│  │  │ • template: Template│◄─────────────│ • renderField()                 │   │   │
│  │  │ • onSubmit()        │              │ • handleConditional()           │   │   │
│  │  │ • validation        │              │ • validateField()               │   │   │
│  │  │ • formik integration│              │                                 │   │   │
│  │  └─────────────────────┘              └─────────────────────────────────┘   │   │
│  │              │                                         │                     │   │
│  │              ▼                                         ▼                     │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │   │
│  │  │                    FIELD TYPE REGISTRY                             │   │   │
│  │  │─────────────────────────────────────────────────────────────────────│   │   │
│  │  │                                                                     │   │   │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │   │   │
│  │  │  │  TextInput   │  │ PhoneInput   │  │ CheckboxGroupWithSeverity │  │   │   │
│  │  │  │ ──────────── │  │ ──────────── │  │ ──────────────────────── │  │   │   │
│  │  │  │ type: 'text' │  │ type: 'phone'│  │ type: 'checkbox_severity' │  │   │   │
│  │  │  │ validation   │  │ formatting   │  │ severity scales          │  │   │   │
│  │  │  └──────────────┘  └──────────────┘  └──────────────────────────┘  │   │   │
│  │  │                                                                     │   │   │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │   │   │
│  │  │  │ EmailInput   │  │ DatePicker   │  │    CascadingSelect       │  │   │   │
│  │  │  │ ──────────── │  │ ──────────── │  │ ──────────────────────── │  │   │   │
│  │  │  │ type: 'email'│  │ type: 'date' │  │ type: 'cascading_select' │  │   │   │
│  │  │  │ email valid  │  │ date format  │  │ dependent dropdowns      │  │   │   │
│  │  │  └──────────────┘  └──────────────┘  └──────────────────────────┘  │   │   │
│  │  └─────────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                     │                                               │
│                                     ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                           CONDITIONAL LOGIC                                │   │
│  │─────────────────────────────────────────────────────────────────────────────│   │
│  │                                                                             │   │
│  │  ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────┐  │   │
│  │  │ ConditionalWrapper  │    │  DependencyTracker  │    │ VisibilityManager│  │   │
│  │  │ ─────────────────── │    │ ─────────────────── │    │ ─────────────── │  │   │
│  │  │ show_when rules     │    │ field dependencies  │    │ show/hide fields │  │   │
│  │  │ hide_when rules     │    │ value watching      │    │ conditional render│  │   │
│  │  └─────────────────────┘    └─────────────────────┘    └─────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                DATA FLOW                                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  Template Creation                Form Assignment               Form Usage          │
│  ──────────────────              ──────────────────           ──────────────       │
│                                                                                     │
│  ┌─────────────┐                 ┌─────────────┐              ┌─────────────┐     │
│  │ JSON Config │─── validate ──► │FormTemplate │─── assign ──►│ DynamicForm │     │
│  │    File     │                 │   Database  │              │  Component  │     │
│  └─────────────┘                 └─────────────┘              └─────────────┘     │
│         │                               │                            │             │
│         │                               ▼                            │             │
│         │                     ┌─────────────────┐                    │             │
│         │                     │ FormAssignment  │                    │             │
│         │                     │   (Versioning)  │                    │             │
│         │                     └─────────────────┘                    │             │
│         │                               │                            │             │
│         ▼                               │                            ▼             │
│                                         │                                          │
│  Form Submission                        │              Data Transformation        │
│  ───────────────                        │              ────────────────────       │
│                                         │                                          │
│  ┌─────────────┐                        │              ┌─────────────┐             │
│  │ Form Values │────── transform ───────┼─────────────►│Core + EAV   │             │
│  │   (JSON)    │                        │              │   Storage   │             │
│  └─────────────┘                        │              └─────────────┘             │
│                                         │                     │                    │
│                                         ▼                     ▼                    │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                        STORAGE SPLIT                                       │   │
│  │─────────────────────────────────────────────────────────────────────────────│   │
│  │                                                                             │   │
│  │  CORE FIELDS              │              DYNAMIC FIELDS                    │   │
│  │  (Patient Table)          │              (PatientFieldValue)               │   │
│  │  ────────────────         │              ─────────────────                 │   │
│  │  • firstName              │              • field_name                      │   │
│  │  • lastName               │              • field_value                     │   │
│  │  • mobile                 │              • field_type                      │   │
│  │  • gender                 │              • form_assignment_id              │   │
│  │  • form_assignment_id     │              • patient_id                      │   │
│  │                           │                                                 │   │
│  │  Fast queries ───────────┼────────────► Rich analytics                    │   │
│  │  Standard indexes         │              EAV queries                       │   │
│  │  BI tool compatible       │              Flexible schema                   │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                         │                                           │
│                                         ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         ANALYTICS LAYER                                    │   │
│  │─────────────────────────────────────────────────────────────────────────────│   │
│  │                                                                             │   │
│  │  ┌───────────────────┐       ┌───────────────────┐       ┌─────────────┐   │   │
│  │  │ Materialized Views│       │    SQL Queries    │       │   BI Tools  │   │   │
│  │  │ ───────────────── │       │ ───────────────── │       │ ─────────── │   │   │
│  │  │ • PatientLymphoma │       │ • Symptom Analysis│       │ • Tableau   │   │   │
│  │  │ • TreatmentStatus │       │ • Outcome Reports │       │ • PowerBI   │   │   │
│  │  │ • SymptomTrends   │       │ • Clinical Stats  │       │ • Grafana   │   │   │
│  │  └───────────────────┘       └───────────────────┘       └─────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Key Architectural Benefits

### 1. Hybrid Storage Strategy

- **Core fields** remain as typed columns for performance
- **Dynamic fields** use EAV pattern for flexibility
- **Materialized views** provide optimized analytics queries

### 2. Template Versioning

- Each `FormAssignment` creates a versioned template instance
- Patient records link to specific template versions via `form_assignment_id`
- Data integrity maintained across template updates

### 3. Component Reusability

- **Field type registry** enables extensible form field types
- **Conditional logic engine** handles complex field dependencies
- **Validation engine** generates runtime schemas from templates

### 4. Analytics-Ready Design

- **Queryable structure** supports complex SQL analytics
- **BI tool compatibility** through standard table relationships
- **Performance optimization** via indexes and materialized views

This architecture provides the flexibility of dynamic forms while maintaining the queryability and performance needed for clinical data analysis.
