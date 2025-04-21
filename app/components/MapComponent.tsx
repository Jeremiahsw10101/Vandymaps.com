'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer, LoadScript } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const libraries = ['places', 'routes'];

interface MapProps {
  center: google.maps.LatLngLiteral;
  locations: Record<string, google.maps.LatLngLiteral>;
  selectedParking: string;
  selectedBuilding: string;
  directions: google.maps.DirectionsResult | null;
  setDirections: (directions: google.maps.DirectionsResult | null) => void;
}

const MapComponent = ({ 
  center, 
  locations, 
  selectedParking, 
  selectedBuilding,
  directions,
  setDirections 
}: MapProps) => {
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState('');
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  
  // Debug API key - showing only the first few characters for security
  const maskedKey = apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : 'not set';
  
  useEffect(() => {
    console.log(`API Key status: ${apiKey ? 'Set' : 'Not set'}`);
    if (!apiKey) {
      setLoadingError('API key not found');
    }
  }, [apiKey]);
  
  // Calculate route between selected points
  const calculateRoute = useCallback(() => {
    if (!selectedParking || !selectedBuilding || !directionsServiceRef.current) return;

    const origin = locations[selectedParking];
    const destination = locations[selectedBuilding];

    directionsServiceRef.current.route(
      {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        travelMode: google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        } else {
          console.error(`Directions request failed: ${status}`);
          setDirections(null);
        }
      }
    );
  }, [selectedParking, selectedBuilding, locations, setDirections]);

  // Effect to calculate route when selections change
  useEffect(() => {
    if (isGoogleMapsLoaded && selectedParking && selectedBuilding && directionsServiceRef.current) {
      calculateRoute();
    }
  }, [isGoogleMapsLoaded, selectedParking, selectedBuilding, calculateRoute]);

  // Setup Google Maps when loaded
  const onMapLoad = useCallback((map: google.maps.Map) => {
    console.log('Map loaded successfully');
    mapRef.current = map;
    directionsServiceRef.current = new google.maps.DirectionsService();
    setIsGoogleMapsLoaded(true);
  }, []);

  // Handle load script error
  const handleLoadError = useCallback(() => {
    console.error('Google Maps script failed to load');
    setLoadingError('Failed to load Google Maps. Please check your API key and internet connection.');
  }, []);

  if (loadingError) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-gray-100 p-4 text-center rounded-lg">
        <div className="text-red-600 font-medium mb-4">
          Google Maps Error
        </div>
        <p className="text-gray-700 mb-4 max-w-md">
          {loadingError}
        </p>
        <div className="bg-gray-200 p-4 rounded-lg text-left w-full max-w-md overflow-auto">
          <p className="text-sm text-gray-800 mb-2">
            Debug info:
          </p>
          <code className="text-xs text-gray-800">
            API Key: {maskedKey}<br />
            Selected Parking: {selectedParking || 'none'}<br />
            Selected Building: {selectedBuilding || 'none'}
          </code>
        </div>
      </div>
    );
  }

  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      libraries={libraries as any}
      onLoad={() => console.log('Script loaded successfully')}
      onError={handleLoadError}
      loadingElement={
        <div className="h-full w-full flex items-center justify-center bg-gray-100">
          <div className="animate-pulse text-gray-600">Loading Google Maps...</div>
        </div>
      }
    >
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={16}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true,
          streetViewControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'on' }]
            }
          ]
        }}
        onLoad={onMapLoad}
      >
        {/* Render markers if directions not loaded */}
        {!directions && selectedParking && (
          <Marker 
            position={locations[selectedParking]} 
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new google.maps.Size(40, 40)
            }}
          />
        )}
        
        {!directions && selectedBuilding && (
          <Marker 
            position={locations[selectedBuilding]}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              scaledSize: new google.maps.Size(40, 40)
            }}
          />
        )}
        
        {/* Render directions if available */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: false,
              polylineOptions: {
                strokeColor: '#4285F4',
                strokeWeight: 6,
                strokeOpacity: 0.8
              }
            }}
          />
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default MapComponent;
