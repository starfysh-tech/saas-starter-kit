import { NextApiRequest, NextApiResponse } from 'next';
import { Gender } from '@prisma/client';
import patientsIndexHandler from '@/pages/api/teams/[slug]/patients/index';
import patientDetailHandler from '@/pages/api/teams/[slug]/patients/[patientId]';
import {
  createPatient,
  fetchPatients,
  fetchPatientById,
  updatePatient,
  deletePatient,
} from '@/models/patient';
import { getCurrentUserWithTeam, throwIfNoTeamAccess } from '@/models/team';
import { throwIfNotAllowed } from '@/models/user';
import { recordMetric } from '@/lib/metrics';
import env from '@/lib/env';
import { validateWithSchema } from '@/lib/zod';

// Mock dependencies
jest.mock('@/models/patient');
jest.mock('@/models/team');
jest.mock('@/models/user');
jest.mock('@/lib/metrics');
jest.mock('@/lib/env');
jest.mock('@/lib/zod');

const mockCreatePatient = createPatient as jest.MockedFunction<
  typeof createPatient
>;
const mockFetchPatients = fetchPatients as jest.MockedFunction<
  typeof fetchPatients
>;
const mockFetchPatientById = fetchPatientById as jest.MockedFunction<
  typeof fetchPatientById
>;
const mockUpdatePatient = updatePatient as jest.MockedFunction<
  typeof updatePatient
>;
const mockDeletePatient = deletePatient as jest.MockedFunction<
  typeof deletePatient
>;
const mockGetCurrentUserWithTeam =
  getCurrentUserWithTeam as jest.MockedFunction<typeof getCurrentUserWithTeam>;
const mockThrowIfNoTeamAccess = throwIfNoTeamAccess as jest.MockedFunction<
  typeof throwIfNoTeamAccess
>;
const mockThrowIfNotAllowed = throwIfNotAllowed as jest.MockedFunction<
  typeof throwIfNotAllowed
>;
const mockRecordMetric = recordMetric as jest.MockedFunction<
  typeof recordMetric
>;
const mockValidateWithSchema = validateWithSchema as jest.MockedFunction<
  typeof validateWithSchema
>;

// Helper function to create mock req/res
const createMockReqRes = (method: string, query: any = {}, body: any = {}) => {
  const req = {
    method,
    query,
    body,
  } as NextApiRequest;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  } as unknown as NextApiResponse;

  return { req, res };
};

const mockUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  team: {
    id: 'team-123',
    name: 'Test Team',
    slug: 'test-team',
  },
};

const mockPatient = {
  id: 'patient-123',
  firstName: 'John',
  lastName: 'Doe',
  mobile: '+1234567890',
  gender: Gender.MALE,
  teamId: 'team-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'user-123',
  updatedBy: null,
  creator: { name: 'Test User', email: 'test@example.com' },
  updater: null,
};

describe('Patients API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (env as any).teamFeatures = { patients: true };
    mockThrowIfNoTeamAccess.mockResolvedValue(undefined);
    mockGetCurrentUserWithTeam.mockResolvedValue(mockUser);
    mockThrowIfNotAllowed.mockImplementation(() => {});
  });

  describe('GET /api/teams/[slug]/patients', () => {
    it('should fetch patients successfully', async () => {
      const { req, res } = createMockReqRes('GET', {
        slug: 'test-team',
        search: 'John',
        limit: '10',
        offset: '0',
      });

      const mockResult = {
        patients: [mockPatient],
        total: 1,
        hasMore: false,
      };

      mockFetchPatients.mockResolvedValue(mockResult);

      await patientsIndexHandler(req, res);

      expect(mockThrowIfNoTeamAccess).toHaveBeenCalledWith(req, res);
      expect(mockGetCurrentUserWithTeam).toHaveBeenCalledWith(req, res);
      expect(mockThrowIfNotAllowed).toHaveBeenCalledWith(
        mockUser,
        'team_patient',
        'read'
      );
      expect(mockFetchPatients).toHaveBeenCalledWith('team-123', {
        search: 'John',
        limit: 10,
        offset: 0,
      });
      expect(mockRecordMetric).toHaveBeenCalledWith('patient.fetched');
      expect(res.json).toHaveBeenCalledWith({
        data: mockResult.patients,
        pagination: {
          total: 1,
          hasMore: false,
          limit: 10,
          offset: 0,
        },
      });
    });

    it('should handle search with default pagination', async () => {
      const { req, res } = createMockReqRes('GET', { slug: 'test-team' });

      const mockResult = {
        patients: [mockPatient],
        total: 1,
        hasMore: false,
      };

      mockFetchPatients.mockResolvedValue(mockResult);

      await patientsIndexHandler(req, res);

      expect(mockFetchPatients).toHaveBeenCalledWith('team-123', {
        search: undefined,
        limit: undefined,
        offset: undefined,
      });
      expect(res.json).toHaveBeenCalledWith({
        data: mockResult.patients,
        pagination: {
          total: 1,
          hasMore: false,
          limit: 50,
          offset: 0,
        },
      });
    });

    it('should return 404 when patients feature is disabled', async () => {
      (env as any).teamFeatures = { patients: false };

      const { req, res } = createMockReqRes('GET', { slug: 'test-team' });

      await patientsIndexHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Not Found' },
      });
    });

    it('should handle permission errors', async () => {
      const { req, res } = createMockReqRes('GET', { slug: 'test-team' });

      mockThrowIfNotAllowed.mockImplementation(() => {
        throw new Error('Insufficient permissions');
      });

      await patientsIndexHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Insufficient permissions' },
      });
    });
  });

  describe('POST /api/teams/[slug]/patients', () => {
    it('should create patient successfully', async () => {
      const patientData = {
        firstName: 'John',
        lastName: 'Doe',
        mobile: '+1234567890',
        gender: Gender.MALE,
      };

      const { req, res } = createMockReqRes(
        'POST',
        { slug: 'test-team' },
        patientData
      );

      mockValidateWithSchema.mockReturnValue(patientData);
      mockCreatePatient.mockResolvedValue(mockPatient);

      await patientsIndexHandler(req, res);

      expect(mockThrowIfNotAllowed).toHaveBeenCalledWith(
        mockUser,
        'team_patient',
        'create'
      );
      expect(mockValidateWithSchema).toHaveBeenCalledWith(
        expect.any(Object),
        patientData
      );
      expect(mockCreatePatient).toHaveBeenCalledWith({
        teamId: 'team-123',
        firstName: 'John',
        lastName: 'Doe',
        mobile: '+1234567890',
        gender: Gender.MALE,
        createdBy: 'user-123',
      });
      expect(mockRecordMetric).toHaveBeenCalledWith('patient.created');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        data: { patient: mockPatient },
      });
    });

    it('should handle validation errors', async () => {
      const { req, res } = createMockReqRes('POST', { slug: 'test-team' }, {});

      mockValidateWithSchema.mockImplementation(() => {
        throw new Error('Validation failed');
      });

      await patientsIndexHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Validation failed' },
      });
    });
  });

  describe('Method not allowed', () => {
    it('should return 405 for unsupported methods', async () => {
      const { req, res } = createMockReqRes('PATCH', { slug: 'test-team' });

      await patientsIndexHandler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Allow', 'GET, POST');
      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Method PATCH Not Allowed' },
      });
    });
  });
});

describe('Patient Detail API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (env as any).teamFeatures = { patients: true };
    mockThrowIfNoTeamAccess.mockResolvedValue(undefined);
    mockGetCurrentUserWithTeam.mockResolvedValue(mockUser);
    mockThrowIfNotAllowed.mockImplementation(() => {});
  });

  describe('GET /api/teams/[slug]/patients/[patientId]', () => {
    it('should fetch patient by id successfully', async () => {
      const { req, res } = createMockReqRes('GET', {
        slug: 'test-team',
        patientId: 'patient-123',
      });

      mockValidateWithSchema.mockReturnValue({ patientId: 'patient-123' });
      mockFetchPatientById.mockResolvedValue(mockPatient);

      await patientDetailHandler(req, res);

      expect(mockThrowIfNotAllowed).toHaveBeenCalledWith(
        mockUser,
        'team_patient',
        'read'
      );
      expect(mockValidateWithSchema).toHaveBeenCalledWith(
        expect.any(Object),
        req.query
      );
      expect(mockFetchPatientById).toHaveBeenCalledWith(
        'team-123',
        'patient-123'
      );
      expect(mockRecordMetric).toHaveBeenCalledWith('patient.fetched');
      expect(res.json).toHaveBeenCalledWith({ data: mockPatient });
    });

    it('should return 404 for non-existent patient', async () => {
      const { req, res } = createMockReqRes('GET', {
        slug: 'test-team',
        patientId: 'non-existent',
      });

      mockValidateWithSchema.mockReturnValue({ patientId: 'non-existent' });
      mockFetchPatientById.mockRejectedValue({ code: 'P2025' });

      await patientDetailHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Patient not found' },
      });
    });
  });

  describe('PUT /api/teams/[slug]/patients/[patientId]', () => {
    it('should update patient successfully', async () => {
      const updateData = {
        firstName: 'Johnny',
        lastName: 'Doe',
        mobile: '+9876543210',
      };

      const { req, res } = createMockReqRes(
        'PUT',
        {
          slug: 'test-team',
          patientId: 'patient-123',
        },
        updateData
      );

      const updatedPatient = { ...mockPatient, ...updateData };

      mockValidateWithSchema
        .mockReturnValueOnce({ patientId: 'patient-123' })
        .mockReturnValueOnce(updateData);
      mockFetchPatientById.mockResolvedValue(mockPatient);
      mockUpdatePatient.mockResolvedValue(updatedPatient);

      await patientDetailHandler(req, res);

      expect(mockThrowIfNotAllowed).toHaveBeenCalledWith(
        mockUser,
        'team_patient',
        'update'
      );
      expect(mockFetchPatientById).toHaveBeenCalledWith(
        'team-123',
        'patient-123'
      );
      expect(mockUpdatePatient).toHaveBeenCalledWith(
        'team-123',
        'patient-123',
        {
          ...updateData,
          updatedBy: 'user-123',
        }
      );
      expect(mockRecordMetric).toHaveBeenCalledWith('patient.updated');
      expect(res.json).toHaveBeenCalledWith({ data: updatedPatient });
    });

    it('should return 404 when updating non-existent patient', async () => {
      const { req, res } = createMockReqRes(
        'PUT',
        {
          slug: 'test-team',
          patientId: 'non-existent',
        },
        {}
      );

      mockValidateWithSchema.mockReturnValue({ patientId: 'non-existent' });
      mockFetchPatientById.mockRejectedValue({ code: 'P2025' });

      await patientDetailHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Patient not found' },
      });
    });
  });

  describe('DELETE /api/teams/[slug]/patients/[patientId]', () => {
    it('should delete patient successfully', async () => {
      const { req, res } = createMockReqRes('DELETE', {
        slug: 'test-team',
        patientId: 'patient-123',
      });

      mockValidateWithSchema.mockReturnValue({ patientId: 'patient-123' });
      mockFetchPatientById.mockResolvedValue(mockPatient);
      mockDeletePatient.mockResolvedValue(mockPatient);

      await patientDetailHandler(req, res);

      expect(mockThrowIfNotAllowed).toHaveBeenCalledWith(
        mockUser,
        'team_patient',
        'delete'
      );
      expect(mockFetchPatientById).toHaveBeenCalledWith(
        'team-123',
        'patient-123'
      );
      expect(mockDeletePatient).toHaveBeenCalledWith('team-123', 'patient-123');
      expect(mockRecordMetric).toHaveBeenCalledWith('patient.removed');
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalled();
    });

    it('should return 404 when deleting non-existent patient', async () => {
      const { req, res } = createMockReqRes('DELETE', {
        slug: 'test-team',
        patientId: 'non-existent',
      });

      mockValidateWithSchema.mockReturnValue({ patientId: 'non-existent' });
      mockFetchPatientById.mockRejectedValue({ code: 'P2025' });

      await patientDetailHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Patient not found' },
      });
    });
  });

  describe('Method not allowed', () => {
    it('should return 405 for unsupported methods', async () => {
      const { req, res } = createMockReqRes('PATCH', {
        slug: 'test-team',
        patientId: 'patient-123',
      });

      await patientDetailHandler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Allow', 'GET, PUT, DELETE');
      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Method PATCH Not Allowed' },
      });
    });
  });

  describe('Feature flag disabled', () => {
    it('should return 404 when patients feature is disabled', async () => {
      (env as any).teamFeatures = { patients: false };

      const { req, res } = createMockReqRes('GET', {
        slug: 'test-team',
        patientId: 'patient-123',
      });

      await patientDetailHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Not Found' },
      });
    });
  });
});
