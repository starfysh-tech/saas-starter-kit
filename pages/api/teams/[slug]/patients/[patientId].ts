import { fetchPatientById, updatePatient, softDeletePatient } from 'models/patient';
import { getCurrentUserWithTeam, throwIfNoTeamAccess } from 'models/team';
import { throwIfNotAllowed } from 'models/user';
import type { NextApiRequest, NextApiResponse } from 'next';
import { recordMetric } from '@/lib/metrics';
import { sendAudit } from '@/lib/retraced';
import env from '@/lib/env';
import { ApiError } from '@/lib/errors';
import {
  getPatientSchema,
  updatePatientSchema,
  deletePatientSchema,
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

// Get individual patient details
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await getCurrentUserWithTeam(req, res);

  throwIfNotAllowed(user, 'team_patient', 'read');

  const { patientId } = validateWithSchema(getPatientSchema, req.query);

  try {
    const patient = await fetchPatientById(user.team.id, patientId);

    sendAudit({
      action: 'patient.view',
      crud: 'r',
      user,
      team: user.team,
    });

    recordMetric('patient.fetched');

    res.json({ data: patient });
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw new ApiError(404, 'Patient not found');
    }
    throw error;
  }
};

// Update patient
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await getCurrentUserWithTeam(req, res);

  throwIfNotAllowed(user, 'team_patient', 'update');

  const { patientId } = validateWithSchema(getPatientSchema, req.query);
  const updateData = validateWithSchema(updatePatientSchema, req.body);

  // Check if patient exists and belongs to team
  try {
    await fetchPatientById(user.team.id, patientId);
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw new ApiError(404, 'Patient not found');
    }
    throw error;
  }

  const patient = await updatePatient(user.team.id, patientId, {
    ...updateData,
    updatedBy: user.id,
  });

  sendAudit({
    action: 'patient.update',
    crud: 'u',
    user,
    team: user.team,
  });

  recordMetric('patient.updated');

  res.json({ data: patient });
};

// Delete patient
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await getCurrentUserWithTeam(req, res);

  throwIfNotAllowed(user, 'team_patient', 'delete');

  const { patientId } = validateWithSchema(deletePatientSchema, req.query);

  // Check if patient exists and belongs to team
  try {
    await fetchPatientById(user.team.id, patientId);
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw new ApiError(404, 'Patient not found');
    }
    throw error;
  }

  const deletionReason = req.body?.deletionReason || 'Patient record soft deleted';
  
  await softDeletePatient(user.team.id, patientId, {
    deletedBy: user.id,
    deletionReason,
  });

  sendAudit({
    action: 'patient.soft_delete',
    crud: 'd',
    user,
    team: user.team,
  });

  recordMetric('patient.removed');

  res.status(204).end();
};
