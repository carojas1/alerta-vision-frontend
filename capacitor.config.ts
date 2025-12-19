import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alertavision.app',
  appName: 'AlertaVisión',
  webDir: 'dist/auth-frontend/browser',
  server: {
    androidScheme: 'https'
  }
};

export default config;