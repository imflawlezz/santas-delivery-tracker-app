import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton
} from '@ionic/react';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon, divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { DeliveryLocation } from '../types/DeliveryLocation';
import { StorageService } from '../services/StorageService';
import './Map.css';

// Fix for default markers in react-leaflet
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const Map: React.FC = () => {
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [markerImages, setMarkerImages] = useState<Record<string, string>>({});

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    const loaded = await StorageService.getAllLocations();
    setLocations(loaded);

    // Load images for markers
    const images: Record<string, string> = {};
    for (const location of loaded) {
      try {
        const file = await Filesystem.readFile({
          path: location.photoPath,
          directory: Directory.Data
        });
        images[location.id] = `data:image/jpeg;base64,${file.data}`;
      } catch (error) {
        console.error('Error loading image for marker:', error);
      }
    }
    setMarkerImages(images);
  };

  const createCustomIcon = (imageUrl: string) => {
    return divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid #c41e3a;
          overflow: hidden;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          <img 
            src="${imageUrl}" 
            alt="marker" 
            style="
              width: 100%;
              height: 100%;
              object-fit: cover;
            "
          />
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });
  };

  // Calculate center of all locations
  const getCenter = (): [number, number] => {
    if (locations.length === 0) {
      return [52.2297, 21.0122]; // Default to Warsaw, Poland
    }
    
    const avgLat = locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length;
    const avgLng = locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length;
    
    return [avgLat, avgLng];
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Delivery Map</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {locations.length === 0 ? (
          <div className="map-empty-state">
            <p>No deliveries to show on map</p>
          </div>
        ) : (
          <MapContainer
            center={getCenter()}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {locations.map((location) => {
              const imageUrl = markerImages[location.id];
              const icon = imageUrl
                ? createCustomIcon(imageUrl)
                : defaultIcon;

              return (
                <Marker
                  key={location.id}
                  position={[location.latitude, location.longitude]}
                  icon={icon}
                >
                  <Popup>
                    <div className="map-popup">
                      {imageUrl && (
                        <img
                          src={imageUrl}
                          alt={location.name}
                          className="popup-image"
                        />
                      )}
                      <h3>{location.name}</h3>
                      {location.description && <p>{location.description}</p>}
                      <p className="popup-date">
                        {new Date(location.date).toLocaleDateString()}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Map;

