import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.noemicore.pio',
  appName: 'Pío',
  webDir: 'dist',
  android: { backgroundColor: '#2b1d0e' },
  plugins: {
    LocalNotifications: { smallIcon: 'ic_stat_pio', iconColor: '#FFD23F' },
  },
};

export default config;
