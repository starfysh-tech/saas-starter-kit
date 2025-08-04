import {
  Cog6ToothIcon,
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'next-i18next';
import NavigationItems from './NavigationItems';
import { NavigationProps, MenuItem } from './NavigationItems';
import env from '@/lib/env';

interface NavigationItemsProps extends NavigationProps {
  slug: string;
}

const TeamNavigation = ({ slug, activePathname }: NavigationItemsProps) => {
  const { t } = useTranslation('common');

  const mainMenus: MenuItem[] = [];
  const bottomMenus: MenuItem[] = [];

  // Add dashboard
  if (env.teamFeatures.dashboard) {
    mainMenus.push({
      name: 'Dashboard',
      href: `/teams/${slug}`,
      icon: ChartBarIcon,
      active: activePathname === `/teams/${slug}`,
    });
  }

  // Add patients
  if (env.teamFeatures.patients) {
    mainMenus.push({
      name: 'Patients',
      href: `/teams/${slug}/patients`,
      icon: UserGroupIcon,
      active: activePathname === `/teams/${slug}/patients`,
    });
  }

  // Add reports
  if (env.teamFeatures.reports) {
    mainMenus.push({
      name: 'Reports',
      href: `/teams/${slug}/reports`,
      icon: DocumentTextIcon,
      active: activePathname === `/teams/${slug}/reports`,
    });
  }

  // Add settings at the bottom
  bottomMenus.push({
    name: t('settings'),
    href: `/teams/${slug}/settings`,
    icon: Cog6ToothIcon,
    active: activePathname?.startsWith(`/teams/${slug}/settings`),
  });

  return (
    <div className="flex flex-1 flex-col">
      <NavigationItems menus={mainMenus} />
      <div className="mt-auto">
        <NavigationItems menus={bottomMenus} />
      </div>
    </div>
  );
};

export default TeamNavigation;
