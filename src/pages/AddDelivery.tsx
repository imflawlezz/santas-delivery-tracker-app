import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonInput,
  IonTextarea,
  IonItem,
  IonLabel,
  IonIcon,
  IonButtons,
  IonBackButton,
  IonImg,
  IonSpinner,
  useIonToast,
  useIonActionSheet,
  useIonViewWillEnter
} from '@ionic/react';
import { camera, location as locationIcon, calendar, images } from 'ionicons/icons';
import { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { DeliveryLocation } from '../types/DeliveryLocation';
import { StorageService } from '../services/StorageService';
import { PermissionService } from '../services/PermissionService';
import { FileService } from '../services/FileService';
import './AddDelivery.css';

const AddDelivery: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [presentToast] = useIonToast();
  const [presentActionSheet] = useIonActionSheet();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [photoPath, setPhotoPath] = useState<string>('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [date, setDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPhotoPath('');
    setPhotoDataUrl('');
    setLatitude(null);
    setLongitude(null);
    setDate(new Date().toISOString());
  };

  useEffect(() => {
    resetForm();
    
    if (id) {
      loadLocation();
    } else {
      getCurrentLocation();
    }
  }, [id]);

  useIonViewWillEnter(() => {
    if (id) {
      resetForm();
      loadLocation();
    } else {
      resetForm();
      getCurrentLocation();
    }
  });

  const loadLocation = async () => {
    const location = await StorageService.getLocation(id);
    if (location) {
      setName(location.name);
      setDescription(location.description);
      setPhotoPath(location.photoPath);
      setLatitude(location.latitude);
      setLongitude(location.longitude);
      setDate(location.date);
      
      try {
        const file = await Filesystem.readFile({
          path: location.photoPath,
          directory: Directory.Data
        });
        setPhotoDataUrl(`data:image/jpeg;base64,${file.data}`);
      } catch (error) {
        console.error('Error loading image:', error);
      }
    }
  };

  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const hasPermission = await PermissionService.requestLocationPermission();
      if (!hasPermission) {
        presentToast({
          message: 'Location permission is required. Please enable it in settings.',
          duration: 3000,
          color: 'warning'
        });
        setLoadingLocation(false);
        return;
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
    } catch (error) {
      console.error('Error getting location:', error);
      presentToast({
        message: 'Could not get location. Please enable location services.',
        duration: 3000,
        color: 'warning'
      });
    } finally {
      setLoadingLocation(false);
    }
  };

  const selectPhotoSource = () => {
    presentActionSheet({
      header: 'Select Photo',
      buttons: [
        {
          text: 'Camera',
          icon: camera,
          handler: () => {
            pickPhoto(CameraSource.Camera);
          }
        },
        {
          text: 'Gallery',
          icon: images,
          handler: () => {
            pickPhoto(CameraSource.Photos);
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
  };

  const pickPhoto = async (source: CameraSource) => {
    try {
      if (source === CameraSource.Camera) {
        const hasPermission = await PermissionService.requestCameraPermission();
        if (!hasPermission) {
          presentToast({
            message: 'Camera permission is required. Please enable it in settings.',
            duration: 3000,
            color: 'warning'
          });
          return;
        }
      }

      await FileService.ensurePhotosDirectory();

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: source
      });

      if (image.base64String) {
        const fileName = `delivery_${Date.now()}.jpg`;
        const filePath = `photos/${fileName}`;

        await Filesystem.writeFile({
          path: filePath,
          data: image.base64String,
          directory: Directory.Data
        });

        setPhotoPath(filePath);
        setPhotoDataUrl(`data:image/jpeg;base64,${image.base64String}`);
        
        setDate(new Date().toISOString());
        await getCurrentLocation();
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
        presentToast({
          message: 'Permission denied. Please enable it in app settings.',
          duration: 4000,
          color: 'danger'
        });
      } else if (errorMessage.includes('cancel') || errorMessage.includes('Cancel')) {
        return;
      } else {
        presentToast({
          message: 'Could not select photo. Please try again.',
          duration: 3000,
          color: 'danger'
        });
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      presentToast({
        message: 'Please enter a name',
        duration: 2000,
        color: 'warning'
      });
      return;
    }

    if (!photoPath) {
      presentToast({
        message: 'Please take a photo',
        duration: 2000,
        color: 'warning'
      });
      return;
    }

    setLoading(true);
    try {
      const location: DeliveryLocation = {
        id: id || `delivery_${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        photoPath,
        date: date || new Date().toISOString(),
        latitude: latitude || 0,
        longitude: longitude || 0
      };

      await StorageService.saveLocation(location);
      presentToast({
        message: id ? 'Delivery updated!' : 'Delivery saved!',
        duration: 2000,
        color: 'success'
      });
      
      history.push('/home');
    } catch (error) {
      console.error('Error saving location:', error);
      presentToast({
        message: 'Error saving delivery',
        duration: 3000,
        color: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>{id ? 'Edit Delivery' : 'New Delivery'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="add-delivery-container">
          <div className="photo-section">
            {photoDataUrl ? (
              <IonImg src={photoDataUrl} className="delivery-photo" />
            ) : (
              <div className="photo-placeholder" onClick={selectPhotoSource}>
                <IonIcon icon={camera} size="large" />
                <p>Tap to select photo</p>
              </div>
            )}
            <IonButton
              expand="block"
              fill="outline"
              onClick={selectPhotoSource}
              className="photo-button"
            >
              <IonIcon icon={photoDataUrl ? camera : images} slot="start" />
              {photoDataUrl ? 'Change Photo' : 'Select Photo'}
            </IonButton>
          </div>

          <IonItem>
            <IonLabel position="stacked">Name *</IonLabel>
            <IonInput
              value={name}
              placeholder="e.g., Dom Kasi"
              onIonInput={(e) => setName(e.detail.value!)}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Description</IonLabel>
            <IonTextarea
              value={description}
              placeholder="e.g., prezent: lalka"
              rows={4}
              onIonInput={(e) => setDescription(e.detail.value!)}
            />
          </IonItem>

          <IonItem>
            <IonIcon icon={calendar} slot="start" />
            <IonLabel>
              <h3>Date</h3>
              <p>{date ? new Date(date).toLocaleString() : 'Not set'}</p>
            </IonLabel>
          </IonItem>

          <IonItem>
            <IonIcon icon={locationIcon} slot="start" />
            <IonLabel>
              <h3>Location</h3>
              {loadingLocation ? (
                <IonSpinner name="dots" />
              ) : latitude && longitude ? (
                <p>{latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
              ) : (
                <p>Not available</p>
              )}
            </IonLabel>
            <IonButton
              slot="end"
              fill="clear"
              size="small"
              onClick={getCurrentLocation}
              disabled={loadingLocation}
            >
              Refresh
            </IonButton>
          </IonItem>

          <div className="save-button-container">
            <IonButton
              expand="block"
              onClick={handleSave}
              disabled={loading || !name.trim() || !photoPath}
            >
              {loading ? <IonSpinner name="dots" /> : 'Save Delivery'}
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AddDelivery;

