/* eslint-disable i18next/no-literal-string */
import { Error, Loading } from '@/components/shared';
import { TeamTab } from '@/components/team';
import env from '@/lib/env';
import useTeam from 'hooks/useTeam';
import { GetServerSidePropsContext } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { TeamFeature } from 'types';

const TeamPatients = ({ teamFeatures }: { teamFeatures: TeamFeature }) => {
  const { t } = useTranslation('common');
  const { isLoading, isError, team } = useTeam();

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <Error message={isError.message} />;
  }

  if (!team) {
    return <Error message={t('team-not-found')} />;
  }

  // Placeholder patient data
  const samplePatients = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      status: 'Active',
      lastVisit: '2024-08-01',
      condition: 'General Checkup',
      priority: 'Normal',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      status: 'Active',
      lastVisit: '2024-07-28',
      condition: 'Follow-up',
      priority: 'High',
    },
    {
      id: '3',
      name: 'Robert Johnson',
      email: 'robert.j@example.com',
      status: 'Inactive',
      lastVisit: '2024-06-15',
      condition: 'Consultation',
      priority: 'Low',
    },
  ];

  const getStatusBadge = (status: string) => {
    const baseClasses =
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (status) {
      case 'Active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'Inactive':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-blue-100 text-blue-800`;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const baseClasses =
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (priority) {
      case 'High':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'Normal':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'Low':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <>
      <TeamTab activeTab="patients" team={team} teamFeatures={teamFeatures} />
      <div className="space-y-6">
        {/* Patients Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Patients Management
              </h3>
              <p className="text-gray-600">
                Manage and view patients assigned to your team. This is
                placeholder content for now.
              </p>
            </div>
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              Add New Patient
            </button>
          </div>
        </div>

        {/* Patients Filter and Search */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-lg">
              <label htmlFor="search" className="sr-only">
                Search patients
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  id="search"
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search patients..."
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <select className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>

              <select className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                <option>All Priority</option>
                <option>High</option>
                <option>Normal</option>
                <option>Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Patients List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-lg font-medium text-gray-900">Patient List</h4>
            <p className="text-sm text-gray-600 mt-1">
              {samplePatients.length} patients total (placeholder data)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Visit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Condition
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {samplePatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {patient.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {patient.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {patient.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(patient.status)}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {patient.lastVisit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {patient.condition}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getPriorityBadge(patient.priority)}>
                        {patient.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">
                        View
                      </button>
                      <button className="text-blue-600 hover:text-blue-900 mr-3">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {samplePatients.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              <p>No patients found.</p>
              <p className="text-sm mt-1">Add patients to get started.</p>
            </div>
          )}
        </div>

        {/* Patients Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">
              {samplePatients.length}
            </div>
            <div className="text-sm text-gray-500">Total Patients</div>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {samplePatients.filter((p) => p.status === 'Active').length}
            </div>
            <div className="text-sm text-gray-500">Active Patients</div>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">
              {samplePatients.filter((p) => p.priority === 'High').length}
            </div>
            <div className="text-sm text-gray-500">High Priority</div>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-600">
              {samplePatients.filter((p) => p.status === 'Inactive').length}
            </div>
            <div className="text-sm text-gray-500">Inactive Patients</div>
          </div>
        </div>
      </div>
    </>
  );
};

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      teamFeatures: env.teamFeatures,
    },
  };
}

export default TeamPatients;
