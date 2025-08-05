import { getCurrentUserWithTeam, throwIfNoTeamAccess } from 'models/team';
import { throwIfNotAllowed } from 'models/user';
import { NextApiRequest, NextApiResponse } from 'next';
import { sendAudit } from '@/lib/retraced';
import { recordMetric } from '@/lib/metrics';
import { prisma } from '@/lib/prisma';
import type {
  BaselineFormConfig,
  CreateTeamFormConfigRequest,
  UpdateTeamFormConfigRequest,
} from '../../../../../types/teamFormConfig';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await throwIfNoTeamAccess(req, res);

    switch (req.method) {
      case 'GET':
        return await handleGET(req, res);
      case 'PUT':
        return await handlePUT(req, res);
      case 'POST':
        if (req.body.action === 'reset') {
          return await handleRESET(req, res);
        }
        return await handlePOST(req, res);
      default:
        res.setHeader('Allow', 'GET, PUT, POST');
        return res.status(405).json({
          error: {
            message: `Method ${req.method} Not Allowed`,
          },
        });
    }
  } catch (error: any) {
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;
    res.status(status).json({ error: { message } });
  }
}

async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const user = await getCurrentUserWithTeam(req, res);

  throwIfNotAllowed(user, 'team_patient_baseline', 'read');

  try {
    const form_config = await prisma.teamFormConfig.findUnique({
      where: {
        teamId_formType: {
          teamId: user.team.id,
          formType: 'baseline_assessment',
        },
      },
    });

    // If no config exists, return a default oncology config
    if (!form_config) {
      const { DEFAULT_ONCOLOGY_CONFIG } = await import(
        '../../../../../types/teamFormConfig'
      );
      return res.status(200).json({
        data: {
          id: null,
          teamId: user.team.id,
          formType: 'baseline_assessment',
          config: DEFAULT_ONCOLOGY_CONFIG,
          createdAt: null,
          updatedAt: null,
          createdBy: null,
          updatedBy: null,
          is_default: true,
        },
      });
    }

    recordMetric('patient.fetched');

    return res.status(200).json({
      data: {
        ...form_config,
        is_default: false,
      },
    });
  } catch (error: any) {
    console.error('Error fetching baseline config:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to fetch baseline configuration',
      },
    });
  }
}

async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  const user = await getCurrentUserWithTeam(req, res);

  throwIfNotAllowed(user, 'team_patient_baseline', 'create');

  try {
    const { config }: CreateTeamFormConfigRequest = req.body;

    if (!config) {
      return res.status(400).json({
        error: {
          message: 'Configuration data is required',
        },
      });
    }

    const form_config = await prisma.teamFormConfig.create({
      data: {
        teamId: user.team.id,
        formType: 'baseline_assessment',
        config: config as any,
        createdBy: user.id,
        updatedBy: user.id,
      },
    });

    // Record activity
    await sendAudit({
      action: 'patient.create',
      crud: 'c',
      user,
      team: user.team,
    });

    recordMetric('patient.created');

    return res.status(201).json({
      data: form_config,
    });
  } catch (error: any) {
    console.error('Error creating baseline config:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to create baseline configuration',
      },
    });
  }
}

async function handlePUT(req: NextApiRequest, res: NextApiResponse) {
  const user = await getCurrentUserWithTeam(req, res);

  throwIfNotAllowed(user, 'team_patient_baseline', 'update');

  try {
    const { config }: UpdateTeamFormConfigRequest = req.body;

    if (!config) {
      return res.status(400).json({
        error: {
          message: 'Configuration data is required',
        },
      });
    }

    const form_config = await prisma.teamFormConfig.upsert({
      where: {
        teamId_formType: {
          teamId: user.team.id,
          formType: 'baseline_assessment',
        },
      },
      update: {
        config: config as any,
        updatedBy: user.id,
      },
      create: {
        teamId: user.team.id,
        formType: 'baseline_assessment',
        config: config as any,
        createdBy: user.id,
        updatedBy: user.id,
      },
    });

    // Record activity
    await sendAudit({
      action: 'patient.update',
      crud: 'u',
      user,
      team: user.team,
    });

    recordMetric('patient.updated');

    return res.status(200).json({
      data: form_config,
    });
  } catch (error: any) {
    console.error('Error updating baseline config:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to update baseline configuration',
      },
    });
  }
}

async function handleRESET(req: NextApiRequest, res: NextApiResponse) {
  const user = await getCurrentUserWithTeam(req, res);

  throwIfNotAllowed(user, 'team_patient_baseline', 'update');

  try {
    const { specialty } = req.body;

    let default_config: BaselineFormConfig;

    switch (specialty) {
      case 'oncology': {
        const { DEFAULT_ONCOLOGY_CONFIG } = await import(
          '../../../../../types/teamFormConfig'
        );
        default_config = DEFAULT_ONCOLOGY_CONFIG;
        break;
      }
      case 'cardiology': {
        const { DEFAULT_CARDIOLOGY_CONFIG } = await import(
          '../../../../../types/teamFormConfig'
        );
        default_config = DEFAULT_CARDIOLOGY_CONFIG;
        break;
      }
      default:
        return res.status(400).json({
          error: {
            message:
              'Invalid specialty. Supported specialties: oncology, cardiology',
          },
        });
    }

    const form_config = await prisma.teamFormConfig.upsert({
      where: {
        teamId_formType: {
          teamId: user.team.id,
          formType: 'baseline_assessment',
        },
      },
      update: {
        config: default_config as any,
        updatedBy: user.id,
      },
      create: {
        teamId: user.team.id,
        formType: 'baseline_assessment',
        config: default_config as any,
        createdBy: user.id,
        updatedBy: user.id,
      },
    });

    // Record activity
    await sendAudit({
      action: 'patient.update',
      crud: 'u',
      user,
      team: user.team,
    });

    recordMetric('patient.updated');

    return res.status(200).json({
      data: form_config,
    });
  } catch (error: any) {
    console.error('Error resetting baseline config:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to reset baseline configuration',
      },
    });
  }
}
