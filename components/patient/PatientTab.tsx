/* eslint-disable i18next/no-literal-string */
import {
  UserIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import type { Patient } from '@prisma/client';
import classNames from 'classnames';
import useCanAccess from 'hooks/useCanAccess';
import Link from 'next/link';
import React from 'react';

interface PatientTabProps {
  activeTab: string;
  patient: Patient;
  teamSlug: string;
  heading?: string;
}

const PatientTab = ({
  activeTab,
  patient,
  teamSlug,
  heading,
}: PatientTabProps) => {
  const { canAccess } = useCanAccess();

  const navigations: {
    name: string;
    href: string;
    active: boolean;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    disabled?: boolean;
  }[] = [];

  // Check if user can access patient data
  const canAccessPatient = canAccess('team_patient', ['read']);

  if (canAccessPatient) {
    // Add Overview tab
    navigations.push({
      name: 'Overview',
      href: `/teams/${teamSlug}/patients/${patient.id}`,
      active: activeTab === 'overview',
      icon: UserIcon,
    });

    // Add Baseline Data tab
    navigations.push({
      name: 'Baseline Data',
      href: `/teams/${teamSlug}/patients/${patient.id}/baseline`,
      active: activeTab === 'baseline',
      icon: DocumentTextIcon,
    });

    // Add future tabs (disabled for now)
    navigations.push({
      name: 'Assessments',
      href: `/teams/${teamSlug}/patients/${patient.id}/assessments`,
      active: activeTab === 'assessments',
      icon: ClipboardDocumentListIcon,
      disabled: true,
    });

    navigations.push({
      name: 'History',
      href: `/teams/${teamSlug}/patients/${patient.id}/history`,
      active: activeTab === 'history',
      icon: ClockIcon,
      disabled: true,
    });
  }

  const patientDisplayName = `${patient.firstName} ${patient.lastName}`;
  const patientId = patient.id.slice(-8); // Show last 8 characters of ID

  return (
    <div className="flex flex-col pb-6">
      {/* Back to Patients link */}
      <div className="mb-4">
        <Link
          href={`/teams/${teamSlug}/patients`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Patients
        </Link>
      </div>

      {/* Patient header */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold">
          {heading ? heading : patientDisplayName}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Patient ID: {patientId}
        </p>
      </div>

      {/* Navigation tabs */}
      <nav
        className="flex flex-wrap border-b border-gray-300"
        aria-label="Patient Tabs"
      >
        {navigations.map((menu) => {
          if (menu.disabled) {
            return (
              <span
                key={menu.href}
                className="inline-flex items-center border-b-2 border-transparent py-2 md:py-4 mr-5 text-sm font-medium text-gray-400 cursor-not-allowed"
              >
                <menu.icon className="w-4 h-4 mr-2" />
                {menu.name}
              </span>
            );
          }

          return (
            <Link
              href={menu.href}
              key={menu.href}
              className={classNames(
                'inline-flex items-center border-b-2 py-2 md:py-4 mr-5 text-sm font-medium',
                menu.active
                  ? 'border-gray-900 text-gray-700 dark:text-gray-100'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:dark:text-gray-100'
              )}
            >
              <menu.icon className="w-4 h-4 mr-2" />
              {menu.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default PatientTab;
