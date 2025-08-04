import { Error, Loading } from '@/components/shared';
import { AccessControl } from '@/components/shared/AccessControl';
import PatientBaseline from '@/components/patient/PatientBaseline';
import PatientTab from '@/components/patient/PatientTab';
import env from '@/lib/env';
import useTeam from 'hooks/useTeam';
import usePatient from 'hooks/usePatient';
import type { GetServerSidePropsContext } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const PatientBaselinePage = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { slug, patientId } = router.query as {
    slug: string;
    patientId: string;
  };

  const { isLoading: teamLoading, isError: teamError, team } = useTeam();
  const {
    patient,
    isLoading: patientLoading,
    error: patientError,
  } = usePatient(slug, patientId);

  if (teamLoading || patientLoading) {
    return <Loading />;
  }

  if (teamError) {
    return <Error message={teamError.message} />;
  }

  if (!team) {
    return <Error message={t('team-not-found')} />;
  }

  if (patientError) {
    const error_message =
      patientError.status === 404 ? 'Patient not found' : patientError.message;
    return <Error message={error_message} />;
  }

  if (!patient) {
    return <Error message="Patient not found" />;
  }

  return (
    <AccessControl resource="team_patient_baseline" actions={['read']}>
      <PatientTab
        activeTab="baseline"
        patient={patient}
        teamSlug={slug}
        heading="Baseline Data"
      />
      <PatientBaseline patient={patient} />
    </AccessControl>
  );
};

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  if (!env.teamFeatures.patients) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default PatientBaselinePage;
