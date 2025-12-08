import { Camera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export class PermissionService {
  static async requestCameraPermission(): Promise<boolean> {
    if (Capacitor.getPlatform() === 'web') {
      return true; // Web doesn't need explicit permission requests
    }

    try {
      const status = await Camera.checkPermissions();
      
      if (status.camera === 'granted' && status.photos === 'granted') {
        return true;
      }

      const result = await Camera.requestPermissions();
      return result.camera === 'granted' && result.photos === 'granted';
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  }

  static async requestLocationPermission(): Promise<boolean> {
    if (Capacitor.getPlatform() === 'web') {
      return true; // Web doesn't need explicit permission requests
    }

    try {
      const status = await Geolocation.checkPermissions();
      
      if (status.location === 'granted') {
        return true;
      }

      const result = await Geolocation.requestPermissions();
      return result.location === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  static async checkCameraPermission(): Promise<boolean> {
    if (Capacitor.getPlatform() === 'web') {
      return true;
    }

    try {
      const status = await Camera.checkPermissions();
      return status.camera === 'granted' && status.photos === 'granted';
    } catch (error) {
      console.error('Error checking camera permission:', error);
      return false;
    }
  }

  static async checkLocationPermission(): Promise<boolean> {
    if (Capacitor.getPlatform() === 'web') {
      return true;
    }

    try {
      const status = await Geolocation.checkPermissions();
      return status.location === 'granted';
    } catch (error) {
      console.error('Error checking location permission:', error);
      return false;
    }
  }
}

