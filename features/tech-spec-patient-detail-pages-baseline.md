# Technical Specification: Patient Detail Pages with Clinical Baseline Data

## Overview

**Feature**: Patient Detail Pages with Clinical Baseline Data Collection  
**Context**: Extension of existing patient management system to support detailed patient views and clinical baseline data collection  
**Scope**: Individual patient pages with tab navigation, baseline data model, and clinical forms  
**Pattern**: Following TeamTab navigation pattern for consistent UX

## Problem Statement

The current patient management system provides basic demographics (firstName, lastName, mobile, gender) but lacks:

• Individual patient detail pages for comprehensive patient views
• Clinical baseline data collection capabilities  
• Structured data storage for patient reported outcomes (PRO) and clinical assessments
• Tab-based navigation for organizing different types of patient data
• Form components for clinical data entry and validation

## Architecture Overview

### Component Structure

```
/pages/teams/[slug]/patients/[patientId]/
├── index.tsx           # Patient overview (demographics + summary)
├── baseline.tsx        # Clinical baseline data collection
├── assessments.tsx     # Future: PRO assessments
└── history.tsx         # Future: Patient history/timeline
```

### Navigation Pattern

Following TeamTab component pattern with PatientTab component for consistent navigation between patient sections.

## Database Schema Extensions

### PatientBaseline Model

```sql
-- Clinical baseline data model
CREATE TABLE PatientBaseline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES Patient(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES Team(id) ON DELETE CASCADE,

  -- Treatment Information
  line_of_treatment JSONB,              -- Cascading select data
  treatment_details TEXT,
  current_medications TEXT[],

  -- Symptom Assessments
  gastrointestinal_symptoms JSONB,      -- Checkbox with severity data
  neurological_symptoms JSONB,
  fatigue_symptoms JSONB,
  pain_assessment JSONB,

  -- Clinical Measurements
  performance_status INTEGER,           -- ECOG/Karnofsky scale
  weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,2),

  -- Assessment Metadata
  assessment_date DATE NOT NULL,
  assessed_by UUID NOT NULL REFERENCES User(id),
  notes TEXT,

  -- Audit Fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES User(id),
  updated_by UUID REFERENCES User(id),

  -- HIPAA Compliance Fields
  deleted_at TIMESTAMP,
  deleted_by UUID REFERENCES User(id),
  deletion_reason TEXT,
  retention_until TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_patient_baseline_patient ON PatientBaseline(patient_id);
CREATE INDEX idx_patient_baseline_team ON PatientBaseline(team_id);
CREATE INDEX idx_patient_baseline_date ON PatientBaseline(assessment_date);
CREATE INDEX idx_patient_baseline_deleted ON PatientBaseline(deleted_at);

-- Constraints
ALTER TABLE PatientBaseline ADD CONSTRAINT patient_baseline_team_scope
  CHECK (team_id = (SELECT team_id FROM Patient WHERE id = patient_id));
```

### Prisma Schema Updates

```typescript
model PatientBaseline {
  id                      String   @id @default(uuid())
  patientId               String   @map("patient_id")
  teamId                  String   @map("team_id")

  // Treatment Information
  lineOfTreatment         Json?    @map("line_of_treatment")
  treatmentDetails        String?  @map("treatment_details")
  currentMedications      String[] @map("current_medications")

  // Symptom Assessments (stored as JSON for complex data)
  gastrointestinalSymptoms Json?   @map("gastrointestinal_symptoms")
  neurologicalSymptoms     Json?   @map("neurological_symptoms")
  fatigueSymptoms         Json?    @map("fatigue_symptoms")
  painAssessment          Json?    @map("pain_assessment")

  // Clinical Measurements
  performanceStatus       Int?     @map("performance_status")
  weightKg               Decimal? @map("weight_kg") @db.Decimal(5,2)
  heightCm               Decimal? @map("height_cm") @db.Decimal(5,2)

  // Assessment Metadata
  assessmentDate          DateTime @map("assessment_date") @db.Date
  assessedBy              String   @map("assessed_by")
  notes                   String?

  // Audit Fields
  createdAt              DateTime  @default(now()) @map("created_at")
  updatedAt              DateTime  @default(now()) @map("updated_at")
  createdBy              String    @map("created_by")
  updatedBy              String?   @map("updated_by")

  // HIPAA Compliance
  deletedAt              DateTime? @map("deleted_at")
  deletedBy              String?   @map("deleted_by")
  deletionReason         String?   @map("deletion_reason")
  retentionUntil         DateTime? @map("retention_until")

  // Relations
  patient      Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)
  team         Team    @relation(fields: [teamId], references: [id], onDelete: Cascade)
  assessor     User    @relation("BaselineAssessor", fields: [assessedBy], references: [id])
  creator      User    @relation("BaselineCreator", fields: [createdBy], references: [id])
  updater      User?   @relation("BaselineUpdater", fields: [updatedBy], references: [id])
  deleter      User?   @relation("BaselineDeleter", fields: [deletedBy], references: [id])

  @@index([patientId])
  @@index([teamId])
  @@index([assessmentDate])
  @@index([deletedAt])
  @@map("PatientBaseline")
}

// Update User model to include baseline relations
model User {
  // ... existing fields
  assessedBaselines   PatientBaseline[] @relation("BaselineAssessor")
  createdBaselines    PatientBaseline[] @relation("BaselineCreator")
  updatedBaselines    PatientBaseline[] @relation("BaselineUpdater")
  deletedBaselines    PatientBaseline[] @relation("BaselineDeleter")
}

// Update Team model to include baseline relation
model Team {
  // ... existing fields
  patientBaselines    PatientBaseline[]
}

// Update Patient model to include baseline relation
model Patient {
  // ... existing fields
  baselines           PatientBaseline[]
}
```

## API Design

### Patient Detail API Endpoints

```typescript
// pages/api/teams/[slug]/patients/[patientId]/index.ts
// GET - Get patient details with related data summary
// PUT - Update patient demographics
// DELETE - Archive patient (existing functionality)

// pages/api/teams/[slug]/patients/[patientId]/baseline/index.ts
// GET - List all baseline assessments for patient (paginated)
// POST - Create new baseline assessment

// pages/api/teams/[slug]/patients/[patientId]/baseline/[baselineId].ts
// GET - Get specific baseline assessment
// PUT - Update baseline assessment
// DELETE - Archive baseline assessment
```

### API Response Structures

```typescript
// Patient Detail Response
interface PatientDetailResponse {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    mobile?: string;
    gender?: Gender;
    createdAt: string;
    updatedAt: string;
    // Summary data
    baselineCount: number;
    lastAssessmentDate?: string;
    currentTreatmentStatus?: string;
  };
  team: {
    id: string;
    name: string;
    slug: string;
  };
}

// Baseline Assessment Response
interface BaselineAssessmentResponse {
  id: string;
  patientId: string;
  assessmentDate: string;
  assessedBy: string;
  assessor: {
    id: string;
    name: string;
  };

  // Treatment data
  lineOfTreatment?: {
    treatmentStatus: string;
    currentStatus: string;
  };
  treatmentDetails?: string;
  currentMedications: string[];

  // Symptom data (structured)
  gastrointestinalSymptoms?: {
    [key: string]: {
      selected: boolean;
      severity?: number;
    };
  };
  neurologicalSymptoms?: similar_structure;
  fatigueSymptoms?: similar_structure;
  painAssessment?: similar_structure;

  // Clinical measurements
  performanceStatus?: number;
  weightKg?: number;
  heightCm?: number;

  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

## Component Architecture

### PatientTab Component

```typescript
// components/patient/PatientTab.tsx
import { Patient } from '@prisma/client';

interface PatientTabProps {
  activeTab: string;
  patient: Patient;
  team: Team;
}

const PatientTab = ({ activeTab, patient, team }: PatientTabProps) => {
  const navigations = [
    {
      name: 'Overview',
      href: `/teams/${team.slug}/patients/${patient.id}`,
      active: activeTab === 'overview',
      icon: UserIcon,
    },
    {
      name: 'Baseline Data',
      href: `/teams/${team.slug}/patients/${patient.id}/baseline`,
      active: activeTab === 'baseline',
      icon: DocumentTextIcon,
    },
    // Future tabs
    {
      name: 'Assessments',
      href: `/teams/${team.slug}/patients/${patient.id}/assessments`,
      active: activeTab === 'assessments',
      icon: ClipboardDocumentListIcon,
      disabled: true, // For future implementation
    },
    {
      name: 'History',
      href: `/teams/${team.slug}/patients/${patient.id}/history`,
      active: activeTab === 'history',
      icon: ClockIcon,
      disabled: true, // For future implementation
    },
  ];

  return (
    <div className="flex flex-col pb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {patient.firstName} {patient.lastName}
          </h1>
          <p className="text-gray-600">Patient ID: {patient.id.slice(-8)}</p>
        </div>
        <Link href={`/teams/${team.slug}/patients`}>
          <Button variant="outline">← Back to Patients</Button>
        </Link>
      </div>

      <nav className="flex flex-wrap border-b border-gray-300" aria-label="Patient Tabs">
        {navigations.map((tab) => (
          <Link
            key={tab.href}
            href={tab.disabled ? '#' : tab.href}
            className={classNames(
              'inline-flex items-center border-b-2 py-2 mr-5 text-sm font-medium',
              tab.active
                ? 'border-gray-900 text-gray-700'
                : tab.disabled
                ? 'border-transparent text-gray-400 cursor-not-allowed'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            )}
          >
            <tab.icon className="w-5 h-5 mr-2" />
            {tab.name}
          </Link>
        ))}
      </nav>
    </div>
  );
};
```

### Patient Overview Page

```typescript
// pages/teams/[slug]/patients/[patientId]/index.tsx
import { PatientTab } from '@/components/patient';
import { PatientOverview } from '@/components/patient/PatientOverview';

const PatientDetail = () => {
  const { patient, team, isLoading, isError } = usePatient();

  if (isLoading) return <Loading />;
  if (isError || !patient) return <Error message="Patient not found" />;

  return (
    <>
      <PatientTab activeTab="overview" patient={patient} team={team} />
      <PatientOverview patient={patient} team={team} />
    </>
  );
};

export async function getServerSideProps({ params, locale }: GetServerSidePropsContext) {
  if (!env.teamFeatures.patients) {
    return { notFound: true };
  }

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      patientId: params?.patientId,
      teamSlug: params?.slug,
    },
  };
}
```

### Baseline Data Page

```typescript
// pages/teams/[slug]/patients/[patientId]/baseline.tsx
import { PatientTab } from '@/components/patient';
import { BaselineAssessmentList, NewBaselineAssessment } from '@/components/patient/baseline';

const PatientBaseline = () => {
  const { patient, team } = usePatient();
  const { baselines, isLoading, mutate } = usePatientBaselines(patient?.id);
  const [showNewForm, setShowNewForm] = useState(false);

  return (
    <>
      <PatientTab activeTab="baseline" patient={patient} team={team} />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Clinical Baseline Assessments</h2>
          <Button onClick={() => setShowNewForm(true)}>
            + New Assessment
          </Button>
        </div>

        {showNewForm && (
          <NewBaselineAssessment
            patient={patient}
            team={team}
            onSubmit={async (data) => {
              await createBaseline(data);
              mutate();
              setShowNewForm(false);
            }}
            onCancel={() => setShowNewForm(false)}
          />
        )}

        <BaselineAssessmentList
          baselines={baselines}
          isLoading={isLoading}
          onEdit={(baseline) => {/* Edit logic */}}
          onDelete={(baseline) => {/* Delete logic */}}
        />
      </div>
    </>
  );
};
```

## Clinical Form Components

### Complex Field Components

```typescript
// components/patient/baseline/CheckboxWithSeverity.tsx
interface CheckboxWithSeverityProps {
  label: string;
  options: Array<{
    value: string;
    label: string;
    hasSeverity?: boolean;
    exclusive?: boolean;
  }>;
  value: Record<string, { selected: boolean; severity?: number }>;
  onChange: (value: Record<string, { selected: boolean; severity?: number }>) => void;
  severityScale: { min: number; max: number; labels: string[] };
}

const CheckboxWithSeverity = ({ label, options, value, onChange, severityScale }: CheckboxWithSeverityProps) => {
  const handleCheckboxChange = (optionValue: string, checked: boolean) => {
    const newValue = { ...value };

    // Handle exclusive options (like "NO PROBLEMS")
    if (checked && options.find(opt => opt.value === optionValue)?.exclusive) {
      // Clear all other selections
      Object.keys(newValue).forEach(key => {
        if (key !== optionValue) {
          newValue[key] = { selected: false };
        }
      });
    }

    newValue[optionValue] = {
      selected: checked,
      severity: checked && options.find(opt => opt.value === optionValue)?.hasSeverity
        ? newValue[optionValue]?.severity || 1
        : undefined
    };

    onChange(newValue);
  };

  const handleSeverityChange = (optionValue: string, severity: number) => {
    const newValue = { ...value };
    newValue[optionValue] = {
      ...newValue[optionValue],
      severity
    };
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {options.map((option) => (
        <div key={option.value} className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id={option.value}
              checked={value[option.value]?.selected || false}
              onChange={(e) => handleCheckboxChange(option.value, e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor={option.value} className="ml-2 text-sm text-gray-700">
              {option.label}
            </label>
          </div>

          {option.hasSeverity && value[option.value]?.selected && (
            <div className="ml-6 space-y-2">
              <span className="text-xs text-gray-500">Severity Level:</span>
              <div className="flex space-x-2">
                {severityScale.labels.map((severityLabel, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSeverityChange(option.value, index + 1)}
                    className={classNames(
                      'px-3 py-1 text-xs rounded',
                      value[option.value]?.severity === index + 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    )}
                  >
                    {severityLabel}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
```

### Cascading Select Component

```typescript
// components/patient/baseline/CascadingSelect.tsx
interface CascadingSelectProps {
  label: string;
  steps: Array<{
    name: string;
    label: string;
    options: Array<{ value: string; label: string }>;
    dependsOn?: string;
  }>;
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
}

const CascadingSelect = ({ label, steps, value, onChange }: CascadingSelectProps) => {
  const handleStepChange = (stepName: string, selectedValue: string) => {
    const newValue = { ...value };
    newValue[stepName] = selectedValue;

    // Clear dependent steps when parent changes
    steps.forEach(step => {
      if (step.dependsOn === stepName) {
        delete newValue[step.name];
      }
    });

    onChange(newValue);
  };

  const isStepEnabled = (step: any) => {
    if (!step.dependsOn) return true;
    return !!value[step.dependsOn];
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {steps.map((step) => (
        <div key={step.name}>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {step.label}
          </label>
          <select
            value={value[step.name] || ''}
            onChange={(e) => handleStepChange(step.name, e.target.value)}
            disabled={!isStepEnabled(step)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
          >
            <option value="">Select {step.label}</option>
            {step.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
};
```

### Baseline Assessment Form

```typescript
// components/patient/baseline/BaselineAssessmentForm.tsx
interface BaselineAssessmentFormProps {
  patient: Patient;
  team: Team;
  initialData?: PatientBaseline;
  onSubmit: (data: BaselineAssessmentInput) => Promise<void>;
  onCancel: () => void;
}

const BaselineAssessmentForm = ({ patient, team, initialData, onSubmit, onCancel }: BaselineAssessmentFormProps) => {
  const [formData, setFormData] = useState<BaselineAssessmentInput>({
    assessmentDate: new Date().toISOString().split('T')[0],
    lineOfTreatment: {},
    gastrointestinalSymptoms: {},
    neurologicalSymptoms: {},
    currentMedications: [],
    ...initialData
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
    } catch (error) {
      // Handle error
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData ? 'Edit' : 'New'} Baseline Assessment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Assessment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Assessment Date
            </label>
            <input
              type="date"
              value={formData.assessmentDate}
              onChange={(e) => setFormData({...formData, assessmentDate: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          {/* Line of Treatment - Cascading Select */}
          <CascadingSelect
            label="Line of Treatment"
            steps={[
              {
                name: 'treatmentStatus',
                label: 'Treatment Status',
                options: [
                  { value: 'front_line', label: 'Front-line' },
                  { value: 'relapsed_refractory', label: 'Relapsed / Refractory' },
                  { value: 'maintenance', label: 'Maintenance' }
                ]
              },
              {
                name: 'currentStatus',
                label: 'Current Status',
                dependsOn: 'treatmentStatus',
                options: [
                  { value: 'on_treatment', label: 'On Treatment' },
                  { value: 'off_treatment', label: 'Off Treatment' }
                ]
              }
            ]}
            value={formData.lineOfTreatment || {}}
            onChange={(value) => setFormData({...formData, lineOfTreatment: value})}
          />

          {/* Treatment Details - Conditional Field */}
          {formData.lineOfTreatment?.currentStatus === 'on_treatment' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Treatment Details
              </label>
              <textarea
                value={formData.treatmentDetails || ''}
                onChange={(e) => setFormData({...formData, treatmentDetails: e.target.value})}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Describe current treatment regimen..."
              />
            </div>
          )}

          {/* Gastrointestinal Symptoms - Checkbox with Severity */}
          <CheckboxWithSeverity
            label="Gastrointestinal Symptoms"
            options={[
              { value: 'no_problems', label: 'NO PROBLEMS', exclusive: true },
              { value: 'constipation', label: 'Constipation', hasSeverity: true },
              { value: 'diarrhea', label: 'Diarrhea', hasSeverity: true },
              { value: 'nausea', label: 'Nausea', hasSeverity: true },
              { value: 'vomiting', label: 'Vomiting', hasSeverity: true },
              { value: 'abdominal_pain', label: 'Abdominal Pain', hasSeverity: true }
            ]}
            value={formData.gastrointestinalSymptoms || {}}
            onChange={(value) => setFormData({...formData, gastrointestinalSymptoms: value})}
            severityScale={{
              min: 1,
              max: 4,
              labels: ['Mild', 'Moderate', 'Severe', 'Very Severe']
            }}
          />

          {/* Clinical Measurements */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Performance Status (0-4)
              </label>
              <input
                type="number"
                min="0"
                max="4"
                value={formData.performanceStatus || ''}
                onChange={(e) => setFormData({...formData, performanceStatus: parseInt(e.target.value)})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.weightKg || ''}
                onChange={(e) => setFormData({...formData, weightKg: parseFloat(e.target.value)})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Height (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.heightCm || ''}
                onChange={(e) => setFormData({...formData, heightCm: parseFloat(e.target.value)})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Clinical Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Additional clinical observations or notes..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {initialData ? 'Update' : 'Create'} Assessment
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
```

## Validation Schemas

### Baseline Assessment Validation

```typescript
// lib/zod/baseline.ts
export const baselineAssessmentSchema = z.object({
  assessmentDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),

  lineOfTreatment: z
    .object({
      treatmentStatus: z
        .enum(['front_line', 'relapsed_refractory', 'maintenance'])
        .optional(),
      currentStatus: z.enum(['on_treatment', 'off_treatment']).optional(),
    })
    .optional(),

  treatmentDetails: z.string().max(1000).optional(),

  currentMedications: z.array(z.string()).default([]),

  gastrointestinalSymptoms: z
    .record(
      z.object({
        selected: z.boolean(),
        severity: z.number().min(1).max(4).optional(),
      })
    )
    .optional(),

  neurologicalSymptoms: z
    .record(
      z.object({
        selected: z.boolean(),
        severity: z.number().min(1).max(4).optional(),
      })
    )
    .optional(),

  performanceStatus: z.number().min(0).max(4).optional(),
  weightKg: z.number().positive().max(500).optional(),
  heightCm: z.number().positive().min(50).max(300).optional(),

  notes: z.string().max(2000).optional(),
});

export type BaselineAssessmentInput = z.infer<typeof baselineAssessmentSchema>;
```

## Model Functions

### Patient Baseline Model

```typescript
// models/patientBaseline.ts
import { PatientBaseline, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface CreateBaselineAssessmentInput {
  patientId: string;
  teamId: string;
  assessmentDate: Date;
  assessedBy: string;
  createdBy: string;
  lineOfTreatment?: any;
  treatmentDetails?: string;
  currentMedications?: string[];
  gastrointestinalSymptoms?: any;
  neurologicalSymptoms?: any;
  performanceStatus?: number;
  weightKg?: number;
  heightCm?: number;
  notes?: string;
}

export async function createBaselineAssessment(
  data: CreateBaselineAssessmentInput
): Promise<PatientBaseline> {
  // Verify patient belongs to team
  const patient = await prisma.patient.findFirst({
    where: { id: data.patientId, teamId: data.teamId, deletedAt: null },
  });

  if (!patient) {
    throw new Error('Patient not found or access denied');
  }

  return await prisma.patientBaseline.create({
    data: {
      ...data,
      assessmentDate: new Date(data.assessmentDate),
    },
    include: {
      assessor: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
    },
  });
}

export async function getPatientBaselines(
  patientId: string,
  teamId: string,
  options: {
    page?: number;
    limit?: number;
    includeDeleted?: boolean;
  } = {}
): Promise<{ baselines: PatientBaseline[]; total: number }> {
  const { page = 1, limit = 10, includeDeleted = false } = options;
  const skip = (page - 1) * limit;

  const where: Prisma.PatientBaselineWhereInput = {
    patientId,
    teamId,
    ...(includeDeleted ? {} : { deletedAt: null }),
  };

  const [baselines, total] = await Promise.all([
    prisma.patientBaseline.findMany({
      where,
      skip,
      take: limit,
      orderBy: { assessmentDate: 'desc' },
      include: {
        assessor: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
      },
    }),
    prisma.patientBaseline.count({ where }),
  ]);

  return { baselines, total };
}

export async function getBaselineAssessment(
  baselineId: string,
  teamId: string
): Promise<PatientBaseline | null> {
  return await prisma.patientBaseline.findFirst({
    where: {
      id: baselineId,
      teamId,
      deletedAt: null,
    },
    include: {
      patient: true,
      assessor: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
    },
  });
}

export async function updateBaselineAssessment(
  baselineId: string,
  teamId: string,
  updatedBy: string,
  data: Partial<CreateBaselineAssessmentInput>
): Promise<PatientBaseline> {
  const existing = await getBaselineAssessment(baselineId, teamId);
  if (!existing) {
    throw new Error('Baseline assessment not found');
  }

  return await prisma.patientBaseline.update({
    where: { id: baselineId },
    data: {
      ...data,
      updatedBy,
      updatedAt: new Date(),
    },
    include: {
      assessor: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
    },
  });
}

export async function archiveBaselineAssessment(
  baselineId: string,
  teamId: string,
  deletedBy: string,
  deletionReason: string
): Promise<PatientBaseline> {
  const existing = await getBaselineAssessment(baselineId, teamId);
  if (!existing) {
    throw new Error('Baseline assessment not found');
  }

  return await prisma.patientBaseline.update({
    where: { id: baselineId },
    data: {
      deletedAt: new Date(),
      deletedBy,
      deletionReason,
      retentionUntil: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000), // 7 years
    },
  });
}
```

## Permission System Integration

### Baseline Permissions

```typescript
// lib/permissions.ts
// Add to existing resource types
export type Resource =
  | 'team_patient'
  | 'team_patient_baseline'  // New resource type
  | /* existing resources */;

// Update role permissions
const permissions: Permissions = {
  [Role.OWNER]: [
    // ... existing permissions
    'team_patient_baseline:*',
  ],
  [Role.ADMIN]: [
    // ... existing permissions
    'team_patient_baseline:*',
  ],
  [Role.MEMBER]: [
    // ... existing permissions
    'team_patient_baseline:read',
    'team_patient_baseline:create',
    'team_patient_baseline:update',
  ],
};
```

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Goal**: Basic patient detail page structure and navigation

**Tasks**:

1. Create PatientBaseline database model and migration
2. Update Prisma schema with baseline relations
3. Create PatientTab component following TeamTab pattern
4. Implement patient detail page routing structure
5. Create basic patient overview page
6. Add permission system integration for baseline resources

**Deliverables**:
• `/teams/[slug]/patients/[patientId]/index.tsx` - Patient overview page
• `PatientTab` component with navigation structure
• Database migration for PatientBaseline model
• Updated permission system with `team_patient_baseline` resource

### Phase 2: Baseline Data API (Week 2-3)

**Goal**: Backend API for baseline data CRUD operations

**Tasks**:

1. Create baseline model functions in `/models/patientBaseline.ts`
2. Implement baseline API endpoints
3. Add validation schemas for baseline data
4. Create baseline assessment list/detail views
5. Add error handling and audit logging

**Deliverables**:
• API endpoints for baseline CRUD operations
• Model functions with team scoping validation
• Zod validation schemas for clinical data
• Basic baseline assessment list UI

### Phase 3: Clinical Forms (Week 3-4)

**Goal**: Complex form components for clinical data entry

**Tasks**:

1. Build CheckboxWithSeverity component
2. Build CascadingSelect component
3. Create BaselineAssessmentForm component
4. Implement form validation and error handling
5. Add medication management UI
6. Create baseline assessment detail views

**Deliverables**:
• Complex form components for symptom assessment
• Clinical data entry form with validation
• Baseline assessment creation and editing
• Medication tracking functionality

### Phase 4: Integration & Testing (Week 4-5)

**Goal**: Complete integration and comprehensive testing

**Tasks**:

1. Connect all components with SWR data fetching
2. Add loading states and error boundaries
3. Implement success/error notifications
4. Create comprehensive test suite
5. Add E2E tests for clinical workflows
6. Performance optimization and accessibility review

**Deliverables**:
• Fully integrated patient detail pages
• Complete test coverage (unit, integration, E2E)
• Performance optimized clinical forms
• Accessibility compliant UI components

### Phase 5: Advanced Features (Week 5-6)

**Goal**: Enhanced functionality and future preparation

**Tasks**:

1. Add baseline assessment comparison views
2. Implement assessment export functionality
3. Create assessment timeline view
4. Add bulk operations for assessments
5. Prepare structure for future PRO assessment integration
6. Documentation and training materials

**Deliverables**:
• Assessment comparison and timeline features
• Export/import capabilities for clinical data
• Future-ready architecture for expanded features
• Complete documentation for clinical workflows

## Security & Compliance Considerations

### HIPAA Compliance

• **Data Minimization**: Collect only clinically necessary baseline data
• **Access Controls**: Role-based permissions for baseline assessment access  
• **Audit Logging**: Comprehensive tracking via Retraced for all baseline operations
• **Soft Delete Architecture**: 7-year retention with automatic purging
• **Data Encryption**: All baseline data encrypted at rest and in transit
• **Session Security**: Secure authentication for clinical data access

### Multi-Tenant Security

• **Team Scoping**: All baseline queries include team-based filtering with database constraints
• **Permission Validation**: Verify user access to both team and patient before operations
• **Data Isolation**: No cross-team baseline data access allowed
• **Audit Boundaries**: Team-scoped audit logs for baseline assessments

## Testing Strategy

### Unit Tests

• Baseline model functions with team scoping validation
• Complex form component rendering and interaction
• Data transformation and validation functions
• Permission system integration for baseline resources

### Integration Tests

• Baseline API endpoints with authentication and authorization
• Patient detail page routing and data fetching
• Form submission workflows with validation
• Database constraint enforcement

### E2E Tests

```typescript
// tests/e2e/patient-baseline.spec.ts
test('Clinical user can create and edit baseline assessment', async ({
  page,
}) => {
  // Navigate to patient baseline page
  await page.goto('/teams/clinic/patients/123/baseline');

  // Create new assessment
  await page.click('[data-testid="new-assessment"]');

  // Fill treatment information
  await page.selectOption('[data-testid="treatment-status"]', 'front_line');
  await page.selectOption('[data-testid="current-status"]', 'on_treatment');

  // Fill symptom assessment
  await page.check('[data-testid="constipation"]');
  await page.click('[data-testid="constipation-severity-2"]');

  // Add clinical measurements
  await page.fill('[data-testid="performance-status"]', '1');
  await page.fill('[data-testid="weight"]', '70.5');

  // Submit assessment
  await page.click('[data-testid="submit-assessment"]');

  // Verify assessment created
  await expect(page.locator('[data-testid="assessment-list"]')).toContainText(
    'Front-line'
  );
});
```

## Performance Considerations

### Database Optimization

• **Indexes**: Optimized indexes on patientId, teamId, assessmentDate, and deletedAt
• **Query Efficiency**: Use Prisma select/include to fetch only required data
• **Pagination**: Implement cursor-based pagination for large assessment lists
• **JSON Indexing**: GIN indexes on JSONB symptom columns for complex queries

### Frontend Performance

• **Component Memoization**: Memoize complex form components to prevent unnecessary re-renders
• **SWR Caching**: Implement proper caching strategy for patient and baseline data
• **Form Optimization**: Debounce validation and use controlled inputs efficiently
• **Lazy Loading**: Load baseline assessment details on demand

### Monitoring

• **Performance Metrics**: Track form render times, API response times, database query performance
• **Error Tracking**: Comprehensive error logging for clinical workflow issues
• **Usage Analytics**: Monitor baseline assessment creation patterns and form completion rates

## Per-Team Form Customization

### Overview

The baseline forms and data structures are **placeholder examples only**. Each team will need custom clinical forms based on their specific medical specialization, protocols, and regulatory requirements.

### Team-Specific Form Templates

#### Configuration Structure

```typescript
// lib/teamFormConfigs.ts
interface TeamBaselineConfig {
  teamId: string;
  formSections: BaselineFormSection[];
  validationSchema: z.ZodSchema;
  displaySettings: {
    title: string;
    description: string;
    sectionLayout: 'tabs' | 'accordion' | 'single-page';
  };
}

interface BaselineFormSection {
  id: string;
  title: string;
  description?: string;
  fields: BaselineFormField[];
  conditionalLogic?: ConditionalRule[];
}

interface BaselineFormField {
  id: string;
  type:
    | 'text'
    | 'number'
    | 'select'
    | 'multiselect'
    | 'checkbox-severity'
    | 'cascading-select'
    | 'textarea'
    | 'date';
  label: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: FormFieldOption[];
  validation?: FieldValidation;
  conditionalDisplay?: ConditionalRule;
}

interface FormFieldOption {
  value: string;
  label: string;
  description?: string;
  hasSeverity?: boolean;
  severityScale?: SeverityScale;
  exclusive?: boolean; // For "None" options
}

interface SeverityScale {
  min: number;
  max: number;
  labels: string[];
  descriptions?: string[];
}
```

#### Example Team Configurations

**Oncology Team Configuration:**

```typescript
// configs/teams/oncology-baseline-config.ts
export const oncologyBaselineConfig: TeamBaselineConfig = {
  teamId: 'oncology-team-id',
  displaySettings: {
    title: 'Cancer Treatment Baseline Assessment',
    description: 'Comprehensive baseline data collection for oncology patients',
    sectionLayout: 'tabs',
  },
  formSections: [
    {
      id: 'disease_status',
      title: 'Disease Status',
      fields: [
        {
          id: 'cancer_stage',
          type: 'select',
          label: 'Cancer Stage',
          required: true,
          options: [
            { value: 'stage_1', label: 'Stage I' },
            { value: 'stage_2', label: 'Stage II' },
            { value: 'stage_3', label: 'Stage III' },
            { value: 'stage_4', label: 'Stage IV' },
          ],
        },
        {
          id: 'ecog_status',
          type: 'select',
          label: 'ECOG Performance Status',
          required: true,
          options: [
            { value: '0', label: '0 - Fully active, no restrictions' },
            { value: '1', label: '1 - Restricted in strenuous activity' },
            { value: '2', label: '2 - Ambulatory, capable of self-care' },
            { value: '3', label: '3 - Limited self-care, >50% in bed/chair' },
            { value: '4', label: '4 - Completely disabled' },
          ],
        },
      ],
    },
    {
      id: 'symptoms',
      title: 'Symptom Assessment',
      fields: [
        {
          id: 'gastrointestinal_symptoms',
          type: 'checkbox-severity',
          label: 'Gastrointestinal Symptoms',
          required: false,
          options: [
            { value: 'no_problems', label: 'No Problems', exclusive: true },
            {
              value: 'nausea',
              label: 'Nausea',
              hasSeverity: true,
              severityScale: {
                min: 1,
                max: 4,
                labels: ['Mild', 'Moderate', 'Severe', 'Very Severe'],
              },
            },
            {
              value: 'vomiting',
              label: 'Vomiting',
              hasSeverity: true,
              severityScale: {
                min: 1,
                max: 4,
                labels: ['Mild', 'Moderate', 'Severe', 'Very Severe'],
              },
            },
          ],
        },
      ],
    },
  ],
};
```

**Cardiology Team Configuration:**

```typescript
// configs/teams/cardiology-baseline-config.ts
export const cardiologyBaselineConfig: TeamBaselineConfig = {
  teamId: 'cardiology-team-id',
  displaySettings: {
    title: 'Cardiac Assessment Baseline',
    description: 'Baseline cardiovascular assessment for cardiac patients',
    sectionLayout: 'accordion',
  },
  formSections: [
    {
      id: 'cardiac_status',
      title: 'Cardiac Status',
      fields: [
        {
          id: 'nyha_class',
          type: 'select',
          label: 'NYHA Functional Class',
          required: true,
          options: [
            { value: 'class_1', label: 'Class I - No symptoms' },
            { value: 'class_2', label: 'Class II - Slight limitation' },
            { value: 'class_3', label: 'Class III - Marked limitation' },
            { value: 'class_4', label: 'Class IV - Severe limitation' },
          ],
        },
        {
          id: 'ejection_fraction',
          type: 'number',
          label: 'Left Ventricular Ejection Fraction (%)',
          required: false,
          validation: { min: 0, max: 100 },
        },
      ],
    },
  ],
};
```

### Implementation Guide for Team Customization

#### Step 1: Create Team-Specific Configuration File

```bash
# Create new team config file
touch configs/teams/[TEAM_NAME]-baseline-config.ts
```

#### Step 2: Define Form Structure

```typescript
// configs/teams/[TEAM_NAME]-baseline-config.ts
import { TeamBaselineConfig } from '@/lib/teamFormConfigs';

export const [teamName]BaselineConfig: TeamBaselineConfig = {
  teamId: "your-team-id", // Must match actual team ID in database
  displaySettings: {
    title: "Your Custom Title",
    description: "Description of your assessment",
    sectionLayout: 'tabs' // or 'accordion' or 'single-page'
  },
  formSections: [
    {
      id: 'section_1',
      title: 'Section Title',
      description: 'Optional section description',
      fields: [
        // Define your custom fields here
        {
          id: 'custom_field_1',
          type: 'select', // or other field types
          label: 'Your Field Label',
          required: true,
          options: [
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' }
          ]
        }
      ]
    }
  ]
};
```

#### Step 3: Register Configuration

```typescript
// lib/teamFormConfigs.ts
import { oncologyBaselineConfig } from '@/configs/teams/oncology-baseline-config';
import { cardiologyBaselineConfig } from '@/configs/teams/cardiology-baseline-config';
import { [teamName]BaselineConfig } from '@/configs/teams/[TEAM_NAME]-baseline-config';

export const teamBaselineConfigs: Record<string, TeamBaselineConfig> = {
  'oncology-team-id': oncologyBaselineConfig,
  'cardiology-team-id': cardiologyBaselineConfig,
  '[your-team-id]': [teamName]BaselineConfig,
};

export function getTeamBaselineConfig(teamId: string): TeamBaselineConfig | null {
  return teamBaselineConfigs[teamId] || null;
}
```

#### Step 4: Create Validation Schema

```typescript
// lib/zod/teamValidation.ts
export function createTeamValidationSchema(
  config: TeamBaselineConfig
): z.ZodSchema {
  const schemaFields: Record<string, z.ZodTypeAny> = {};

  config.formSections.forEach((section) => {
    section.fields.forEach((field) => {
      let fieldSchema: z.ZodTypeAny;

      switch (field.type) {
        case 'text':
          fieldSchema = z.string();
          break;
        case 'number':
          fieldSchema = z.number();
          if (field.validation?.min)
            fieldSchema = fieldSchema.min(field.validation.min);
          if (field.validation?.max)
            fieldSchema = fieldSchema.max(field.validation.max);
          break;
        case 'select':
          const validValues = field.options?.map((opt) => opt.value) || [];
          fieldSchema = z.enum(validValues as [string, ...string[]]);
          break;
        case 'checkbox-severity':
          fieldSchema = z.record(
            z.object({
              selected: z.boolean(),
              severity: z.number().min(1).max(4).optional(),
            })
          );
          break;
        default:
          fieldSchema = z.any();
      }

      if (!field.required) {
        fieldSchema = fieldSchema.optional();
      }

      schemaFields[field.id] = fieldSchema;
    });
  });

  return z.object(schemaFields);
}
```

### Database Schema for Team Configurations

```sql
-- Store team-specific form configurations in database (optional)
CREATE TABLE TeamBaselineConfigs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES Team(id) ON DELETE CASCADE,
  config_name VARCHAR(100) NOT NULL,
  config_version INTEGER DEFAULT 1,
  form_config JSONB NOT NULL, -- Store the entire config as JSON
  validation_schema JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES User(id),

  UNIQUE(team_id, config_name, config_version)
);

-- Index for efficient team config lookups
CREATE INDEX idx_team_baseline_configs_team ON TeamBaselineConfigs(team_id, is_active);
```

### Admin Interface for Form Configuration

```typescript
// components/admin/BaselineFormBuilder.tsx
const BaselineFormBuilder = ({ team }: { team: Team }) => {
  const [config, setConfig] = useState<TeamBaselineConfig | null>(null);

  return (
    <div className="space-y-6">
      <h2>Customize Baseline Forms for {team.name}</h2>

      {/* Form Section Builder */}
      <FormSectionBuilder
        sections={config?.formSections || []}
        onSectionsChange={(sections) => {
          setConfig(prev => ({ ...prev!, formSections: sections }));
        }}
      />

      {/* Field Type Library */}
      <FieldTypeLibrary
        onFieldAdd={(field) => {
          // Add field to current section
        }}
      />

      {/* Preview */}
      <BaselineFormPreview config={config} />

      {/* Save Configuration */}
      <Button onClick={saveConfiguration}>
        Save Configuration
      </Button>
    </div>
  );
};
```

### Documentation for Clinical Teams

#### Form Customization Checklist

1. **Medical Requirements Analysis**

   - [ ] Identify required clinical data points
   - [ ] Define validation rules and constraints
   - [ ] Determine conditional logic requirements
   - [ ] Plan section organization and user flow

2. **Technical Configuration**

   - [ ] Create team-specific config file
   - [ ] Define form sections and fields
   - [ ] Set up validation schemas
   - [ ] Configure conditional display rules
   - [ ] Test form functionality

3. **Validation & Testing**

   - [ ] Verify all required fields capture correctly
   - [ ] Test conditional logic and field dependencies
   - [ ] Validate data storage and retrieval
   - [ ] Ensure proper permissions and team scoping
   - [ ] Test form performance with large datasets

4. **Deployment & Training**
   - [ ] Deploy configuration to production
   - [ ] Train clinical staff on new forms
   - [ ] Document team-specific workflows
   - [ ] Set up monitoring and error tracking

#### Field Type Reference

**Available Field Types:**

- `text` - Single line text input
- `textarea` - Multi-line text input
- `number` - Numeric input with validation
- `select` - Single selection dropdown
- `multiselect` - Multiple selection dropdown
- `checkbox-severity` - Checkboxes with severity scales
- `cascading-select` - Dependent dropdown selections
- `date` - Date picker input
- `radio` - Radio button groups

**Severity Scale Options:**

- 0-10 Numeric scale
- 1-4 Severity levels (Mild, Moderate, Severe, Very Severe)
- 1-5 Likert scale (Never, Rarely, Sometimes, Often, Always)
- Custom labels with descriptions

## Future Extensibility

### Assessment Categories

The PatientBaseline model and form architecture is designed to support future assessment types:
• **PRO Assessments**: Patient-reported outcome measures
• **Follow-up Assessments**: Regular monitoring forms
• **Treatment Response**: Efficacy and toxicity assessments

### Integration Points

• **Dynamic Forms**: Ready for integration with dynamic form template system
• **External Systems**: API structure supports integration with clinical databases
• **Analytics**: Assessment data structure supports advanced reporting and analytics

### Scalability Considerations

• **Multi-language Support**: Form components ready for internationalization
• **Custom Fields**: JSON storage allows for team-specific custom fields
• **Workflow Integration**: Assessment creation can trigger automated workflows
• **Data Export**: Assessment data structured for research and regulatory reporting

This specification provides a comprehensive roadmap for implementing patient detail pages with clinical baseline data collection while maintaining consistency with existing architectural patterns and ensuring HIPAA compliance.
