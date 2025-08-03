/* eslint-disable i18next/no-literal-string */
import { Error, Loading } from '@/components/shared';
import { TeamTab } from '@/components/team';
import env from '@/lib/env';
import useTeam from 'hooks/useTeam';
import { GetServerSidePropsContext } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { TeamFeature } from 'types';

const TeamDashboard = ({ teamFeatures }: { teamFeatures: TeamFeature }) => {
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

  return (
    <>
      <TeamTab activeTab="dashboard" team={team} teamFeatures={teamFeatures} />
      <div className="space-y-6">
        {/* Dashboard Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Welcome to {team.name}
          </h3>
          <p className="text-gray-600">
            Dashboard overview for your team. This is a placeholder for future
            dashboard content.
          </p>
        </div>

        {/* Patients Overview Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-medium text-gray-900">
                Patients Overview
              </h4>
              <p className="mt-1 text-sm text-gray-600">
                Quick overview of your patients
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">--</div>
              <div className="text-sm text-gray-500">Total Patients</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-lg font-semibold text-gray-900">--</div>
              <div className="text-sm text-gray-600">Active Patients</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-lg font-semibold text-gray-900">--</div>
              <div className="text-sm text-gray-600">New This Month</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-lg font-semibold text-gray-900">--</div>
              <div className="text-sm text-gray-600">Pending Review</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Quick Actions
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
              Add New Patient
            </button>
            <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
              Generate Report
            </button>
            <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
              View Analytics
            </button>
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Recent Activity
          </h4>
          <div className="text-center py-6 text-gray-500">
            <p>No recent activity to display.</p>
            <p className="text-sm mt-1">
              Activity will appear here once you start using the system.
            </p>
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

export default TeamDashboard;
