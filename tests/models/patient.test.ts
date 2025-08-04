import { Gender } from '@prisma/client';
import {
  createPatient,
  fetchPatients,
  fetchPatientById,
  updatePatient,
  deletePatient,
  getPatientCount,
} from '@/models/patient';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    patient: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirstOrThrow: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Patient Model', () => {
  const mockTeamId = 'team-123';
  const mockUserId = 'user-123';
  const mockPatientId = 'patient-123';

  const mockPatient = {
    id: mockPatientId,
    teamId: mockTeamId,
    firstName: 'John',
    lastName: 'Doe',
    mobile: '+1234567890',
    gender: Gender.MALE,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: mockUserId,
    updatedBy: null,
    creator: {
      name: 'Test User',
      email: 'test@example.com',
    },
    updater: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPatient', () => {
    it('should create a patient with valid data', async () => {
      const createParams = {
        teamId: mockTeamId,
        firstName: 'John',
        lastName: 'Doe',
        mobile: '+1234567890',
        gender: Gender.MALE,
        createdBy: mockUserId,
      };

      mockPrisma.patient.create.mockResolvedValue(mockPatient);

      const result = await createPatient(createParams);

      expect(mockPrisma.patient.create).toHaveBeenCalledWith({
        data: {
          teamId: mockTeamId,
          firstName: 'John',
          lastName: 'Doe',
          mobile: '+1234567890',
          gender: Gender.MALE,
          createdBy: mockUserId,
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

      expect(result).toEqual(mockPatient);
    });

    it('should create a patient with minimal required data', async () => {
      const createParams = {
        teamId: mockTeamId,
        firstName: 'Jane',
        lastName: 'Smith',
        createdBy: mockUserId,
      };

      const minimalPatient = {
        ...mockPatient,
        firstName: 'Jane',
        lastName: 'Smith',
        mobile: null,
        gender: null,
      };

      mockPrisma.patient.create.mockResolvedValue(minimalPatient);

      const result = await createPatient(createParams);

      expect(mockPrisma.patient.create).toHaveBeenCalledWith({
        data: {
          teamId: mockTeamId,
          firstName: 'Jane',
          lastName: 'Smith',
          mobile: undefined,
          gender: undefined,
          createdBy: mockUserId,
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

      expect(result).toEqual(minimalPatient);
    });
  });

  describe('fetchPatients', () => {
    const mockPatientsResult = [
      {
        id: 'patient-1',
        firstName: 'John',
        lastName: 'Doe',
        mobile: '+1234567890',
        gender: Gender.MALE,
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: { name: 'Test User', email: 'test@example.com' },
      },
      {
        id: 'patient-2',
        firstName: 'Jane',
        lastName: 'Smith',
        mobile: null,
        gender: Gender.FEMALE,
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: { name: 'Test User', email: 'test@example.com' },
      },
    ];

    it('should fetch patients with default pagination', async () => {
      mockPrisma.patient.findMany.mockResolvedValue(mockPatientsResult);
      mockPrisma.patient.count.mockResolvedValue(2);

      const result = await fetchPatients(mockTeamId);

      expect(mockPrisma.patient.findMany).toHaveBeenCalledWith({
        where: { teamId: mockTeamId },
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
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });

      expect(mockPrisma.patient.count).toHaveBeenCalledWith({
        where: { teamId: mockTeamId },
      });

      expect(result).toEqual({
        patients: mockPatientsResult,
        total: 2,
        hasMore: false,
      });
    });

    it('should fetch patients with search filter', async () => {
      mockPrisma.patient.findMany.mockResolvedValue([mockPatientsResult[0]]);
      mockPrisma.patient.count.mockResolvedValue(1);

      const result = await fetchPatients(mockTeamId, { search: 'John' });

      expect(mockPrisma.patient.findMany).toHaveBeenCalledWith({
        where: {
          teamId: mockTeamId,
          OR: [
            { firstName: { contains: 'John', mode: 'insensitive' } },
            { lastName: { contains: 'John', mode: 'insensitive' } },
            { mobile: { contains: 'John', mode: 'insensitive' } },
          ],
        },
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
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });

      expect(result.patients).toHaveLength(1);
    });

    it('should fetch patients with custom pagination', async () => {
      mockPrisma.patient.findMany.mockResolvedValue(mockPatientsResult);
      mockPrisma.patient.count.mockResolvedValue(25);

      const result = await fetchPatients(mockTeamId, {
        limit: 10,
        offset: 10,
      });

      expect(mockPrisma.patient.findMany).toHaveBeenCalledWith({
        where: { teamId: mockTeamId },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 10,
      });

      expect(result.hasMore).toBe(true);
    });
  });

  describe('fetchPatientById', () => {
    it('should fetch a specific patient by id', async () => {
      const mockPatientWithUpdater = {
        ...mockPatient,
        updater: { name: 'Update User', email: 'updater@example.com' },
      };

      mockPrisma.patient.findFirstOrThrow.mockResolvedValue(
        mockPatientWithUpdater
      );

      const result = await fetchPatientById(mockTeamId, mockPatientId);

      expect(mockPrisma.patient.findFirstOrThrow).toHaveBeenCalledWith({
        where: {
          id: mockPatientId,
          teamId: mockTeamId,
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

      expect(result).toEqual(mockPatientWithUpdater);
    });

    it('should throw error when patient not found', async () => {
      mockPrisma.patient.findFirstOrThrow.mockRejectedValue(
        new Error('Patient not found')
      );

      await expect(
        fetchPatientById(mockTeamId, 'non-existent-id')
      ).rejects.toThrow('Patient not found');
    });

    it('should enforce team scoping', async () => {
      await fetchPatientById('different-team', mockPatientId);

      expect(mockPrisma.patient.findFirstOrThrow).toHaveBeenCalledWith({
        where: {
          id: mockPatientId,
          teamId: 'different-team',
        },
        include: expect.any(Object),
      });
    });
  });

  describe('updatePatient', () => {
    it('should update a patient with valid data', async () => {
      const updateParams = {
        firstName: 'Johnny',
        lastName: 'Doe',
        mobile: '+9876543210',
        gender: Gender.MALE,
        updatedBy: mockUserId,
      };

      const updatedPatient = {
        ...mockPatient,
        ...updateParams,
        updatedAt: new Date(),
      };

      mockPrisma.patient.update.mockResolvedValue(updatedPatient);

      const result = await updatePatient(
        mockTeamId,
        mockPatientId,
        updateParams
      );

      expect(mockPrisma.patient.update).toHaveBeenCalledWith({
        where: {
          id: mockPatientId,
          teamId: mockTeamId,
        },
        data: {
          firstName: 'Johnny',
          lastName: 'Doe',
          mobile: '+9876543210',
          gender: Gender.MALE,
          updatedBy: mockUserId,
          updatedAt: expect.any(Date),
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

      expect(result).toEqual(updatedPatient);
    });

    it('should update partial patient data', async () => {
      const updateParams = {
        firstName: 'Johnny',
        updatedBy: mockUserId,
      };

      const updatedPatient = {
        ...mockPatient,
        firstName: 'Johnny',
        updatedBy: mockUserId,
        updatedAt: new Date(),
      };

      mockPrisma.patient.update.mockResolvedValue(updatedPatient);

      const result = await updatePatient(
        mockTeamId,
        mockPatientId,
        updateParams
      );

      expect(mockPrisma.patient.update).toHaveBeenCalledWith({
        where: {
          id: mockPatientId,
          teamId: mockTeamId,
        },
        data: {
          firstName: 'Johnny',
          lastName: undefined,
          mobile: undefined,
          gender: undefined,
          updatedBy: mockUserId,
          updatedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });

      expect(result).toEqual(updatedPatient);
    });
  });

  describe('deletePatient', () => {
    it('should delete a patient', async () => {
      mockPrisma.patient.delete.mockResolvedValue(mockPatient);

      const result = await deletePatient(mockTeamId, mockPatientId);

      expect(mockPrisma.patient.delete).toHaveBeenCalledWith({
        where: {
          id: mockPatientId,
          teamId: mockTeamId,
        },
      });

      expect(result).toEqual(mockPatient);
    });

    it('should enforce team scoping when deleting', async () => {
      await deletePatient('different-team', mockPatientId);

      expect(mockPrisma.patient.delete).toHaveBeenCalledWith({
        where: {
          id: mockPatientId,
          teamId: 'different-team',
        },
      });
    });
  });

  describe('getPatientCount', () => {
    it('should return patient count for a team', async () => {
      mockPrisma.patient.count.mockResolvedValue(42);

      const result = await getPatientCount(mockTeamId);

      expect(mockPrisma.patient.count).toHaveBeenCalledWith({
        where: {
          teamId: mockTeamId,
        },
      });

      expect(result).toBe(42);
    });

    it('should return zero for team with no patients', async () => {
      mockPrisma.patient.count.mockResolvedValue(0);

      const result = await getPatientCount(mockTeamId);

      expect(result).toBe(0);
    });
  });
});
