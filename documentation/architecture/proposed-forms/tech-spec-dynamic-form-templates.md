# Technical Specification: Dynamic Form Templates

## Architecture Overview

The dynamic form template system extends the existing multi-tenant SaaS architecture to support configurable patient intake forms. The system uses JSON-based template definitions to render forms dynamically while maintaining backward compatibility with existing patient data structures.

### Core Components

1. **Database Layer** - Template storage and versioning
2. **Template Engine** - JSON configuration processing
3. **Dynamic Form Renderer** - React components for form rendering
4. **Validation Engine** - Runtime validation from template config
5. **API Extensions** - Template-aware patient endpoints

## Database Schema

### New Tables

```sql
-- Form Templates
CREATE TABLE FormTemplate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'patient',
  description TEXT,
  config JSONB NOT NULL,
  created_by VARCHAR(255) NOT NULL REFERENCES User(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Form Template Assignments to Teams
CREATE TABLE FormAssignment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES FormTemplate(id),
  team_id UUID NOT NULL REFERENCES Team(id),
  version INTEGER NOT NULL DEFAULT 1,
  assigned_by VARCHAR(255) NOT NULL REFERENCES User(id),
  created_at TIMESTAMP DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);

CREATE INDEX idx_form_assignment_team ON FormAssignment(team_id, active);
CREATE INDEX idx_form_assignment_template ON FormAssignment(template_id);
```

### Schema Extensions

```sql
-- Extend existing Patient table
ALTER TABLE Patient ADD COLUMN form_assignment_id UUID REFERENCES FormAssignment(id);
CREATE INDEX idx_patient_form_assignment ON Patient(form_assignment_id);
```

## JSON Template Configuration

### Template Structure

```typescript
interface FormTemplate {
  name: string;
  category: 'patient' | 'baseline' | 'pro';
  description?: string;
  version: number;
  fields: FormField[];
  validation?: GlobalValidation;
  layout?: LayoutConfig;
}

interface FormField {
  name: string;
  type: FieldType;
  label: string;
  required?: boolean;
  placeholder?: string;
  description?: string;
  validation?: FieldValidation;
  conditional?: ConditionalConfig;
  options?: FieldOption[];
  subFields?: FormField[];
  layout?: FieldLayout;
}

type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'radio'
  | 'checkbox_group'
  | 'checkbox_group_with_severity'
  | 'cascading_select'
  | 'select';
```

### Complex Field Type Configurations

#### Checkbox Group with Severity

```json
{
  "name": "gastrointestinal_symptoms",
  "type": "checkbox_group_with_severity",
  "label": "Gastrointestinal",
  "required": false,
  "options": [
    {
      "value": "no_problems",
      "label": "NO PROBLEMS",
      "exclusive": true
    },
    {
      "value": "constipation",
      "label": "Constipation",
      "has_severity": true,
      "severity_scale": {
        "min": 1,
        "max": 4,
        "labels": ["Mild", "Moderate", "Severe", "Very Severe"]
      }
    },
    {
      "value": "vomiting",
      "label": "Vomiting",
      "has_severity": true,
      "severity_scale": {
        "min": 1,
        "max": 4,
        "labels": ["Mild", "Moderate", "Severe", "Very Severe"]
      }
    }
  ]
}
```

#### Cascading Select

```json
{
  "name": "line_of_treatment",
  "type": "cascading_select",
  "label": "Line Of Treatment",
  "required": true,
  "steps": [
    {
      "name": "treatment_status",
      "label": "Treatment Status",
      "options": [
        { "value": "front_line", "label": "Front-line" },
        { "value": "relapsed_refractory", "label": "Relapsed / Refractory" },
        { "value": "maintenance", "label": "Maintenance" }
      ]
    },
    {
      "name": "current_status",
      "label": "Current Status",
      "depends_on": "treatment_status",
      "options": [
        { "value": "on_treatment", "label": "On Treatment" },
        { "value": "off_treatment", "label": "Off Treatment" }
      ]
    }
  ]
}
```

#### Conditional Field Display

```json
{
  "name": "treatment_details",
  "type": "textarea",
  "label": "Treatment Details",
  "conditional": {
    "show_when": {
      "field": "line_of_treatment.current_status",
      "operator": "equals",
      "value": "on_treatment"
    }
  }
}
```

## Component Architecture

### Core Components

```typescript
// components/forms/DynamicForm.tsx
interface DynamicFormProps {
  template: FormTemplate;
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => Promise<void>;
  mode: 'create' | 'edit';
}

// components/forms/FieldRenderer.tsx
interface FieldRendererProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  errors?: Record<string, string>;
  formValues: Record<string, any>; // For conditional logic
}

// components/forms/fields/index.ts
export { TextInput } from './TextInput';
export { EmailInput } from './EmailInput';
export { PhoneInput } from './PhoneInput';
export { DatePicker } from './DatePicker';
export { RadioGroup } from './RadioGroup';
export { CheckboxGroup } from './CheckboxGroup';
export { CheckboxGroupWithSeverity } from './CheckboxGroupWithSeverity';
export { CascadingSelect } from './CascadingSelect';
```

### Complex Field Components

#### CheckboxGroupWithSeverity

```typescript
interface CheckboxWithSeverityOption {
  value: string;
  label: string;
  exclusive?: boolean;
  has_severity?: boolean;
  severity_scale?: {
    min: number;
    max: number;
    labels: string[];
  };
}

interface CheckboxGroupWithSeverityProps {
  field: FormField;
  value: Record<string, { selected: boolean; severity?: number }>;
  onChange: (
    value: Record<string, { selected: boolean; severity?: number }>
  ) => void;
  error?: string;
}
```

#### CascadingSelect

```typescript
interface CascadingSelectStep {
  name: string;
  label: string;
  options: FieldOption[];
  depends_on?: string;
}

interface CascadingSelectProps {
  field: FormField & { steps: CascadingSelectStep[] };
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  error?: string;
}
```

## Validation Engine

### Dynamic Zod Schema Generation

```typescript
// lib/validation/templateValidator.ts
export function generateZodSchema(template: FormTemplate): z.ZodSchema {
  const schemaFields: Record<string, z.ZodType> = {};

  template.fields.forEach((field) => {
    schemaFields[field.name] = createFieldValidator(field);
  });

  return z.object(schemaFields);
}

function createFieldValidator(field: FormField): z.ZodType {
  let validator: z.ZodType;

  switch (field.type) {
    case 'text':
      validator = z.string();
      if (field.validation?.minLength) {
        validator = validator.min(field.validation.minLength);
      }
      if (field.validation?.maxLength) {
        validator = validator.max(field.validation.maxLength);
      }
      break;

    case 'email':
      validator = z.string().email();
      break;

    case 'phone':
      validator = z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/);
      break;

    case 'checkbox_group_with_severity':
      validator = z.record(
        z.object({
          selected: z.boolean(),
          severity: z.number().min(1).max(4).optional(),
        })
      );
      break;

    case 'cascading_select':
      const stepValidators: Record<string, z.ZodType> = {};
      field.subFields?.forEach((step) => {
        stepValidators[step.name] = z.string();
      });
      validator = z.object(stepValidators);
      break;

    default:
      validator = z.string();
  }

  return field.required ? validator : validator.optional();
}
```

## API Extensions

### Template Management APIs

```typescript
// pages/api/admin/form-templates/index.ts
// GET - List all templates
// POST - Create new template (mQOL team only)

// pages/api/admin/form-templates/[templateId].ts
// GET - Get template by ID
// PUT - Update template (mQOL team only)
// DELETE - Delete template (mQOL team only)

// pages/api/teams/[slug]/form-assignment.ts
// GET - Get team's assigned form template
// POST - Assign template to team (mQOL team only)
```

### Modified Patient APIs

```typescript
// pages/api/teams/[slug]/patients/index.ts
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    // Return patients with form template info
    const patients = await getPatients(teamId);
    return res.json({ data: { patients } });
  }

  if (req.method === 'POST') {
    // Get team's assigned form template
    const formAssignment = await getTeamFormAssignment(teamId);
    const template = await getFormTemplate(formAssignment.template_id);

    // Validate against template schema
    const schema = generateZodSchema(template);
    const validatedData = schema.parse(req.body);

    // Transform and store data
    const patient = await createPatient({
      ...validatedData,
      teamId,
      form_assignment_id: formAssignment.id,
      createdBy: userId,
    });

    return res.json({ data: { patient } });
  }
}
```

## Data Storage Strategy

### Form Data Transformation

```typescript
// lib/forms/dataTransformer.ts
export function transformFormDataForStorage(
  formData: Record<string, any>,
  template: FormTemplate
): PatientCreateInput {
  const transformed: any = {};

  template.fields.forEach((field) => {
    const value = formData[field.name];

    switch (field.type) {
      case 'checkbox_group_with_severity':
        // Store as JSON: {"constipation": {"selected": true, "severity": 3}}
        transformed[field.name] = JSON.stringify(value);
        break;

      case 'cascading_select':
        // Store as JSON: {"treatment_status": "front_line", "current_status": "on_treatment"}
        transformed[field.name] = JSON.stringify(value);
        break;

      case 'text':
      case 'email':
      case 'phone':
        transformed[field.name] = value;
        break;

      default:
        transformed[field.name] = value;
    }
  });

  return transformed;
}
```

### Database Field Strategy

```sql
-- Extend Patient table with JSONB columns for complex data
ALTER TABLE Patient ADD COLUMN form_data JSONB;
CREATE INDEX idx_patient_form_data ON Patient USING GIN (form_data);

-- Simple fields remain as typed columns for query performance
-- Complex fields stored in form_data JSONB column
```

## Migration Strategy

### Default Template Creation

```sql
-- Create default patient template matching current schema
INSERT INTO FormTemplate (name, category, config, created_by) VALUES (
  'Default Patient Form',
  'patient',
  '{
    "name": "Default Patient Form",
    "category": "patient",
    "version": 1,
    "fields": [
      {
        "name": "firstName",
        "type": "text",
        "label": "First Name",
        "required": true,
        "validation": {"minLength": 2, "maxLength": 50}
      },
      {
        "name": "lastName",
        "type": "text",
        "label": "Last Name",
        "required": true,
        "validation": {"minLength": 2, "maxLength": 50}
      },
      {
        "name": "mobile",
        "type": "phone",
        "label": "Mobile Number",
        "required": true
      },
      {
        "name": "gender",
        "type": "radio",
        "label": "Gender",
        "required": true,
        "options": [
          {"value": "MALE", "label": "Male"},
          {"value": "FEMALE", "label": "Female"},
          {"value": "OTHER", "label": "Other"},
          {"value": "PREFER_NOT_TO_SAY", "label": "Prefer not to say"}
        ]
      }
    ]
  }',
  'system-user-id'
);
```

### Gradual Rollout Plan

1. **Phase 1** - Deploy infrastructure, keep existing forms
2. **Phase 2** - Assign default template to existing teams
3. **Phase 3** - Replace NewPatient component with DynamicForm
4. **Phase 4** - Create custom templates for specific teams
5. **Phase 5** - Migrate all teams to template-based forms

## Performance Considerations

### Optimization Strategies

1. **Template Caching** - Cache parsed templates in memory/Redis
2. **JSON Column Indexing** - Use GIN indexes for JSONB form_data queries
3. **Component Memoization** - Memoize field components to prevent re-renders
4. **Lazy Field Loading** - Load complex field types only when needed
5. **Validation Debouncing** - Debounce validation in complex forms

### Monitoring

```typescript
// Track form performance metrics
const formMetrics = {
  template_id: string;
  render_time: number;
  validation_time: number;
  submission_time: number;
  field_count: number;
  complex_field_count: number;
};
```

## Security Considerations

### Template Validation

- Validate JSON template structure before database insertion
- Sanitize field names to prevent injection attacks
- Limit template complexity (max fields, nesting depth)
- Restrict template creation to mQOL team members only

### Data Protection

- Maintain existing HIPAA compliance for form data
- Ensure form_data JSONB column follows retention policies
- Audit all template creation and assignment actions
- Validate that templates don't expose sensitive field combinations

## Testing Strategy

### Unit Tests

- Template validation logic
- Form field component rendering
- Data transformation functions
- Zod schema generation

### Integration Tests

- Template assignment API endpoints
- Patient creation with templates
- Form submission validation
- Database schema migrations

### E2E Tests

```typescript
// tests/e2e/dynamic-forms.spec.ts
test('Clinical user can fill out dynamic patient form', async ({ page }) => {
  // Navigate to patient creation
  await page.goto('/teams/test-clinic/patients');
  await page.click('[data-testid="add-patient"]');

  // Fill out cascading select
  await page.selectOption('[data-testid="treatment_status"]', 'front_line');
  await page.selectOption('[data-testid="current_status"]', 'on_treatment');

  // Fill checkbox with severity
  await page.check('[data-testid="constipation"]');
  await page.click('[data-testid="constipation-severity-3"]');

  // Submit form
  await page.click('[data-testid="submit"]');

  // Verify patient created
  await expect(page.locator('[data-testid="patient-list"]')).toContainText(
    'John Doe'
  );
});
```

## Deployment Plan

### Database Migration

1. Create new tables (FormTemplate, FormAssignment)
2. Add form_assignment_id to Patient table
3. Create default template and assignments
4. Verify data integrity

### Code Deployment

1. Deploy dynamic form components
2. Update patient API endpoints
3. Replace NewPatient with DynamicForm
4. Monitor error rates and performance

### Rollback Strategy

- Keep existing hardcoded components as backup
- Feature flag to switch between old/new forms
- Database rollback scripts for schema changes
- Template deactivation without code changes
