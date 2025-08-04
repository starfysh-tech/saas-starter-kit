# End-to-End Workflow Diagram: Dynamic Form Templates

## Overview
This diagram shows the complete workflow from template creation to data analysis, illustrating how different roles interact with the system and how data flows through each stage.

## Complete Workflow: From Template Creation to Analytics

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           END-TO-END WORKFLOW                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  PHASE 1: TEMPLATE CREATION (mQOL Team)                                            │
│  ──────────────────────────────────────────                                       │
│                                                                                     │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐             │
│  │  Requirements    │    │   JSON Template  │    │   Validation     │             │
│  │  Gathering       │───►│   Creation       │───►│   & Storage      │             │
│  │                  │    │                  │    │                  │             │
│  │ • Disease needs  │    │ • Field types    │    │ • Schema check   │             │
│  │ • Field types    │    │ • Validation     │    │ • Database insert│             │
│  │ • Relationships  │    │ • Dependencies   │    │ • Template ID    │             │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘             │
│         │                         │                         │                      │
│         │                         │                         ▼                      │
│         │                         │              ┌──────────────────┐             │
│         │                         │              │ FormTemplate DB  │             │
│         │                         │              │ ──────────────── │             │
│         │                         │              │ id: abc123...    │             │
│         │                         │              │ name: "Lymphoma" │             │
│         │                         │              │ config: {...}    │             │
│         │                         │              └──────────────────┘             │
│         │                         │                         │                      │
│         ▼                         ▼                         ▼                      │
│                                                                                     │
│  PHASE 2: TEMPLATE ASSIGNMENT (mQOL Team)                                          │
│  ────────────────────────────────────────                                         │
│                                                                                     │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐             │
│  │  Team Selection  │    │   Version        │    │  Assignment      │             │
│  │                  │───►│   Creation       │───►│  Activation      │             │
│  │                  │    │                  │    │                  │             │
│  │ • City Cancer    │    │ • Template v1    │    │ • Link team      │             │
│  │ • Center         │    │ • Assignment ID  │    │ • Set active     │             │
│  │ • Lymphoma focus │    │ • Versioning     │    │ • Notify team    │             │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘             │
│                                  │                         │                      │
│                                  ▼                         ▼                      │
│                        ┌──────────────────┐    ┌──────────────────┐             │
│                        │ FormAssignment   │    │ Team Gets        │             │
│                        │ ──────────────── │    │ New Form         │             │
│                        │ id: assign789... │    │ ──────────────── │             │
│                        │ template_id      │    │ • Form UI update │             │
│                        │ team_id          │    │ • Field changes  │             │
│                        │ version: 1       │    │ • Staff training │             │
│                        │ active: true     │    │                  │             │
│                        └──────────────────┘    └──────────────────┘             │
│                                  │                                                │
│                                  ▼                                                │
│                                                                                     │
│  PHASE 3: FORM USAGE (Clinical Staff)                                              │
│  ────────────────────────────────                                                 │
│                                                                                     │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐             │
│  │ Patient Arrives  │    │  Dynamic Form    │    │   Form Submit    │             │
│  │                  │───►│  Rendering       │───►│   Validation     │             │
│  │                  │    │                  │    │                  │             │
│  │ • Intake process │    │ • Template fetch │    │ • Field validation│             │
│  │ • Staff login    │    │ • Field render   │    │ • Required checks│             │
│  │ • Add patient    │    │ • Conditional UI │    │ • Type checking  │             │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘             │
│         │                         │                         │                      │
│         │  ┌─ UI Example ─────────┐│                         │                      │
│         │  │ ┌─ Name Fields ────┐ ││                         │                      │
│         │  │ │ First: [John   ] │ ││                         │                      │
│         │  │ │ Last:  [Smith  ] │ ││                         │                      │
│         │  │ └─────────────────┘ ││                         │                      │
│         │  │ ┌─ Treatment ──────┐ ││                         │                      │
│         │  │ │ Status: [Front-line▼] ││                      │                      │
│         │  │ │ Current: [On Treat▼] ││                       │                      │
│         │  │ └─────────────────┘ ││                         │                      │
│         │  │ ┌─ Symptoms ───────┐ ││                         │                      │
│         │  │ │ ☑ Fatigue  [●●○○] │ ││                        │                      │
│         │  │ │ ☐ Night Sweats   │ ││                         │                      │
│         │  │ └─────────────────┘ ││                         │                      │
│         │  └─────────────────────┘│                         │                      │
│         ▼                         ▼                         ▼                      │
│                                                                                     │
│  PHASE 4: DATA TRANSFORMATION & STORAGE                                            │
│  ──────────────────────────────────────────                                       │
│                                                                                     │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐             │
│  │ Form Data        │    │  Data            │    │  Database        │             │
│  │ Received         │───►│  Transformation  │───►│  Storage         │             │
│  │                  │    │                  │    │                  │             │
│  │ • JSON payload   │    │ • Core vs Dynamic│    │ • Patient table  │             │
│  │ • Field mapping  │    │ • EAV conversion │    │ • FieldValue tbl │             │
│  │ • Type coercion  │    │ • Version linking│    │ • Relationships  │             │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘             │
│         │                         │                         │                      │
│         │                         ▼                         ▼                      │
│         │              ┌─ Transformation Logic ─┐ ┌─ Storage Result ──┐             │
│         │              │ Core Fields:           │ │ Patient:           │             │
│         │              │ • firstName → "John"  │ │ • id: patient123   │             │
│         │              │ • lastName → "Smith"  │ │ • firstName: John  │             │
│         │              │ • mobile → formatted  │ │ • form_assign_id   │             │
│         │              │                       │ │                    │             │
│         │              │ Dynamic Fields:       │ │ PatientFieldValue: │             │
│         │              │ • treatment_status →  │ │ • fatigue: true    │             │
│         │              │   "front_line"        │ │ • fatigue_sev: 2   │             │
│         │              │ • fatigue_severity →  │ │ • treatment_stat   │             │
│         │              │   2                   │ │ • lymphoma_subtype │             │
│         │              └───────────────────────┘ └────────────────────┘             │
│         ▼                                                                           │
│                                                                                     │
│  PHASE 5: DATA ANALYSIS & REPORTING                                                │
│  ──────────────────────────────────────                                           │
│                                                                                     │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐             │
│  │ Analytics        │    │  Materialized    │    │  Business        │             │
│  │ Queries          │───►│  Views           │───►│  Intelligence    │             │
│  │                  │    │                  │    │                  │             │
│  │ • SQL joins      │    │ • PatientLymphoma│    │ • Tableau        │             │
│  │ • Aggregations   │    │ • TreatmentStats │    │ • PowerBI        │             │
│  │ • Time series    │    │ • SymptomTrends  │    │ • Custom reports │             │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘             │
│         │                         │                         │                      │
│         ▼                         ▼                         ▼                      │
│                                                                                     │
│  ┌─ Example Analytics Queries ──────────────────────────────────────────────┐      │
│  │                                                                           │      │
│  │ • Symptom Severity Distribution:                                          │      │
│  │   SELECT symptom, severity, COUNT(*) FROM PatientFieldValue              │      │
│  │   WHERE field_name LIKE '%_severity' GROUP BY symptom, severity          │      │
│  │                                                                           │      │
│  │ • Treatment Outcomes by Subtype:                                          │      │
│  │   SELECT subtype.value, status.value, COUNT(*)                           │      │
│  │   FROM PatientFieldValue subtype JOIN PatientFieldValue status           │      │
│  │   WHERE subtype.field_name = 'lymphoma_subtype'                          │      │
│  │   AND status.field_name = 'treatment_status'                             │      │
│  │                                                                           │      │
│  │ • Patient Progress Over Time:                                             │      │
│  │   SELECT DATE_TRUNC('month', p.created_at), COUNT(*)                     │      │
│  │   FROM Patient p JOIN FormAssignment fa ON p.form_assignment_id = fa.id  │      │
│  │   WHERE fa.template_id = 'lymphoma-template-id'                          │      │
│  │   GROUP BY DATE_TRUNC('month', p.created_at)                             │      │
│  └───────────────────────────────────────────────────────────────────────────┘      │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Detailed Process Flow by Role

### mQOL Team Workflow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              mQOL TEAM WORKFLOW                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  Step 1: Requirements Analysis                                                      │
│  ─────────────────────────────                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ • Meet with clinical team (City Cancer Center)                             │   │
│  │ • Identify disease-specific data needs                                     │   │
│  │ • Map current paper forms to digital fields                               │   │
│  │ • Define field relationships and dependencies                             │   │
│  │ • Specify validation rules and constraints                                │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                      ▼                                              │
│  Step 2: Template Development                                                       │
│  ────────────────────────────                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ 1. Copy existing template: cp default.json lymphoma.json                   │   │
│  │ 2. Modify field definitions:                                               │   │
│  │    • Add lymphoma_subtype select field                                     │   │
│  │    • Configure treatment cascading fields                                  │   │
│  │    • Set up symptom severity scales                                        │   │
│  │ 3. Define conditional logic:                                               │   │
│  │    • Show treatment details when "on_treatment"                            │   │
│  │    • Hide severity when symptom not selected                               │   │
│  │ 4. Set validation rules:                                                   │   │
│  │    • Required fields, format constraints                                   │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                      ▼                                              │
│  Step 3: Template Testing & Deployment                                             │
│  ─────────────────────────────────────────                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ 1. Validate JSON structure and syntax                                      │   │
│  │ 2. Test template with sample data                                          │   │
│  │ 3. Execute SQL: INSERT INTO FormTemplate (...)                             │   │
│  │ 4. Verify template stored with ID: abc123-def456-ghi789                    │   │
│  │ 5. Create assignment: INSERT INTO FormAssignment (...)                     │   │
│  │ 6. Notify clinical team of new form availability                           │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Clinical Staff Workflow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           CLINICAL STAFF WORKFLOW                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  Daily Patient Intake Process                                                       │
│  ────────────────────────────                                                      │
│                                                                                     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐                 │
│  │ Patient Check-in│───►│  Navigate to    │───►│  Add Patient    │                 │
│  │                 │    │  Patient Portal │    │  Form           │                 │
│  │ • Appointment   │    │                 │    │                 │                 │
│  │ • Registration  │    │ /teams/city-    │    │ Dynamic form    │                 │
│  │ • Staff login   │    │ cancer-center/  │    │ renders based   │                 │
│  │                 │    │ patients        │    │ on template     │                 │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘                 │
│                                                          │                          │
│                                                          ▼                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                        FORM INTERACTION                                     │   │
│  │─────────────────────────────────────────────────────────────────────────────│   │
│  │                                                                             │   │
│  │  Field Completion Sequence:                                                 │   │
│  │  ─────────────────────────                                                 │   │
│  │                                                                             │   │
│  │  1. Basic Demographics (Always First)                                      │   │
│  │     □ First Name: [John        ]                                           │   │
│  │     □ Last Name:  [Smith       ]                                           │   │
│  │     □ Phone:      [(555) 123-4567] ← Auto-formats                          │   │
│  │     □ Gender:     (●) Male  ( ) Female  ( ) Other                          │   │
│  │                                                                             │   │
│  │  2. Treatment History (Cascading)                                          │   │
│  │     □ Treatment Status: [Front-line     ▼] ← Triggers next field           │   │
│  │     □ Current Status:   [On Treatment   ▼] ← Appears after first selection │   │
│  │                                                                             │   │
│  │  3. Disease-Specific Fields                                                │   │
│  │     □ Lymphoma Subtype: [DLBCL ▼]                                          │   │
│  │                                                                             │   │
│  │  4. Symptom Assessment (Complex)                                           │   │
│  │     □ Current Symptoms:                                                     │   │
│  │       ☑ Fatigue      [●●○○] ← Severity appears when checked                │   │
│  │       ☐ Night Sweats [ - - ] ← Disabled until checked                     │   │
│  │       ☐ Weight Loss  [ - - ]                                               │   │
│  │                                                                             │   │
│  │  Real-time Validation:                                                     │   │
│  │  • Red borders for invalid fields                                          │   │
│  │  • Green checkmarks for valid fields                                       │   │
│  │  • Submit button disabled until all required fields valid                 │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                      ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         FORM SUBMISSION                                     │   │
│  │─────────────────────────────────────────────────────────────────────────────│   │
│  │                                                                             │   │
│  │  1. Click [Create Patient] button                                          │   │
│  │  2. Client-side validation runs                                            │   │
│  │  3. Form data serialized to JSON                                           │   │
│  │  4. POST /api/teams/city-cancer-center/patients                            │   │
│  │  5. Server validates against template schema                               │   │
│  │  6. Success: Patient created, form resets                                  │   │
│  │  7. Error: Validation messages displayed                                   │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Data Analysis Workflow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           DATA ANALYSIS WORKFLOW                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  Analyst/Researcher Access Pattern                                                  │
│  ─────────────────────────────────                                                 │
│                                                                                     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐                 │
│  │ Research Query  │───►│  SQL Database   │───►│  Results        │                 │
│  │ Development     │    │  Direct Access  │    │  Analysis       │                 │
│  │                 │    │                 │    │                 │                 │
│  │ • Hypothesis    │    │ • JOIN queries  │    │ • Statistical   │                 │
│  │ • Metrics       │    │ • Aggregations  │    │ • Visualization │                 │
│  │ • Cohorts       │    │ • Time series   │    │ • Reporting     │                 │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘                 │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                        EXAMPLE ANALYSIS QUERIES                             │   │
│  │─────────────────────────────────────────────────────────────────────────────│   │
│  │                                                                             │   │
│  │  1. Treatment Response Analysis:                                            │   │
│  │     ──────────────────────────────                                         │   │
│  │     WITH treatment_data AS (                                               │   │
│  │       SELECT p.id, p.created_at,                                           │   │
│  │         MAX(CASE WHEN pv.field_name = 'lymphoma_subtype'                   │   │
│  │             THEN pv.field_value END) as subtype,                           │   │
│  │         MAX(CASE WHEN pv.field_name = 'treatment_status'                   │   │
│  │             THEN pv.field_value END) as treatment                          │   │
│  │       FROM Patient p                                                       │   │
│  │       JOIN PatientFieldValue pv ON p.id = pv.patient_id                   │   │
│  │       GROUP BY p.id, p.created_at                                          │   │
│  │     )                                                                      │   │
│  │     SELECT subtype, treatment, COUNT(*) as patient_count                   │   │
│  │     FROM treatment_data                                                    │   │
│  │     GROUP BY subtype, treatment;                                           │   │
│  │                                                                             │   │
│  │  2. Symptom Severity Trends:                                               │   │
│  │     ────────────────────────                                               │   │
│  │     SELECT                                                                 │   │
│  │       REPLACE(pv.field_name, '_severity', '') as symptom,                 │   │
│  │       pv.field_value::integer as severity,                                 │   │
│  │       COUNT(*) as frequency,                                               │   │
│  │       AVG(pv.field_value::integer) as avg_severity                         │   │
│  │     FROM PatientFieldValue pv                                              │   │
│  │     WHERE pv.field_name LIKE '%_severity'                                  │   │
│  │     GROUP BY symptom, severity                                             │   │
│  │     ORDER BY symptom, severity;                                            │   │
│  │                                                                             │   │
│  │  3. Template Usage Analytics:                                              │   │
│  │     ────────────────────────                                               │   │
│  │     SELECT                                                                 │   │
│  │       ft.name as template_name,                                            │   │
│  │       t.name as team_name,                                                 │   │
│  │       fa.version,                                                          │   │
│  │       COUNT(p.id) as patients_created,                                     │   │
│  │       MIN(p.created_at) as first_patient,                                  │   │
│  │       MAX(p.created_at) as latest_patient                                  │   │
│  │     FROM FormTemplate ft                                                   │   │
│  │     JOIN FormAssignment fa ON ft.id = fa.template_id                       │   │
│  │     JOIN Team t ON fa.team_id = t.id                                       │   │
│  │     JOIN Patient p ON fa.id = p.form_assignment_id                         │   │
│  │     GROUP BY ft.name, t.name, fa.version                                   │   │
│  │     ORDER BY patients_created DESC;                                        │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Key Workflow Benefits

### 1. Role Separation
- **mQOL Team:** Template creation and management
- **Clinical Staff:** Patient data entry using dynamic forms
- **Analysts:** Direct SQL access to structured data

### 2. Version Control
- Templates are versioned through FormAssignment records
- Patient data remains tied to specific template versions
- Historical data integrity maintained across template updates

### 3. Scalability
- New templates can be created without code changes
- Teams can be assigned different forms based on their needs
- Analytics queries work across all template types

### 4. Data Integrity
- Strong typing for core fields (name, contact info)
- Flexible EAV storage for disease-specific fields
- Validation at both template and database levels

This workflow provides a complete picture of how the dynamic form system operates from template creation through data analysis, ensuring both flexibility for clinical teams and robust analytics capabilities for researchers.