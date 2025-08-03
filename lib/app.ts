import packageInfo from '../package.json';
import env from './env';

const app = {
  version: packageInfo.version,
  name: 'MQOL',
  logoUrl: '/images/logos/mqol-logo-350x93.png',
  url: env.appUrl,
};

export default app;
