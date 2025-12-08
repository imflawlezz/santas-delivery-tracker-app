import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonImg,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonActionSheet,
  useIonActionSheet,
  useIonToast
} from '@ionic/react';
import { location as locationIcon, calendar, create, trash } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { DeliveryLocation } from '../types/DeliveryLocation';
import { StorageService } from '../services/StorageService';
import './Detail.css';

const Detail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [presentActionSheet] = useIonActionSheet();
  const [presentToast] = useIonToast();
  const [location, setLocation] = useState<DeliveryLocation | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');

  useEffect(() => {
    loadLocation();
  }, [id]);

  const loadLocation = async () => {
    if (!id) return;
    
    const loaded = await StorageService.getLocation(id);
    if (loaded) {
      setLocation(loaded);
      
      // Load image
      try {
        const file = await Filesystem.readFile({
          path: loaded.photoPath,
          directory: Directory.Data
        });
        setPhotoDataUrl(`data:image/jpeg;base64,${file.data}`);
      } catch (error) {
        console.error('Error loading image:', error);
      }
    }
  };

  const handleDelete = () => {
    presentActionSheet({
      header: 'Delete Delivery',
      subHeader: 'Are you sure you want to delete this delivery?',
      buttons: [
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            if (id) {
              await StorageService.deleteLocation(id);
              presentToast({
                message: 'Delivery deleted',
                duration: 2000,
                color: 'success'
              });
              history.goBack();
            }
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
  };

  if (!location) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" />
            </IonButtons>
            <IonTitle>Delivery Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="loading-container">
            <p>Loading...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>{location.name}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push(`/add/${location.id}`)}>
              <IonIcon icon={create} />
            </IonButton>
            <IonButton onClick={handleDelete}>
              <IonIcon icon={trash} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="detail-container">
          {photoDataUrl && (
            <IonImg src={photoDataUrl} className="detail-photo" />
          )}

          <div className="detail-info">
            <IonItem>
              <IonLabel>
                <h2>{location.name}</h2>
              </IonLabel>
            </IonItem>

            {location.description && (
              <IonItem>
                <IonLabel>
                  <h3>Description</h3>
                  <p>{location.description}</p>
                </IonLabel>
              </IonItem>
            )}

            <IonItem>
              <IonIcon icon={calendar} slot="start" />
              <IonLabel>
                <h3>Date</h3>
                <p>{new Date(location.date).toLocaleString()}</p>
              </IonLabel>
            </IonItem>

            <IonItem>
              <IonIcon icon={locationIcon} slot="start" />
              <IonLabel>
                <h3>Location</h3>
                <p>
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </p>
              </IonLabel>
            </IonItem>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Detail;

