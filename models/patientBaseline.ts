import { prisma } from '@/lib/prisma';

interface CreatePatientBaselineParams {
  teamId: string;
  patientId: string;
  dateRecorded: Date;
  height?: number;
  weight?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  heartRate?: number;
  temperature?: number;
  oxygenSat?: number;
  bloodSugar?: number;
  notes?: string;
  vitalSigns?: any;
  labResults?: any;
  medications?: any;
  allergies?: any;
  chronicConditions?: any;
  createdBy: string;
}

interface UpdatePatientBaselineParams {
  height?: number;
  weight?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  heartRate?: number;
  temperature?: number;
  oxygenSat?: number;
  bloodSugar?: number;
  notes?: string;
  vitalSigns?: any;
  labResults?: any;
  medications?: any;
  allergies?: any;
  chronicConditions?: any;
  updatedBy: string;
}

interface FetchPatientBaselinesOptions {
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
  startDate?: Date;
  endDate?: Date;
}

interface SoftDeletePatientBaselineParams {
  deletedBy: string;
  deletionReason?: string;
  retentionUntil?: Date;
}

export const createPatientBaseline = async (
  params: CreatePatientBaselineParams
) => {
  const {
    teamId,
    patientId,
    dateRecorded,
    height,
    weight,
    bloodPressure,
    heartRate,
    temperature,
    oxygenSat,
    bloodSugar,
    notes,
    vitalSigns,
    labResults,
    medications,
    allergies,
    chronicConditions,
    createdBy,
  } = params;

  return await prisma.patientBaseline.create({
    data: {
      teamId,
      patientId,
      dateRecorded,
      height,
      weight,
      bloodPressure,
      heartRate,
      temperature,
      oxygenSat,
      bloodSugar,
      notes,
      vitalSigns,
      labResults,
      medications,
      allergies,
      chronicConditions,
      createdBy,
    },
    include: {
      creator: {
        select: {
          name: true,
          email: true,
        },
      },
      patient: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });
};

export const fetchPatientBaselines = async (
  teamId: string,
  patientId: string,
  options?: FetchPatientBaselinesOptions
) => {
  const {
    limit = 50,
    offset = 0,
    includeDeleted = false,
    startDate,
    endDate,
  } = options || {};

  const where = {
    teamId,
    patientId,
    ...(!includeDeleted && { deletedAt: null }),
    ...(startDate &&
      endDate && {
        dateRecorded: {
          gte: startDate,
          lte: endDate,
        },
      }),
  };

  const [baselines, total] = await Promise.all([
    prisma.patientBaseline.findMany({
      where,
      select: {
        id: true,
        dateRecorded: true,
        height: true,
        weight: true,
        bloodPressure: true,
        heartRate: true,
        temperature: true,
        oxygenSat: true,
        bloodSugar: true,
        notes: true,
        vitalSigns: true,
        labResults: true,
        medications: true,
        allergies: true,
        chronicConditions: true,
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
        dateRecorded: 'desc',
      },
      take: limit,
      skip: offset,
    }),
    prisma.patientBaseline.count({ where }),
  ]);

  return {
    baselines,
    total,
    hasMore: offset + limit < total,
  };
};

export const fetchPatientBaselineById = async (
  teamId: string,
  patientId: string,
  baselineId: string,
  includeDeleted = false
) => {
  return await prisma.patientBaseline.findFirstOrThrow({
    where: {
      id: baselineId,
      teamId,
      patientId,
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
      patient: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });
};

export const updatePatientBaseline = async (
  teamId: string,
  patientId: string,
  baselineId: string,
  params: UpdatePatientBaselineParams
) => {
  const {
    height,
    weight,
    bloodPressure,
    heartRate,
    temperature,
    oxygenSat,
    bloodSugar,
    notes,
    vitalSigns,
    labResults,
    medications,
    allergies,
    chronicConditions,
    updatedBy,
  } = params;

  return await prisma.patientBaseline.update({
    where: {
      id: baselineId,
      teamId,
      patientId,
    },
    data: {
      height,
      weight,
      bloodPressure,
      heartRate,
      temperature,
      oxygenSat,
      bloodSugar,
      notes,
      vitalSigns,
      labResults,
      medications,
      allergies,
      chronicConditions,
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
      patient: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });
};

export const softDeletePatientBaseline = async (
  teamId: string,
  patientId: string,
  baselineId: string,
  params: SoftDeletePatientBaselineParams
) => {
  const { deletedBy, deletionReason, retentionUntil } = params;

  const defaultRetentionYears = 7;
  const calculatedRetentionUntil =
    retentionUntil ||
    new Date(Date.now() + defaultRetentionYears * 365 * 24 * 60 * 60 * 1000);

  return await prisma.patientBaseline.update({
    where: {
      id: baselineId,
      teamId,
      patientId,
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
      patient: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });
};

export const canHardDeletePatientBaseline = async (
  teamId: string,
  patientId: string,
  baselineId: string
): Promise<boolean> => {
  const baseline = await prisma.patientBaseline.findFirst({
    where: {
      id: baselineId,
      teamId,
      patientId,
      deletedAt: { not: null },
    },
    select: {
      retentionUntil: true,
    },
  });

  if (!baseline || !baseline.retentionUntil) {
    return false;
  }

  return new Date() >= baseline.retentionUntil;
};

export const hardDeletePatientBaseline = async (
  teamId: string,
  patientId: string,
  baselineId: string
) => {
  const canDelete = await canHardDeletePatientBaseline(
    teamId,
    patientId,
    baselineId
  );

  if (!canDelete) {
    throw new Error(
      'Baseline retention period has not expired. Cannot permanently delete.'
    );
  }

  return await prisma.patientBaseline.delete({
    where: {
      id: baselineId,
      teamId,
      patientId,
    },
  });
};

// Get baseline count for a patient (for patient detail stats)
export const getPatientBaselineCount = async (
  teamId: string,
  patientId: string,
  includeDeleted = false
) => {
  return await prisma.patientBaseline.count({
    where: {
      teamId,
      patientId,
      ...(!includeDeleted && { deletedAt: null }),
    },
  });
};

// Get latest baseline for a patient
export const getLatestPatientBaseline = async (
  teamId: string,
  patientId: string,
  includeDeleted = false
) => {
  return await prisma.patientBaseline.findFirst({
    where: {
      teamId,
      patientId,
      ...(!includeDeleted && { deletedAt: null }),
    },
    orderBy: {
      dateRecorded: 'desc',
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
