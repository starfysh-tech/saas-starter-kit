import { Error, Loading } from '@/components/shared';
import useTeam from 'hooks/useTeam';
import { useTranslation } from 'next-i18next';
import Patients from './Patients';

const PatientsContainer = () => {
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

  return <Patients team={team} />;
};

export default PatientsContainer;
