import { Filesystem, Directory } from '@capacitor/filesystem';

export class FileService {
  static async ensurePhotosDirectory(): Promise<void> {
    try {
      await Filesystem.mkdir({
        path: 'photos',
        directory: Directory.Data,
        recursive: true
      });
    } catch (error: any) {
      if (error?.code === 'OS-PLUG-FILE-0010' || 
          error?.message?.includes('already exists') ||
          error?.errorMessage?.includes('already exists')) {
        return;
      }
      console.log('Photos directory check error:', error);
    }
  }
}

