'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const libraries = ['places', 'directions'];

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
  const mapRef = useRef<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries as any,
  });

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    directionsServiceRef.current = new google.maps.DirectionsService();
  }, []);

  // Effect to calculate route when selections change
  useEffect(() => {
    if (isLoaded && selectedParking && selectedBuilding && directionsServiceRef.current) {
      calculateRoute();
    }
  }, [isLoaded, selectedParking, selectedBuilding]);

  // Calculate route between selected points
  const calculateRoute = () => {
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
  };

  if (loadError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-red-600 font-medium">
          Error loading Google Maps. Please check your API key.
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="animate-pulse">Loading map...</div>
      </div>
    );
  }

  return (
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
  );
};

export default MapComponent;
