import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ledgerflow.mobilevibe',
  appName: 'LedgerFlow Vibe',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'ledgerflow',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#090d16',
      showSpinner: false,
    },
  },
  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile',
  },
};

export default config;
