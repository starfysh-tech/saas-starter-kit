import { createPatient, fetchPatients } from 'models/patient';
import { getCurrentUserWithTeam, throwIfNoTeamAccess } from 'models/team';
import { throwIfNotAllowed } from 'models/user';
import type { NextApiRequest, NextApiResponse } from 'next';
import { recordMetric } from '@/lib/metrics';
import env from '@/lib/env';
import { ApiError } from '@/lib/errors';
import { createPatientSchema, validateWithSchema } from '@/lib/zod';

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

// Get patients with pagination, search, and filtering
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await getCurrentUserWithTeam(req, res);

  throwIfNotAllowed(user, 'team_patient', 'read');

  const { search, limit, offset } = req.query;

  const options = {
    search: typeof search === 'string' ? search : undefined,
    limit: limit ? parseInt(limit as string, 10) : undefined,
    offset: offset ? parseInt(offset as string, 10) : undefined,
  };

  const result = await fetchPatients(user.team.id, options);

  recordMetric('patient.fetched');

  res.json({
    data: result.patients,
    pagination: {
      total: result.total,
      hasMore: result.hasMore,
      limit: options.limit || 50,
      offset: options.offset || 0,
    },
  });
};

// Create a patient
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await getCurrentUserWithTeam(req, res);

  throwIfNotAllowed(user, 'team_patient', 'create');

  const { firstName, lastName, mobile, gender } = validateWithSchema(
    createPatientSchema,
    req.body
  );

  const patient = await createPatient({
    teamId: user.team.id,
    firstName,
    lastName,
    mobile,
    gender,
    createdBy: user.id,
  });

  recordMetric('patient.created');

  res.status(201).json({ data: { patient } });
};
