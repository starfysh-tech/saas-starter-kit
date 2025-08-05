/* eslint-disable i18next/no-literal-string */
import { UserIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import type { Patient } from '@prisma/client';
import { formatDistanceToNow } from 'date-fns';
import React from 'react';

interface PatientOverviewProps {
  patient: Patient;
}

const PatientOverview = ({ patient }: PatientOverviewProps) => {
  const patient_display_name = `${patient.firstName} ${patient.lastName}`;
  const patient_id = patient.id.slice(-8); // Show last 8 characters of ID
  const created_date = formatDistanceToNow(new Date(patient.createdAt), {
    addSuffix: true,
  });
  const updated_date = patient.updatedAt
    ? formatDistanceToNow(new Date(patient.updatedAt), { addSuffix: true })
    : null;

  return (
    <div className="space-y-6">
      {/* Patient Information Card */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
            Patient Information
          </h3>

          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                <UserIcon className="w-4 h-4 mr-2" />
                Full Name
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {patient_display_name}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Patient ID
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 font-mono">
                {patient_id}
              </dd>
            </div>

            {patient.mobile && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                  <DevicePhoneMobileIcon className="w-4 h-4 mr-2" />
                  Mobile
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {patient.mobile}
                </dd>
              </div>
            )}

            {patient.gender && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Gender
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 capitalize">
                  {patient.gender.toLowerCase()}
                </dd>
              </div>
            )}

            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Created
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {created_date}
              </dd>
            </div>

            {updated_date && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Last Updated
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {updated_date}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Quick Actions Card */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
            Quick Actions
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled
            >
              Record Assessment
            </button>

            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled
            >
              Add Note
            </button>

            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled
            >
              View History
            </button>
          </div>

          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Additional features coming soon
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatientOverview;
