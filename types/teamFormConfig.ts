// Team Form Configuration Types
export interface SymptomConfig {
  id: string;
  label: string;
  required?: boolean;
  has_severity?: boolean;
  description?: string;
}

export interface MeasurementConfig {
  id: string;
  label: string;
  type: 'number' | 'select' | 'text';
  unit?: string;
  required?: boolean;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  description?: string;
}

export interface CascadingOption {
  value: string;
  label: string;
  children?: CascadingOption[];
}

export interface BaselineFormConfig {
  sections: {
    demographics: {
      enabled: boolean;
      fields?: string[]; // Field IDs to show
    };
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
      required?: boolean;
    };
    custom_fields?: {
      enabled: boolean;
      fields: CustomFieldConfig[];
    };
  };
  metadata?: {
    specialty?: string;
    version?: string;
    created_by?: string;
    description?: string;
  };
}

export interface CustomFieldConfig {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'radio' | 'textarea';
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  section: string; // Which section to display in
}

// Predefined specialty configurations
export interface SpecialtyConfig {
  name: string;
  description: string;
  config: BaselineFormConfig;
}

// Oncology-specific types
export interface OncologyConfig extends BaselineFormConfig {
  sections: BaselineFormConfig['sections'] & {
    staging: {
      enabled: boolean;
      staging_system: 'rss' | 'tnm' | 'custom';
      options: { value: string; label: string }[];
    };
    risk_stratification: {
      enabled: boolean;
      criteria: 'imwg' | 'custom';
      items: { id: string; label: string; description?: string }[];
    };
    ecog_status: {
      enabled: boolean;
      required?: boolean;
    };
  };
}

// Cardiology-specific types
export interface CardiologyConfig extends BaselineFormConfig {
  sections: BaselineFormConfig['sections'] & {
    nyha_class: {
      enabled: boolean;
      required?: boolean;
    };
    ejection_fraction: {
      enabled: boolean;
      required?: boolean;
      range: { min: number; max: number };
    };
    arrhythmias: {
      enabled: boolean;
      types: { id: string; label: string }[];
    };
  };
}

// Form submission data types
export interface BaselineAssessmentData {
  demographics?: Record<string, any>;
  symptoms?: Record<string, { present: boolean; severity?: string }>;
  treatments?: {
    line_of_treatment?: string[];
    details?: string;
    medications?: string[];
  };
  clinical_measurements?: Record<string, number | string>;
  performance_status?: {
    scale_type: 'ecog' | 'karnofsky' | 'nyha';
    value: number;
    notes?: string;
  };
  custom_fields?: Record<string, any>;
  assessment_date: Date;
  assessor_notes?: string;
}

// API response types
export interface TeamFormConfigResponse {
  id: string;
  teamId: string;
  formType: string;
  config: BaselineFormConfig;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface CreateTeamFormConfigRequest {
  formType: string;
  config: BaselineFormConfig;
}

export interface UpdateTeamFormConfigRequest {
  config: BaselineFormConfig;
}

// Default configurations
export const DEFAULT_ONCOLOGY_CONFIG: BaselineFormConfig = {
  sections: {
    demographics: {
      enabled: true,
      fields: ['age', 'diagnosis_date'],
    },
    symptoms: {
      enabled: true,
      items: [
        {
          id: 'fatigue',
          label: 'Fatigue',
          has_severity: true,
          required: false,
        },
        { id: 'nausea', label: 'Nausea', has_severity: true, required: false },
        { id: 'pain', label: 'Pain', has_severity: true, required: false },
        {
          id: 'appetite_loss',
          label: 'Loss of Appetite',
          has_severity: true,
          required: false,
        },
        {
          id: 'sleep_disturbance',
          label: 'Sleep Disturbance',
          has_severity: true,
          required: false,
        },
      ],
    },
    treatments: {
      enabled: true,
      cascading_options: [
        {
          value: 'chemotherapy',
          label: 'Chemotherapy',
          children: [
            { value: 'induction', label: 'Induction Therapy' },
            { value: 'maintenance', label: 'Maintenance Therapy' },
            { value: 'salvage', label: 'Salvage Therapy' },
          ],
        },
        {
          value: 'radiation',
          label: 'Radiation Therapy',
          children: [
            { value: 'external_beam', label: 'External Beam Radiation' },
            { value: 'brachytherapy', label: 'Brachytherapy' },
          ],
        },
        {
          value: 'surgery',
          label: 'Surgery',
          children: [
            { value: 'resection', label: 'Tumor Resection' },
            { value: 'biopsy', label: 'Biopsy' },
          ],
        },
      ],
    },
    clinical_measurements: {
      enabled: true,
      items: [
        {
          id: 'height',
          label: 'Height',
          type: 'number',
          unit: 'cm',
          required: true,
          min: 50,
          max: 250,
        },
        {
          id: 'weight',
          label: 'Weight',
          type: 'number',
          unit: 'kg',
          required: true,
          min: 20,
          max: 300,
        },
        {
          id: 'bmi',
          label: 'BMI',
          type: 'number',
          unit: 'kg/m²',
          required: false,
          min: 10,
          max: 60,
        },
      ],
    },
    performance_status: {
      enabled: true,
      scale_type: 'ecog',
      required: true,
    },
  },
  metadata: {
    specialty: 'oncology',
    version: '1.0',
    description: 'Standard oncology baseline assessment form',
  },
};

export const DEFAULT_CARDIOLOGY_CONFIG: BaselineFormConfig = {
  sections: {
    demographics: {
      enabled: true,
      fields: ['age', 'diagnosis_date'],
    },
    symptoms: {
      enabled: true,
      items: [
        {
          id: 'chest_pain',
          label: 'Chest Pain',
          has_severity: true,
          required: false,
        },
        {
          id: 'shortness_of_breath',
          label: 'Shortness of Breath',
          has_severity: true,
          required: false,
        },
        {
          id: 'palpitations',
          label: 'Palpitations',
          has_severity: true,
          required: false,
        },
        {
          id: 'fatigue',
          label: 'Fatigue',
          has_severity: true,
          required: false,
        },
        {
          id: 'edema',
          label: 'Swelling/Edema',
          has_severity: true,
          required: false,
        },
      ],
    },
    treatments: {
      enabled: true,
      cascading_options: [
        {
          value: 'medication',
          label: 'Cardiac Medications',
          children: [
            { value: 'ace_inhibitors', label: 'ACE Inhibitors' },
            { value: 'beta_blockers', label: 'Beta Blockers' },
            { value: 'diuretics', label: 'Diuretics' },
            { value: 'antiarrhythmics', label: 'Antiarrhythmic Drugs' },
          ],
        },
        {
          value: 'procedure',
          label: 'Cardiac Procedures',
          children: [
            { value: 'catheterization', label: 'Cardiac Catheterization' },
            { value: 'angioplasty', label: 'Angioplasty' },
            { value: 'stent', label: 'Stent Placement' },
            { value: 'bypass', label: 'Bypass Surgery' },
          ],
        },
        {
          value: 'device',
          label: 'Cardiac Devices',
          children: [
            { value: 'pacemaker', label: 'Pacemaker' },
            { value: 'icd', label: 'Implantable Cardioverter Defibrillator' },
            { value: 'crt', label: 'Cardiac Resynchronization Therapy' },
          ],
        },
      ],
    },
    clinical_measurements: {
      enabled: true,
      items: [
        {
          id: 'blood_pressure_systolic',
          label: 'Systolic BP',
          type: 'number',
          unit: 'mmHg',
          required: true,
          min: 60,
          max: 300,
        },
        {
          id: 'blood_pressure_diastolic',
          label: 'Diastolic BP',
          type: 'number',
          unit: 'mmHg',
          required: true,
          min: 30,
          max: 200,
        },
        {
          id: 'heart_rate',
          label: 'Heart Rate',
          type: 'number',
          unit: 'bpm',
          required: true,
          min: 30,
          max: 200,
        },
        {
          id: 'ejection_fraction',
          label: 'Ejection Fraction',
          type: 'number',
          unit: '%',
          required: false,
          min: 10,
          max: 80,
        },
      ],
    },
    performance_status: {
      enabled: true,
      scale_type: 'nyha',
      required: true,
    },
  },
  metadata: {
    specialty: 'cardiology',
    version: '1.0',
    description: 'Standard cardiology baseline assessment form',
  },
};
