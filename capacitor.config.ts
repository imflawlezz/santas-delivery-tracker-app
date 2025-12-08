import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.santasdelivery',
  appName: "Santa's Delivery Tracker",
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      permissions: {
        camera: 'This app needs access to your camera to take photos of delivery locations.',
        photos: 'This app needs access to your photos to save delivery images.'
      }
    },
    Geolocation: {
      permissions: {
        location: 'This app needs access to your location to record delivery coordinates.'
      }
    }
  }
};

export default config;
