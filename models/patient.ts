import { prisma } from '@/lib/prisma';
import { Gender } from '@prisma/client';

interface CreatePatientParams {
  teamId: string;
  firstName: string;
  lastName: string;
  mobile?: string;
  gender?: Gender;
  createdBy: string;
}

interface UpdatePatientParams {
  firstName?: string;
  lastName?: string;
  mobile?: string;
  gender?: Gender;
  updatedBy: string;
}

interface FetchPatientsOptions {
  search?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

interface SoftDeletePatientParams {
  deletedBy: string;
  deletionReason?: string;
  retentionUntil?: Date;
}

export const createPatient = async (params: CreatePatientParams) => {
  const { teamId, firstName, lastName, mobile, gender, createdBy } = params;

  return await prisma.patient.create({
    data: {
      teamId,
      firstName,
      lastName,
      mobile,
      gender,
      createdBy,
    },
    include: {
      creator: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
};

export const fetchPatients = async (
  teamId: string,
  options?: FetchPatientsOptions
) => {
  const { search, limit = 50, offset = 0, includeDeleted = false } = options || {};

  const where = {
    teamId,
    ...(!includeDeleted && { deletedAt: null }),
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
        { mobile: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        mobile: true,
        gender: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    }),
    prisma.patient.count({ where }),
  ]);

  return {
    patients,
    total,
    hasMore: offset + limit < total,
  };
};

export const fetchPatientById = async (teamId: string, patientId: string, includeDeleted = false) => {
  return await prisma.patient.findFirstOrThrow({
    where: {
      id: patientId,
      teamId,
      ...(!includeDeleted && { deletedAt: null }),
    },
    include: {
      creator: {
        select: {
          name: true,
          email: true,
        },
      },
      updater: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
};

export const updatePatient = async (
  teamId: string,
  patientId: string,
  params: UpdatePatientParams
) => {
  const { firstName, lastName, mobile, gender, updatedBy } = params;

  return await prisma.patient.update({
    where: {
      id: patientId,
      teamId,
    },
    data: {
      firstName,
      lastName,
      mobile,
      gender,
      updatedBy,
      updatedAt: new Date(),
    },
    include: {
      creator: {
        select: {
          name: true,
          email: true,
        },
      },
      updater: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
};

export const softDeletePatient = async (
  teamId: string,
  patientId: string,
  params: SoftDeletePatientParams
) => {
  const { deletedBy, deletionReason, retentionUntil } = params;
  
  const defaultRetentionYears = 7;
  const calculatedRetentionUntil = retentionUntil || 
    new Date(Date.now() + defaultRetentionYears * 365 * 24 * 60 * 60 * 1000);

  return await prisma.patient.update({
    where: {
      id: patientId,
      teamId,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
      deletedBy,
      deletionReason,
      retentionUntil: calculatedRetentionUntil,
      updatedAt: new Date(),
      updatedBy: deletedBy,
    },
    include: {
      creator: {
        select: {
          name: true,
          email: true,
        },
      },
      deleter: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
};

export const canHardDeletePatient = async (
  teamId: string,
  patientId: string
): Promise<boolean> => {
  const patient = await prisma.patient.findFirst({
    where: {
      id: patientId,
      teamId,
      deletedAt: { not: null },
    },
    select: {
      retentionUntil: true,
    },
  });

  if (!patient || !patient.retentionUntil) {
    return false;
  }

  return new Date() >= patient.retentionUntil;
};

export const hardDeletePatient = async (
  teamId: string,
  patientId: string
) => {
  const canDelete = await canHardDeletePatient(teamId, patientId);
  
  if (!canDelete) {
    throw new Error('Patient retention period has not expired. Cannot permanently delete.');
  }

  return await prisma.patient.delete({
    where: {
      id: patientId,
      teamId,
    },
  });
};

// Get patient count for a team (for dashboard stats)
export const getPatientCount = async (teamId: string, includeDeleted = false) => {
  return await prisma.patient.count({
    where: {
      teamId,
      ...(!includeDeleted && { deletedAt: null }),
    },
  });
};
