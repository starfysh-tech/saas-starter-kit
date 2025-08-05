import {
  fetchPatientBaselineById,
  updatePatientBaseline,
  softDeletePatientBaseline,
} from 'models/patientBaseline';
import { fetchPatientById } from 'models/patient';
import { getCurrentUserWithTeam, throwIfNoTeamAccess } from 'models/team';
import { throwIfNotAllowed } from 'models/user';
import type { NextApiRequest, NextApiResponse } from 'next';
import { recordMetric } from '@/lib/metrics';
import { sendAudit } from '@/lib/retraced';
import env from '@/lib/env';
import { ApiError } from '@/lib/errors';
import {
  getPatientBaselineSchema,
  updatePatientBaselineSchema,
  deletePatientBaselineSchema,
  baselineAssessmentDataSchema,
  validateWithSchema,
} from '@/lib/zod';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (!env.teamFeatures.patients) {
      throw new ApiError(404, 'Not Found');
    }

    await throwIfNoTeamAccess(req, res);

    switch (req.method) {
      case 'GET':
        await handleGET(req, res);
        break;
      case 'PUT':
        await handlePUT(req, res);
        break;
      case 'DELETE':
        await handleDELETE(req, res);
        break;
      default:
        res.setHeader('Allow', 'GET, PUT, DELETE');
        res.status(405).json({
          error: { message: `Method ${req.method} Not Allowed` },
        });
    }
  } catch (error: any) {
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;

    res.status(status).json({ error: { message } });
  }
}

// Get specific patient baseline
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await getCurrentUserWithTeam(req, res);

  throwIfNotAllowed(user, 'team_patient_baseline', 'read');

  const { patientId, baselineId } = req.query;

  validateWithSchema(getPatientBaselineSchema, { patientId, baselineId });

  if (typeof patientId !== 'string' || typeof baselineId !== 'string') {
    throw new ApiError(400, 'Patient ID and Baseline ID are required');
  }

  // Verify patient exists and belongs to team
  await fetchPatientById(user.team.id, patientId);

  const baseline = await fetchPatientBaselineById(
    user.team.id,
    patientId,
    baselineId
  );

  recordMetric('patient_baseline.fetched');

  res.status(200).json(baseline);
};

// Update patient baseline
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await getCurrentUserWithTeam(req, res);

  throwIfNotAllowed(user, 'team_patient_baseline', 'update');

  const { patientId, baselineId } = req.query;

  validateWithSchema(getPatientBaselineSchema, { patientId, baselineId });

  if (typeof patientId !== 'string' || typeof baselineId !== 'string') {
    throw new ApiError(400, 'Patient ID and Baseline ID are required');
  }

  // Verify patient exists and belongs to team
  await fetchPatientById(user.team.id, patientId);

  // Verify baseline exists
  await fetchPatientBaselineById(user.team.id, patientId, baselineId);

  // Check if the request contains new clinical data structure
  const has_clinical_data =
    req.body.symptoms ||
    req.body.treatments ||
    req.body.clinical_measurements ||
    req.body.performance_status;

  let update_data;

  if (has_clinical_data) {
    // Validate new clinical assessment data
    const validated_clinical_data = validateWithSchema(
      baselineAssessmentDataSchema,
      req.body
    );

    // Convert clinical data to baseline format
    update_data = {
      dateRecorded: validated_clinical_data.assessment_date,
      notes: validated_clinical_data.assessor_notes,
      // Store clinical data in JSON fields
      vitalSigns: validated_clinical_data.clinical_measurements,
      medications: validated_clinical_data.treatments?.medications,
      // Store complex clinical data in chronicConditions field temporarily
      chronicConditions: {
        symptoms: validated_clinical_data.symptoms,
        treatments: validated_clinical_data.treatments,
        performance_status: validated_clinical_data.performance_status,
        demographics: validated_clinical_data.demographics,
        custom_fields: validated_clinical_data.custom_fields,
      },
      updatedBy: user.id,
    };
  } else {
    // Handle legacy baseline data structure
    const validatedData = validateWithSchema(
      updatePatientBaselineSchema,
      req.body
    );

    update_data = {
      ...validatedData,
      updatedBy: user.id,
    };
  }

  const updatedBaseline = await updatePatientBaseline(
    user.team.id,
    patientId,
    baselineId,
    update_data
  );

  await sendAudit({
    action: 'patient_baseline.updated',
    crud: 'u',
    user,
    team: user.team,
  });

  recordMetric('patient_baseline.updated');

  res.status(200).json(updatedBaseline);
};

// Archive patient baseline (HIPAA-compliant soft delete)
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await getCurrentUserWithTeam(req, res);

  throwIfNotAllowed(user, 'team_patient_baseline', 'delete');

  const { patientId, baselineId } = req.query;

  validateWithSchema(deletePatientBaselineSchema, {
    patientId,
    baselineId,
    ...req.body,
  });

  if (typeof patientId !== 'string' || typeof baselineId !== 'string') {
    throw new ApiError(400, 'Patient ID and Baseline ID are required');
  }

  // Verify patient exists and belongs to team
  await fetchPatientById(user.team.id, patientId);

  // Verify baseline exists
  await fetchPatientBaselineById(user.team.id, patientId, baselineId);

  const { deletionReason } = req.body;

  const archivedBaseline = await softDeletePatientBaseline(
    user.team.id,
    patientId,
    baselineId,
    {
      deletedBy: user.id,
      deletionReason: deletionReason || 'Patient baseline archived through API',
    }
  );

  await sendAudit({
    action: 'patient_baseline.archived',
    crud: 'd',
    user,
    team: user.team,
  });

  recordMetric('patient_baseline.archived');

  res.status(200).json(archivedBaseline);
};
