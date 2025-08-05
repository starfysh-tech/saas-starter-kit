/* eslint-disable i18next/no-literal-string */
import React, { useState, useEffect } from 'react';
import { Button } from 'react-daisyui';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import type { Patient, Team } from '@prisma/client';
import type { ApiResponse } from 'types';
import BaselineAssessmentForm from './BaselineAssessmentForm';

interface PatientBaselineProps {
  patient: Patient;
  team: Team;
}

const PatientBaseline = ({ patient, team }: PatientBaselineProps) => {
  const [baselineData, setBaselineData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBaseline, setEditingBaseline] = useState<any>(null);

  // Load existing baseline data
  useEffect(() => {
    const load_baseline_data = async () => {
      try {
        const response = await fetch(
          `/api/teams/${team.slug}/patients/${patient.id}/baseline`
        );
        const { data, error } = (await response.json()) as ApiResponse<any>;

        if (error) {
          console.error('Failed to load baseline data:', error);
          return;
        }

        // Transform the data to flatten clinical assessment data
        const transformed_data = (data?.baselines || []).map((baseline: any) => {
          // If clinical data is stored in chronicConditions, flatten it
          if (baseline.chronicConditions && typeof baseline.chronicConditions === 'object') {
            return {
              ...baseline,
              symptoms: baseline.chronicConditions.symptoms || baseline.symptoms,
              treatments: baseline.chronicConditions.treatments || baseline.treatments,
              performance_status: baseline.chronicConditions.performance_status || baseline.performance_status,
              clinical_measurements: baseline.chronicConditions.clinical_measurements || baseline.clinical_measurements,
              assessor_notes: baseline.notes || baseline.assessor_notes,
            };
          }
          return baseline;
        });
        setBaselineData(transformed_data);
      } catch (error) {
        console.error('Error loading baseline data:', error);
      } finally {
        setLoading(false);
      }
    };

    load_baseline_data();
  }, [team.slug, patient.id]);

  const handle_create_new = () => {
    setEditingBaseline(null);
    setShowForm(true);
  };

  const handle_edit_baseline = (baseline: any) => {
    setEditingBaseline(baseline);
    setShowForm(true);
  };

  const handle_form_success = () => {
    setShowForm(false);
    setEditingBaseline(null);
    // Reload baseline data with cache-busting
    const load_baseline_data = async () => {
      try {
        const response = await fetch(
          `/api/teams/${team.slug}/patients/${patient.id}/baseline?t=${Date.now()}`,
          {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          }
        );
        const { data } = (await response.json()) as ApiResponse<any>;
        // Transform the data to flatten clinical assessment data
        const transformed_data = (data?.baselines || []).map((baseline: any) => {
          // If clinical data is stored in chronicConditions, flatten it
          if (baseline.chronicConditions && typeof baseline.chronicConditions === 'object') {
            return {
              ...baseline,
              symptoms: baseline.chronicConditions.symptoms || baseline.symptoms,
              treatments: baseline.chronicConditions.treatments || baseline.treatments,
              performance_status: baseline.chronicConditions.performance_status || baseline.performance_status,
              clinical_measurements: baseline.chronicConditions.clinical_measurements || baseline.clinical_measurements,
              assessor_notes: baseline.notes || baseline.assessor_notes,
            };
          }
          return baseline;
        });
        setBaselineData(transformed_data);
      } catch (error) {
        console.error('Error reloading baseline data:', error);
      }
    };
    load_baseline_data();
  };

  const handle_form_cancel = () => {
    setShowForm(false);
    setEditingBaseline(null);
  };

  const format_date = (date_string: string) => {
    return new Date(date_string).toLocaleDateString();
  };

  const get_severity_badge = (severity: string) => {
    const colors = {
      mild: 'badge-warning',
      moderate: 'badge-orange',
      severe: 'badge-error',
      very_severe: 'badge-error',
    };

    return (
      <span
        className={`badge badge-sm ${colors[severity as keyof typeof colors] || 'badge-neutral'}`}
      >
        {severity.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="loading loading-spinner loading-lg"></div>
        <span className="ml-2">Loading baseline data...</span>
      </div>
    );
  }

  if (showForm) {
    return (
      <BaselineAssessmentForm
        team={team}
        patient={patient}
        existingBaseline={editingBaseline}
        onSuccess={handle_form_success}
        onCancel={handle_form_cancel}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Clinical Baseline Assessments
        </h2>
        <Button
          color="primary"
          size="sm"
          onClick={handle_create_new}
          startIcon={<PlusIcon className="w-4 h-4" />}
        >
          New Assessment
        </Button>
      </div>

      {/* Baseline Assessments List */}
      {baselineData.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-12 text-center">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No baseline assessments yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Get started by creating the first clinical baseline assessment for
              this patient.
            </p>
            <Button
              color="primary"
              onClick={handle_create_new}
              startIcon={<PlusIcon className="w-4 h-4" />}
            >
              Create First Assessment
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {baselineData.map((baseline) => (
            <div
              key={baseline.id}
              className="bg-white dark:bg-gray-800 shadow rounded-lg"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      Assessment - {format_date(baseline.dateRecorded)}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Created by {baseline.creator?.name} on{' '}
                      {format_date(baseline.createdAt)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handle_edit_baseline(baseline)}
                    startIcon={<PencilIcon className="w-4 h-4" />}
                  >
                    Edit
                  </Button>
                </div>

                {/* Assessment Summary */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Performance Status */}
                  {baseline.performance_status && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {baseline.performance_status.scale_type.toUpperCase()}{' '}
                        Score
                      </div>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {baseline.performance_status.value}
                      </div>
                    </div>
                  )}

                  {/* Symptoms Count */}
                  {baseline.symptoms &&
                    Object.keys(baseline.symptoms).length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Active Symptoms
                        </div>
                        <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                          {
                            Object.values(baseline.symptoms).filter(
                              (s: any) => s.present
                            ).length
                          }
                        </div>
                      </div>
                    )}

                  {/* Measurements */}
                  {baseline.clinical_measurements &&
                    Object.keys(baseline.clinical_measurements).length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Measurements
                        </div>
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          {Object.keys(baseline.clinical_measurements).length}
                        </div>
                      </div>
                    )}
                </div>

                {/* Symptoms with Severity */}
                {baseline.symptoms &&
                  Object.keys(baseline.symptoms).length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Symptoms
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(baseline.symptoms).map(
                          ([symptom_id, symptom_data]: [string, any]) =>
                            symptom_data.present && (
                              <div
                                key={symptom_id}
                                className="flex items-center space-x-2"
                              >
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {symptom_id.replace('_', ' ')}
                                </span>
                                {symptom_data.severity &&
                                  get_severity_badge(symptom_data.severity)}
                              </div>
                            )
                        )}
                      </div>
                    </div>
                  )}

                {/* Notes */}
                {baseline.assessor_notes && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-md">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Clinical Notes
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {baseline.assessor_notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientBaseline;
