import {
  createPatientBaseline,
  fetchPatientBaselines,
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
  createPatientBaselineSchema,
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
      case 'POST':
        await handlePOST(req, res);
        break;
      default:
        res.setHeader('Allow', 'GET, POST');
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

// Get patient baselines with pagination and filtering
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await getCurrentUserWithTeam(req, res);

  throwIfNotAllowed(user, 'team_patient_baseline', 'read');

  const { limit, offset, startDate, endDate } = req.query;
  const { patientId } = req.query;

  if (!patientId || typeof patientId !== 'string') {
    throw new ApiError(400, 'Patient ID is required');
  }

  // Verify patient exists and belongs to team
  await fetchPatientById(user.team.id, patientId);

  const options = {
    limit: limit ? parseInt(limit as string, 10) : undefined,
    offset: offset ? parseInt(offset as string, 10) : undefined,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
  };

  const result = await fetchPatientBaselines(user.team.id, patientId, options);

  recordMetric('patient_baseline.fetched');

  res.status(200).json({ data: result, error: null });
};

// Create new patient baseline
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await getCurrentUserWithTeam(req, res);

  throwIfNotAllowed(user, 'team_patient_baseline', 'create');

  const { patientId } = req.query;

  if (!patientId || typeof patientId !== 'string') {
    throw new ApiError(400, 'Patient ID is required');
  }

  // Verify patient exists and belongs to team
  await fetchPatientById(user.team.id, patientId);

  // Check if the request contains new clinical data structure
  const has_clinical_data =
    req.body.symptoms ||
    req.body.treatments ||
    req.body.clinical_measurements ||
    req.body.performance_status;

  let baseline;

  if (has_clinical_data) {
    // Validate new clinical assessment data
    const validated_clinical_data = validateWithSchema(
      baselineAssessmentDataSchema,
      req.body
    );

    // Convert clinical data to baseline format
    const baseline_data = {
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
    };

    baseline = await createPatientBaseline({
      teamId: user.team.id,
      patientId,
      createdBy: user.id,
      ...baseline_data,
    });
  } else {
    // Handle legacy baseline data structure
    const validatedData = validateWithSchema(
      createPatientBaselineSchema,
      req.body
    );

    baseline = await createPatientBaseline({
      teamId: user.team.id,
      patientId,
      createdBy: user.id,
      ...validatedData,
    });
  }

  await sendAudit({
    action: 'patient_baseline.created',
    crud: 'c',
    user,
    team: user.team,
  });

  recordMetric('patient_baseline.created');

  res.status(201).json(baseline);
};
