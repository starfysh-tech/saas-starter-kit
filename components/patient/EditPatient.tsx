/* eslint-disable i18next/no-literal-string */
import { InputWithLabel } from '@/components/shared';
import type { Patient, Team } from '@prisma/client';
import { Button } from 'react-daisyui';
import { toast } from 'react-hot-toast';
import type { ApiResponse } from 'types';
import Modal from '../shared/Modal';
import { defaultHeaders } from '@/lib/common';
import { useFormik } from 'formik';
import { z } from 'zod';
import { updatePatientSchema } from '@/lib/zod';
import { useEffect } from 'react';

interface EditPatientProps {
  team: Team;
  patient: Patient | null;
  editModalVisible: boolean;
  setEditModalVisible: (visible: boolean) => void;
  onPatientUpdated: () => void;
}

const EditPatient = ({
  team,
  patient,
  editModalVisible,
  setEditModalVisible,
  onPatientUpdated,
}: EditPatientProps) => {
  const toggleVisible = () => {
    setEditModalVisible(!editModalVisible);
  };

  const formik = useFormik<z.infer<typeof updatePatientSchema>>({
    initialValues: {
      firstName: '',
      lastName: '',
      mobile: '',
      gender: 'PREFER_NOT_TO_SAY' as const,
    },
    validateOnBlur: false,
    validate: (values) => {
      try {
        updatePatientSchema.parse(values);
      } catch (error: any) {
        return error.formErrors.fieldErrors;
      }
    },
    onSubmit: async (values) => {
      if (!patient) return;

      const response = await fetch(
        `/api/teams/${team.slug}/patients/${patient.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(values),
          headers: defaultHeaders,
        }
      );

      const { data, error } = (await response.json()) as ApiResponse<{
        patient: any;
      }>;

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data) {
        onPatientUpdated();
        toggleVisible();
        toast.success('Patient updated successfully');
      }
    },
  });

  // Update form values when patient changes
  useEffect(() => {
    if (patient && editModalVisible) {
      formik.setValues({
        firstName: patient.firstName,
        lastName: patient.lastName,
        mobile: patient.mobile || '',
        gender: patient.gender || 'PREFER_NOT_TO_SAY',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient, editModalVisible]);

  // Format phone number on blur
  const handlePhoneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    const digits = phone.replace(/\D/g, '');

    if (digits.length === 10) {
      const formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      formik.setFieldValue('mobile', formatted);
    }
  };

  if (!patient) return null;

  return (
    <Modal open={editModalVisible} close={toggleVisible}>
      <form onSubmit={formik.handleSubmit} method="PUT">
        <Modal.Header>Edit Patient</Modal.Header>
        <Modal.Description>
          Update the patient information below.
        </Modal.Description>
        <Modal.Body>
          <div className="space-y-4">
            <InputWithLabel
              label="First Name"
              name="firstName"
              value={formik.values.firstName}
              onChange={formik.handleChange}
              placeholder="John"
              required
              error={formik.errors.firstName}
            />

            <InputWithLabel
              label="Last Name"
              name="lastName"
              value={formik.values.lastName}
              onChange={formik.handleChange}
              placeholder="Doe"
              required
              error={formik.errors.lastName}
            />

            <InputWithLabel
              label="Mobile Number"
              name="mobile"
              value={formik.values.mobile}
              onChange={formik.handleChange}
              onBlur={handlePhoneBlur}
              placeholder="(123) 456-7890"
              required
              error={formik.errors.mobile}
            />

            <div>
              <label
                htmlFor="gender"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                id="gender"
                name="gender"
                value={formik.values.gender}
                onChange={formik.handleChange}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
                required
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
              {formik.errors.gender && (
                <p className="mt-1 text-sm text-red-600">
                  {formik.errors.gender}
                </p>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="submit"
            color="primary"
            loading={formik.isSubmitting}
            disabled={formik.isSubmitting}
          >
            Update Patient
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={toggleVisible}
            disabled={formik.isSubmitting}
          >
            Cancel
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default EditPatient;
