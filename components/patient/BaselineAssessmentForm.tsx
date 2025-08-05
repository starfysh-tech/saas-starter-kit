/* eslint-disable i18next/no-literal-string */
import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import { Button } from 'react-daisyui';
import { toast } from 'react-hot-toast';
import {
  HeartIcon,
  ScaleIcon,
  BeakerIcon,
  DocumentTextIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import type { Team, Patient } from '@prisma/client';
import type { ApiResponse } from 'types';
import type {
  BaselineFormConfig,
  BaselineAssessmentData,
} from '../../types/teamFormConfig';
import type { SeverityLevel } from '@/components/shared/CheckboxWithSeverity';
import CheckboxWithSeverity from '@/components/shared/CheckboxWithSeverity';
import CascadingSelect from '@/components/shared/CascadingSelect';
import { InputWithLabel, RadioButtonGroup } from '@/components/shared';
import { defaultHeaders } from '@/lib/common';
import { baselineAssessmentDataSchema } from '@/lib/zod/schema';

interface BaselineAssessmentFormProps {
  team: Team;
  patient: Patient;
  existingBaseline?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const BaselineAssessmentForm: React.FC<BaselineAssessmentFormProps> = ({
  team,
  patient,
  existingBaseline,
  onSuccess,
  onCancel,
}) => {
  const [formConfig, setFormConfig] = useState<BaselineFormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load team form configuration
  useEffect(() => {
    const load_form_config = async () => {
      try {
        const response = await fetch(
          `/api/teams/${team.slug}/form-config/baseline`
        );
        const { data: configData, error } =
          (await response.json()) as ApiResponse<any>;

        if (error) {
          console.error('Failed to load form config:', error);
          toast.error('Failed to load form configuration');
          return;
        }

        setFormConfig(configData.config);
      } catch (error) {
        console.error('Error loading form config:', error);
        toast.error('Failed to load form configuration');
      } finally {
        setLoading(false);
      }
    };

    load_form_config();
  }, [team.slug]);

  const formik = useFormik<BaselineAssessmentData>({
    initialValues: {
      demographics: existingBaseline?.demographics || {},
      symptoms: existingBaseline?.symptoms || {},
      treatments: existingBaseline?.treatments || {},
      clinical_measurements: existingBaseline?.clinical_measurements || {},
      performance_status: existingBaseline?.performance_status || { scale_type: 'ecog' as const },
      custom_fields: existingBaseline?.custom_fields || {},
      assessment_date: existingBaseline?.assessment_date
        ? new Date(existingBaseline.assessment_date)
        : new Date(),
      assessor_notes: existingBaseline?.assessor_notes || '',
    },
    validateOnBlur: false,
    validate: (values) => {
      try {
        baselineAssessmentDataSchema.parse(values);
      } catch (error: any) {
        return error.formErrors?.fieldErrors || {};
      }
    },
    onSubmit: async (values) => {
      setSaving(true);
      try {
        const endpoint = existingBaseline
          ? `/api/teams/${team.slug}/patients/${patient.id}/baseline/${existingBaseline.id}`
          : `/api/teams/${team.slug}/patients/${patient.id}/baseline`;
        const method = existingBaseline ? 'PUT' : 'POST';

        const response = await fetch(endpoint, {
          method,
          body: JSON.stringify({
            ...values,
            dateRecorded: values.assessment_date.toISOString(),
          }),
          headers: defaultHeaders,
        });

        const { error } = (await response.json()) as ApiResponse<any>;

        if (error) {
          toast.error(error.message);
          return;
        }

        toast.success(
          existingBaseline
            ? 'Baseline assessment updated successfully'
            : 'Baseline assessment created successfully'
        );
        onSuccess?.();
      } catch (error) {
        console.error('Error saving baseline assessment:', error);
        toast.error('Failed to save baseline assessment');
      } finally {
        setSaving(false);
      }
    },
  });

  const handle_symptom_change = (
    symptom_id: string,
    checked: boolean,
    severity?: SeverityLevel
  ) => {
    const current_symptoms = { ...formik.values.symptoms };
    current_symptoms[symptom_id] = {
      present: checked,
      severity: checked ? severity : undefined,
    };
    formik.setFieldValue('symptoms', current_symptoms);
  };

  const handle_treatment_change = (values: string[]) => {
    const current_treatments = { ...formik.values.treatments };
    current_treatments.line_of_treatment = values;
    formik.setFieldValue('treatments', current_treatments);
  };

  const handle_clinical_measurement_change = (
    field_id: string,
    value: number | string
  ) => {
    const current_measurements = { ...formik.values.clinical_measurements };
    current_measurements[field_id] = value;
    formik.setFieldValue('clinical_measurements', current_measurements);
  };

  const handle_performance_status_change = (field: string, value: any) => {
    const current_status = { 
      ...formik.values.performance_status,
      scale_type: 'ecog' as const // Always set scale_type to 'ecog' for ECOG Performance Status
    };
    current_status[field] = value;
    formik.setFieldValue('performance_status', current_status);
  };

  const get_ecog_description = (value: number): string => {
    const descriptions = {
      0: 'Fully active, able to carry on all pre-disease performance without restriction',
      1: 'Restricted in physically strenuous activity but ambulatory and able to carry out work of a light or sedentary nature',
      2: 'Ambulatory and capable of all selfcare but unable to carry out any work activities; up and about more than 50% of waking hours',
      3: 'Capable of only limited selfcare; confined to bed or chair more than 50% of waking hours',
      4: 'Completely disabled; cannot carry on any selfcare; totally confined to bed or chair',
    };
    return descriptions[value as keyof typeof descriptions] || '';
  };

  const get_nyha_description = (value: number): string => {
    const descriptions = {
      1: 'No limitation of physical activity. Ordinary physical activity does not cause undue fatigue, palpitation, or dyspnea',
      2: 'Slight limitation of physical activity. Comfortable at rest, but ordinary physical activity results in fatigue, palpitation, or dyspnea',
      3: 'Marked limitation of physical activity. Comfortable at rest, but less than ordinary activity causes fatigue, palpitation, or dyspnea',
      4: 'Unable to carry on any physical activity without discomfort. Symptoms of cardiac insufficiency at rest',
    };
    return descriptions[value as keyof typeof descriptions] || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="loading loading-spinner loading-lg"></div>
        <span className="ml-2">Loading form configuration...</span>
      </div>
    );
  }

  if (!formConfig) {
    return (
      <div className="alert alert-error">
        <span>Failed to load form configuration</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <form onSubmit={formik.handleSubmit}>

        {/* Symptoms Section */}
        {formConfig.sections.symptoms.enabled && (
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-100 dark:border-gray-700">
            <div className="px-6 py-6 sm:p-8">
              <h3 className="text-xl leading-6 font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                <HeartIcon className="w-6 h-6 mr-3 text-red-500" />
                Symptoms Assessment
              </h3>

              <div className="space-y-3">
                {formConfig.sections.symptoms.items.map((symptom) => (
                  <CheckboxWithSeverity
                    key={symptom.id}
                    name={`symptom_${symptom.id}`}
                    label={symptom.label}
                    checked={
                      formik.values.symptoms?.[symptom.id]?.present || false
                    }
                    severity={
                      formik.values.symptoms?.[symptom.id]
                        ?.severity as SeverityLevel
                    }
                    onChange={(checked, severity) =>
                      handle_symptom_change(symptom.id, checked, severity)
                    }
                    required={symptom.required}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Treatments Section */}
        {formConfig.sections.treatments.enabled && (
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-100 dark:border-gray-700">
            <div className="px-6 py-6 sm:p-8">
              <h3 className="text-xl leading-6 font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                <BeakerIcon className="w-6 h-6 mr-3 text-blue-500" />
                Treatment Information
              </h3>

              <div className="space-y-4">
                <RadioButtonGroup
                  name="treatment_type"
                  label="Treatment Type"
                  options={[
                    { value: 'chemotherapy', label: 'Chemotherapy' },
                    { value: 'radiation_therapy', label: 'Radiation Therapy' },
                    { value: 'surgery', label: 'Surgery' },
                    { value: 'immunotherapy', label: 'Immunotherapy' },
                    { value: 'targeted_therapy', label: 'Targeted Therapy' },
                  ]}
                  value={formik.values.treatments?.type || ''}
                  onChange={(value) =>
                    formik.setFieldValue('treatments.type', value)
                  }
                />

                <InputWithLabel
                  label="Treatment Details"
                  name="treatment_details"
                  value={formik.values.treatments?.details || ''}
                  onChange={(e) =>
                    formik.setFieldValue('treatments.details', e.target.value)
                  }
                  placeholder="Additional treatment information..."
                />
              </div>
            </div>
          </div>
        )}


        {/* Performance Status Section */}
        {formConfig.sections.performance_status.enabled && (
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-orange-100 dark:border-orange-800 border-l-4 border-l-orange-500">
            <div className="px-6 py-6 sm:p-8">
              <h3 className="text-xl leading-6 font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                <ChartBarIcon className="w-6 h-6 mr-3 text-orange-500" />
                Performance Status
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                  Critical
                </span>
              </h3>

              <div className="space-y-4">
                <RadioButtonGroup
                  name="performance_status_value"
                  label={`${formConfig.sections.performance_status.scale_type.toUpperCase()} Score`}
                  options={
                    formConfig.sections.performance_status.scale_type === 'ecog'
                      ? [
                          {
                            value: 0,
                            label: '0',
                            description: 'Fully active, able to carry on all pre-disease performance without restriction',
                          },
                          {
                            value: 1,
                            label: '1', 
                            description: 'Restricted in physically strenuous activity but ambulatory and able to carry out work of a light or sedentary nature',
                          },
                          {
                            value: 2,
                            label: '2',
                            description: 'Ambulatory and capable of all selfcare but unable to carry out any work activities; up and about more than 50% of waking hours',
                          },
                          {
                            value: 3,
                            label: '3',
                            description: 'Capable of only limited selfcare; confined to bed or chair more than 50% of waking hours',
                          },
                          {
                            value: 4,
                            label: '4',
                            description: 'Completely disabled; cannot carry on any selfcare; totally confined to bed or chair',
                          },
                        ]
                      : [
                          {
                            value: 1,
                            label: '1',
                            description: 'No limitation of physical activity. Ordinary physical activity does not cause undue fatigue, palpitation, or dyspnea',
                          },
                          {
                            value: 2,
                            label: '2',
                            description: 'Slight limitation of physical activity. Comfortable at rest, but ordinary physical activity results in fatigue, palpitation, or dyspnea',
                          },
                          {
                            value: 3,
                            label: '3',
                            description: 'Marked limitation of physical activity. Comfortable at rest, but less than ordinary activity causes fatigue, palpitation, or dyspnea',
                          },
                          {
                            value: 4,
                            label: '4',
                            description: 'Unable to carry on any physical activity without discomfort. Symptoms of cardiac insufficiency at rest',
                          },
                        ]
                  }
                  value={formik.values.performance_status?.value}
                  onChange={(value) =>
                    handle_performance_status_change('value', value)
                  }
                  required={formConfig.sections.performance_status.required}
                />

                <InputWithLabel
                  label="Performance Status Notes"
                  name="performance_status_notes"
                  value={formik.values.performance_status?.notes || ''}  
                  onChange={(e) =>
                    handle_performance_status_change('notes', e.target.value)
                  }
                  placeholder="Additional notes about performance status..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Assessor Notes Section */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="px-6 py-6 sm:p-8">
            <h3 className="text-xl leading-6 font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <DocumentTextIcon className="w-6 h-6 mr-3 text-gray-500" />
              Additional Notes
            </h3>

            <textarea
              name="assessor_notes"
              rows={4}
              value={formik.values.assessor_notes}
              onChange={formik.handleChange}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 text-base bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
              placeholder="Additional clinical notes, observations, or comments..."
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end space-x-4 rounded-b-xl shadow-lg">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={saving}
              size="lg"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            color="primary"
            loading={saving}
            disabled={saving}
            size="lg"
            className="px-8"
          >
            {existingBaseline ? 'Update Assessment' : 'Create Assessment'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BaselineAssessmentForm;
