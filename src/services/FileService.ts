import { Filesystem, Directory } from '@capacitor/filesystem';

export class FileService {
  static async ensurePhotosDirectory(): Promise<void> {
    try {
      await Filesystem.mkdir({
        path: 'photos',
        directory: Directory.Data,
        recursive: true
      });
    } catch (error) {
      // Directory might already exist, which is fine
      console.log('Photos directory check:', error);
    }
  }
}

