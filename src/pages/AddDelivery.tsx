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
  useIonToast
} from '@ionic/react';
import { camera, location as locationIcon, calendar } from 'ionicons/icons';
import { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { DeliveryLocation } from '../types/DeliveryLocation';
import { StorageService } from '../services/StorageService';
import './AddDelivery.css';

const AddDelivery: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [presentToast] = useIonToast();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [photoPath, setPhotoPath] = useState<string>('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [date, setDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    if (id) {
      loadLocation();
    } else {
      setDate(new Date().toISOString());
      getCurrentLocation();
    }
  }, [id]);

  const loadLocation = async () => {
    const location = await StorageService.getLocation(id);
    if (location) {
      setName(location.name);
      setDescription(location.description);
      setPhotoPath(location.photoPath);
      setLatitude(location.latitude);
      setLongitude(location.longitude);
      setDate(location.date);
      
      // Load image
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
      const position = await Geolocation.getCurrentPosition();
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

  const takePhoto = async () => {
    try {
      // Ensure photos directory exists
      await Filesystem.mkdir({
        path: 'photos',
        directory: Directory.Data,
        recursive: true
      });

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
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
        
        // Update date and location when taking a new photo
        setDate(new Date().toISOString());
        await getCurrentLocation();
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      presentToast({
        message: 'Could not take photo. Please check camera permissions.',
        duration: 3000,
        color: 'danger'
      });
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
      history.goBack();
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
              <div className="photo-placeholder" onClick={takePhoto}>
                <IonIcon icon={camera} size="large" />
                <p>Tap to take photo</p>
              </div>
            )}
            <IonButton
              expand="block"
              fill="outline"
              onClick={takePhoto}
              className="photo-button"
            >
              <IonIcon icon={camera} slot="start" />
              {photoDataUrl ? 'Retake Photo' : 'Take Photo'}
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

