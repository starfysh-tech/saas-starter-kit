/* eslint-disable i18next/no-literal-string */
import { InputWithLabel } from '@/components/shared';
import type { Team } from '@prisma/client';
import { Button } from 'react-daisyui';
import { toast } from 'react-hot-toast';
import type { ApiResponse } from 'types';
import Modal from '../shared/Modal';
import { defaultHeaders } from '@/lib/common';
import { useFormik } from 'formik';
import { z } from 'zod';
import { createPatientSchema } from '@/lib/zod';

interface NewPatientProps {
  team: Team;
  createModalVisible: boolean;
  setCreateModalVisible: (visible: boolean) => void;
  onPatientCreated: () => void;
}

const NewPatient = ({
  team,
  createModalVisible,
  setCreateModalVisible,
  onPatientCreated,
}: NewPatientProps) => {
  const toggleVisible = () => {
    setCreateModalVisible(!createModalVisible);
  };

  const formik = useFormik<z.infer<typeof createPatientSchema>>({
    initialValues: {
      firstName: '',
      lastName: '',
      mobile: '',
      gender: 'PREFER_NOT_TO_SAY' as const,
    },
    validateOnBlur: false,
    validate: (values) => {
      try {
        createPatientSchema.parse(values);
      } catch (error: any) {
        return error.formErrors.fieldErrors;
      }
    },
    onSubmit: async (values, { resetForm }) => {
      const response = await fetch(`/api/teams/${team.slug}/patients`, {
        method: 'POST',
        body: JSON.stringify(values),
        headers: defaultHeaders,
      });

      const { data, error } = (await response.json()) as ApiResponse<{
        patient: any;
      }>;

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.patient) {
        onPatientCreated();
        resetForm();
        toggleVisible();
        toast.success('Patient created successfully');
      }
    },
  });

  // Format phone number on blur
  const handlePhoneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    const digits = phone.replace(/\D/g, '');

    if (digits.length === 10) {
      const formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      formik.setFieldValue('mobile', formatted);
    }
  };

  return (
    <Modal open={createModalVisible} close={toggleVisible}>
      <form onSubmit={formik.handleSubmit} method="POST">
        <Modal.Header>Add New Patient</Modal.Header>
        <Modal.Description>
          Create a new patient record with their basic information.
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
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                id="gender"
                name="gender"
                value={formik.values.gender}
                onChange={formik.handleChange}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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
            Create Patient
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

export default NewPatient;
