import { DeliveryLocation } from '../types/DeliveryLocation';
import { Preferences } from '@capacitor/preferences';

const STORAGE_KEY = 'delivery_locations';

export class StorageService {
  static async getAllLocations(): Promise<DeliveryLocation[]> {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEY });
      if (!value) return [];
      return JSON.parse(value);
    } catch (error) {
      console.error('Error loading locations:', error);
      return [];
    }
  }

  static async saveLocation(location: DeliveryLocation): Promise<void> {
    const locations = await this.getAllLocations();
    const index = locations.findIndex(l => l.id === location.id);
    
    if (index >= 0) {
      locations[index] = location;
    } else {
      locations.push(location);
    }
    
    await Preferences.set({
      key: STORAGE_KEY,
      value: JSON.stringify(locations)
    });
  }

  static async deleteLocation(id: string): Promise<void> {
    const locations = await this.getAllLocations();
    const filtered = locations.filter(l => l.id !== id);
    await Preferences.set({
      key: STORAGE_KEY,
      value: JSON.stringify(filtered)
    });
  }

  static async getLocation(id: string): Promise<DeliveryLocation | null> {
    const locations = await this.getAllLocations();
    return locations.find(l => l.id === id) || null;
  }
}

