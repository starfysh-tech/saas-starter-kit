/* eslint-disable i18next/no-literal-string */
import { EmptyState, WithLoadingAndError } from '@/components/shared';
import ConfirmationDialog from '@/components/shared/ConfirmationDialog';
import type { Patient, Team } from '@prisma/client';
import { useState } from 'react';
import { Button } from 'react-daisyui';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/router';
import type { ApiResponse } from 'types';
import NewPatient from './NewPatient';
import usePatients from 'hooks/usePatients';
import { Table } from '@/components/shared/table/Table';

interface PatientsProps {
  team: Team;
}

const Patients = ({ team }: PatientsProps) => {
  const router = useRouter();
  const { data, isLoading, error, mutate } = usePatients(team.slug);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [confirmationDialogVisible, setConfirmationDialogVisible] =
    useState(false);

  // Archive Patient (HIPAA-compliant soft delete)
  const archivePatient = async (patient: Patient | null) => {
    if (!patient) {
      return;
    }

    const response = await fetch(
      `/api/teams/${team.slug}/patients/${patient.id}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deletionReason: 'Patient record archived through UI',
        }),
      }
    );

    setSelectedPatient(null);
    setConfirmationDialogVisible(false);

    if (!response.ok) {
      const { error } = (await response.json()) as ApiResponse;
      toast.error(error.message);
      return;
    }

    mutate();
    toast.success('Patient record archived successfully');
  };

  const patients = data?.data?.patients ?? [];
  const totalPatients = data?.data?.pagination?.total ?? 0;
  const activePatients = patients.length; // For now, all patients are considered active

  const handleViewPatientDetails = (patient: Patient) => {
    router.push(`/teams/${team.slug}/patients/${patient.id}`);
  };

  const handleArchivePatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setConfirmationDialogVisible(true);
  };

  return (
    <WithLoadingAndError isLoading={isLoading} error={error}>
      <div className="space-y-6">
        {/* Patients Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Patients Management
              </h3>
              <p className="text-gray-600">
                Manage and view patients assigned to your team.
              </p>
            </div>
            <Button
              color="primary"
              size="md"
              onClick={() => setCreateModalVisible(true)}
            >
              Add New Patient
            </Button>
          </div>
        </div>

        {/* Patients Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">
              {totalPatients}
            </div>
            <div className="text-sm text-gray-500">Total Patients</div>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {activePatients}
            </div>
            <div className="text-sm text-gray-500">Active Patients</div>
          </div>
        </div>

        {/* Patients List */}
        {patients.length === 0 ? (
          <EmptyState
            title="No patients found"
            description="Add patients to get started with patient management."
          />
        ) : (
          <>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-lg font-medium text-gray-900">
                  Patient List
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {totalPatients} patients total
                </p>
              </div>

              <Table
                cols={['Name', 'Contact', 'Status', 'Date of Onboard', 'Line of Treatment', 'Actions']}
                body={patients.map((patient) => {
                  return {
                    id: patient.id,
                    cells: [
                      {
                        wrap: true,
                        text: `${patient.firstName} ${patient.lastName}`,
                      },
                      {
                        wrap: true,
                        text: patient.mobile || 'N/A',
                      },
                      {
                        text: 'Active',
                      },
                      {
                        wrap: true,
                        text: new Date(patient.createdAt).toLocaleDateString(),
                      },
                      {
                        text: 'Not Set',
                      },
                      {
                        buttons: [
                          {
                            color: 'primary',
                            text: 'View Details',
                            onClick: () => handleViewPatientDetails(patient),
                          },
                          {
                            color: 'warning',
                            text: 'Archive',
                            onClick: () => handleArchivePatient(patient),
                          },
                        ],
                      },
                    ],
                  };
                })}
              />
            </div>

            <ConfirmationDialog
              title="Archive Patient Record"
              visible={confirmationDialogVisible}
              onConfirm={() => archivePatient(selectedPatient)}
              onCancel={() => setConfirmationDialogVisible(false)}
              cancelText="Cancel"
              confirmText="Archive Patient"
            >
              Are you sure you want to archive this patient record? The record
              will be preserved for compliance purposes but hidden from active
              patient lists. This action can be audited but not easily reversed.
            </ConfirmationDialog>
          </>
        )}

        <NewPatient
          team={team}
          createModalVisible={createModalVisible}
          setCreateModalVisible={setCreateModalVisible}
          onPatientCreated={mutate}
        />
      </div>
    </WithLoadingAndError>
  );
};

export default Patients;
