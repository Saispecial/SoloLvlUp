import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.sololvlup.app',
  appName: 'SoloLvlUp',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true, // Allow localhost in dev
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      showSpinner: false,
    },
  },
}

export default config
