/* eslint-disable i18next/no-literal-string */
import { Error, Loading } from '@/components/shared';
import env from '@/lib/env';
import useTeam from 'hooks/useTeam';
import { GetServerSidePropsContext } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const TeamReports = () => {
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

  // Placeholder report data
  const availableReports = [
    {
      id: 'patient-summary',
      name: 'Patient Summary Report',
      description:
        'Comprehensive overview of all patients with key metrics and status',
      category: 'Patient Care',
      lastGenerated: null,
      status: 'available',
    },
    {
      id: 'monthly-analytics',
      name: 'Monthly Analytics',
      description: 'Monthly performance metrics and trends analysis',
      category: 'Analytics',
      lastGenerated: null,
      status: 'available',
    },
    {
      id: 'compliance-audit',
      name: 'Compliance Audit Report',
      description: 'Regulatory compliance status and audit trail',
      category: 'Compliance',
      lastGenerated: null,
      status: 'available',
    },
    {
      id: 'team-productivity',
      name: 'Team Productivity Report',
      description: 'Team performance metrics and workflow efficiency analysis',
      category: 'Operations',
      lastGenerated: null,
      status: 'available',
    },
    {
      id: 'financial-summary',
      name: 'Financial Summary',
      description: 'Revenue, costs, and financial performance overview',
      category: 'Finance',
      lastGenerated: null,
      status: 'coming-soon',
    },
  ];

  const reportCategories = Array.from(
    new Set(availableReports.map((report) => report.category))
  );

  return (
    <div className="space-y-6">
      {/* Reports Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Reports Center
        </h3>
        <p className="text-gray-600">
          Generate and access various reports for your team. All reports are
          placeholder content for now.
        </p>
      </div>

      {/* Report Categories */}
      <div className="bg-white shadow rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">
          Available Reports
        </h4>

        {reportCategories.map((category) => (
          <div key={category} className="mb-8 last:mb-0">
            <h5 className="text-md font-medium text-gray-800 mb-3 border-b border-gray-200 pb-2">
              {category}
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableReports
                .filter((report) => report.category === category)
                .map((report) => (
                  <div
                    key={report.id}
                    className={`border rounded-lg p-4 ${
                      report.status === 'coming-soon'
                        ? 'border-gray-200 bg-gray-50'
                        : 'border-gray-300 bg-white hover:border-blue-300 cursor-pointer'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h6
                          className={`font-medium mb-1 ${
                            report.status === 'coming-soon'
                              ? 'text-gray-500'
                              : 'text-gray-900'
                          }`}
                        >
                          {report.name}
                        </h6>
                        <p
                          className={`text-sm mb-3 ${
                            report.status === 'coming-soon'
                              ? 'text-gray-400'
                              : 'text-gray-600'
                          }`}
                        >
                          {report.description}
                        </p>

                        {report.lastGenerated ? (
                          <p className="text-xs text-gray-500">
                            Last generated: {report.lastGenerated}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500">
                            Never generated
                          </p>
                        )}
                      </div>

                      <div className="ml-4">
                        {report.status === 'coming-soon' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Coming Soon
                          </span>
                        ) : (
                          <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200">
                            Generate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Reports */}
      <div className="bg-white shadow rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">
          Recent Reports
        </h4>
        <div className="text-center py-6 text-gray-500">
          <p>No reports have been generated yet.</p>
          <p className="text-sm mt-1">
            Generated reports will appear here for easy access.
          </p>
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-gray-900">
            Scheduled Reports
          </h4>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Schedule Report
          </button>
        </div>
        <div className="text-center py-6 text-gray-500">
          <p>No scheduled reports configured.</p>
          <p className="text-sm mt-1">
            Set up automatic report generation for regular insights.
          </p>
        </div>
      </div>
    </div>
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

export default TeamReports;
