import fetcher from '@/lib/fetcher';
import type { Patient } from '@prisma/client';
import useSWR from 'swr';
import { useSWRConfig } from 'swr';
import type { ApiResponse } from 'types';

interface PatientsResponse {
  patients: Patient[];
  pagination: {
    total: number;
    hasMore: boolean;
    limit: number;
    offset: number;
  };
}

interface UsePatientOptions {
  search?: string;
  limit?: number;
  offset?: number;
}

const usePatients = (slug: string | undefined, options?: UsePatientOptions) => {
  const { mutate: globalMutate } = useSWRConfig();

  const params = new URLSearchParams();
  if (options?.search) params.append('search', options.search);
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.offset) params.append('offset', options.offset.toString());

  const queryString = params.toString();
  const url = `/api/teams/${slug}/patients${queryString ? `?${queryString}` : ''}`;

  const { data, error, isLoading } = useSWR<ApiResponse<PatientsResponse>>(
    () => {
      return slug ? url : null;
    },
    fetcher
  );

  const mutatePatients = async () => {
    // Use global mutate to revalidate all patient-related keys for this team
    globalMutate(
      (key) =>
        typeof key === 'string' && key.startsWith(`/api/teams/${slug}/patients`)
    );
  };

  return {
    data,
    isLoading,
    error,
    mutate: mutatePatients,
  };
};

export default usePatients;
