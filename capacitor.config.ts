import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kaidoeo.olympic',
  appName: 'OEO',
  webDir: 'dist',
  plugins: {
    // Notifications show in every case: the app closed or in the background (Android shows them), and open too
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
