import { z } from 'zod';
import { slugify } from '../server-common';
import {
  teamName,
  apiKeyId,
  slug,
  domain,
  email,
  password,
  token,
  role,
  sentViaEmail,
  domains,
  expiredToken,
  sessionId,
  recaptchaToken,
  priceId,
  quantity,
  memberId,
  inviteToken,
  url,
  endpointId,
  sentViaEmailString,
  invitationId,
  name,
  image,
  eventTypes,
  patientName,
  mobile,
  gender,
  patientId,
  baselineId,
  height,
  weight,
  bloodPressure,
  heartRate,
  temperature,
  oxygenSat,
  bloodSugar,
  baselineNotes,
  dateRecorded,
} from './primitives';

export const createApiKeySchema = z.object({
  name: name(50),
});

export const deleteApiKeySchema = z.object({
  apiKeyId,
});

export const teamSlugSchema = z.object({
  slug,
});

export const updateTeamSchema = z.object({
  name: teamName,
  slug: slug.transform((slug) => slugify(slug)),
  domain,
  logo: image.optional(),
});

export const createTeamSchema = z.object({
  name: teamName,
});

export const updateAccountSchema = z.union([
  z.object({
    email,
  }),
  z.object({
    name: name(),
  }),
  z.object({
    image,
  }),
]);

export const updatePasswordSchema = z.object({
  currentPassword: password,
  newPassword: password,
});

export const userJoinSchema = z.union([
  z.object({
    team: teamName,
    slug,
  }),
  z.object({
    name: name(),
    email,
    password,
  }),
]);

export const resetPasswordSchema = z.object({
  password,
  token,
});

export const inviteViaEmailSchema = z.union([
  z.object({
    email,
    role,
    sentViaEmail,
  }),
  z.object({
    role,
    sentViaEmail,
    domains,
  }),
]);

export const resendLinkRequestSchema = z.object({
  email,
  expiredToken,
});

export const deleteSessionSchema = z.object({
  id: sessionId,
});

export const forgotPasswordSchema = z.object({
  email,
  recaptchaToken: recaptchaToken.optional(),
});

export const resendEmailToken = z.object({
  email,
});

export const checkoutSessionSchema = z.object({
  price: priceId,
  quantity: quantity.optional(),
});

export const updateMemberSchema = z.object({
  role,
  memberId,
});

export const acceptInvitationSchema = z.object({
  inviteToken,
});

export const getInvitationSchema = z.object({
  token: inviteToken,
});

export const webhookEndpointSchema = z.object({
  name: name(),
  url,
  eventTypes,
});

export const updateWebhookEndpointSchema = webhookEndpointSchema.extend({
  endpointId,
});

export const getInvitationsSchema = z.object({
  sentViaEmail: sentViaEmailString,
});

export const deleteInvitationSchema = z.object({
  id: invitationId,
});

export const getWebhookSchema = z.object({
  endpointId,
});

export const deleteWebhookSchema = z.object({
  webhookId: endpointId,
});

export const deleteMemberSchema = z.object({
  memberId,
});

// email or slug
export const ssoVerifySchema = z
  .object({
    email: email.optional().or(z.literal('')),
    slug: slug.optional().or(z.literal('')),
  })
  .refine((data) => data.email || data.slug, {
    message: 'At least one of email or slug is required',
  });

// Patient schemas
export const createPatientSchema = z.object({
  firstName: patientName,
  lastName: patientName,
  mobile,
  gender,
});

export const updatePatientSchema = z.object({
  firstName: patientName.optional(),
  lastName: patientName.optional(),
  mobile: mobile.optional(),
  gender: gender.optional(),
});

export const deletePatientSchema = z.object({
  patientId,
});

export const getPatientSchema = z.object({
  patientId,
});

// Patient Baseline schemas
export const createPatientBaselineSchema = z.object({
  dateRecorded,
  height: height.optional(),
  weight: weight.optional(),
  bloodPressure: bloodPressure.optional(),
  heartRate: heartRate.optional(),
  temperature: temperature.optional(),
  oxygenSat: oxygenSat.optional(),
  bloodSugar: bloodSugar.optional(),
  notes: baselineNotes.optional(),
  vitalSigns: z.any().optional(),
  labResults: z.any().optional(),
  medications: z.any().optional(),
  allergies: z.any().optional(),
  chronicConditions: z.any().optional(),
});

export const updatePatientBaselineSchema = z.object({
  height: height.optional(),
  weight: weight.optional(),
  bloodPressure: bloodPressure.optional(),
  heartRate: heartRate.optional(),
  temperature: temperature.optional(),
  oxygenSat: oxygenSat.optional(),
  bloodSugar: bloodSugar.optional(),
  notes: baselineNotes.optional(),
  vitalSigns: z.any().optional(),
  labResults: z.any().optional(),
  medications: z.any().optional(),
  allergies: z.any().optional(),
  chronicConditions: z.any().optional(),
});

export const getPatientBaselineSchema = z.object({
  patientId,
  baselineId,
});

export const deletePatientBaselineSchema = z.object({
  patientId,
  baselineId,
  deletionReason: z.string().optional(),
});

// Clinical form validation schemas
export const severityLevelSchema = z.enum([
  'mild',
  'moderate',
  'severe',
  'very_severe',
]);

export const symptomWithSeveritySchema = z.object({
  present: z.boolean(),
  severity: severityLevelSchema.optional(),
});

export const performanceStatusSchema = z.object({
  scale_type: z.enum(['ecog', 'karnofsky', 'nyha']),
  value: z.number().min(0).max(4),
  notes: z.string().optional(),
});

export const treatmentInformationSchema = z.object({
  line_of_treatment: z.array(z.string()).optional(),
  details: z.string().optional(),
  medications: z.array(z.string()).optional(),
});

export const clinicalMeasurementSchema = z.record(
  z.string(),
  z.union([z.number(), z.string()])
);

export const baselineAssessmentDataSchema = z
  .object({
    // Demographics
    demographics: z.record(z.string(), z.any()).optional(),

    // Symptoms with severity
    symptoms: z.record(z.string(), symptomWithSeveritySchema).optional(),

    // Treatment information
    treatments: treatmentInformationSchema.optional(),

    // Clinical measurements
    clinical_measurements: clinicalMeasurementSchema.optional(),

    // Performance status
    performance_status: performanceStatusSchema.optional(),

    // Custom fields
    custom_fields: z.record(z.string(), z.any()).optional(),

    // Assessment metadata
    assessment_date: z.coerce.date(),
    assessor_notes: z.string().optional(),
  })
  .refine(
    (data) => {
      // Cross-field validation: if symptom is present, severity should be provided if has_severity is true
      if (data.symptoms) {
        for (const [, symptom_data] of Object.entries(data.symptoms)) {
          if (symptom_data.present && !symptom_data.severity) {
            // This would normally check form config to see if severity is required
            // For now, we'll make it optional but this is where the logic would go
          }
        }
      }
      return true;
    },
    {
      message: 'Invalid symptom and severity combination',
    }
  );

// Team form configuration schemas
export const createTeamFormConfigSchema = z.object({
  formType: z.string(),
  config: z.any(), // We'll validate the specific config structure in the API
});

export const updateTeamFormConfigSchema = z.object({
  config: z.any(),
});

export const resetTeamFormConfigSchema = z.object({
  specialty: z.enum(['oncology', 'cardiology']),
});
