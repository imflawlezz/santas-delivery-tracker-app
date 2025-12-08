import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonThumbnail, IonLabel, IonIcon, IonFab, IonFabButton, useIonViewWillEnter } from '@ionic/react';
import { add, location as locationIcon } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { DeliveryLocation } from '../types/DeliveryLocation';
import { StorageService } from '../services/StorageService';
import { Filesystem, Directory } from '@capacitor/filesystem';
import './Home.css';

const Home: React.FC = () => {
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const history = useHistory();

  const loadLocations = async () => {
    const loaded = await StorageService.getAllLocations();
    setLocations(loaded);
  };

  useEffect(() => {
    loadLocations();
  }, []);

  useIonViewWillEnter(() => {
    loadLocations();
  });

  const getImageSrc = async (photoPath: string): Promise<string> => {
    try {
      const file = await Filesystem.readFile({
        path: photoPath,
        directory: Directory.Data
      });
      return `data:image/jpeg;base64,${file.data}`;
    } catch (error) {
      console.error('Error loading image:', error);
      return '';
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Santa's Deliveries</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        {locations.length === 0 ? (
          <div className="empty-state">
            <IonIcon icon={locationIcon} size="large" color="medium" />
            <h2>No deliveries yet</h2>
            <p>Tap the + button to add your first delivery location</p>
          </div>
        ) : (
          <IonList>
            {locations.map((location) => (
              <LocationItem
                key={location.id}
                location={location}
                onSelect={() => history.push(`/detail/${location.id}`)}
                getImageSrc={getImageSrc}
              />
            ))}
          </IonList>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton routerLink="/add" color="primary">
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

interface LocationItemProps {
  location: DeliveryLocation;
  onSelect: () => void;
  getImageSrc: (photoPath: string) => Promise<string>;
}

const LocationItem: React.FC<LocationItemProps> = ({ location, onSelect, getImageSrc }) => {
  const [imageSrc, setImageSrc] = useState<string>('');

  useEffect(() => {
    getImageSrc(location.photoPath).then(setImageSrc);
  }, [location.photoPath]);

  return (
    <IonItem button onClick={onSelect} className="location-item">
      <IonThumbnail slot="start">
        {imageSrc ? (
          <img src={imageSrc} alt={location.name} />
        ) : (
          <div className="thumbnail-placeholder">
            <IonIcon icon={locationIcon} size="small" />
          </div>
        )}
      </IonThumbnail>
      <IonLabel>
        <h2>{location.name}</h2>
        <p>{new Date(location.date).toLocaleDateString()}</p>
      </IonLabel>
    </IonItem>
  );
};

export default Home;
