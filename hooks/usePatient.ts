import fetcher from '@/lib/fetcher';
import type { Patient } from '@prisma/client';
import useSWR from 'swr';
import { useSWRConfig } from 'swr';
import type { ApiResponse } from 'types';

const usePatient = (
  slug: string | undefined,
  patientId: string | undefined
) => {
  const { mutate: globalMutate } = useSWRConfig();

  const url = `/api/teams/${slug}/patients/${patientId}`;

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<Patient>>(
    () => {
      return slug && patientId ? url : null;
    },
    fetcher
  );

  const mutatePatient = async () => {
    // Mutate this specific patient
    await mutate();

    // Also mutate the patients list to keep it in sync
    globalMutate(
      (key) =>
        typeof key === 'string' && key.startsWith(`/api/teams/${slug}/patients`)
    );
  };

  return {
    patient: data?.data,
    isLoading,
    error,
    mutate: mutatePatient,
  };
};

export default usePatient;
