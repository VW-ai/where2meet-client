'use client';

import { useEffect, useState, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap, MapMouseEvent } from '@vis.gl/react-google-maps';
import { Location, Circle, Candidate } from '@/types';

interface MapViewProps {
  apiKey: string;
  locations: Location[];
  centroid: { lat: number; lng: number } | null;
  circle: Circle | null;
  candidates: Candidate[];
  selectedCandidate: Candidate | null;
  onMapClick: (lat: number, lng: number) => void;
  onCandidateClick: (candidate: Candidate) => void;
}

function MapContent({
  locations,
  centroid,
  circle,
  candidates,
  selectedCandidate,
  onMapClick,
  onCandidateClick,
}: Omit<MapViewProps, 'apiKey'>) {
  const map = useMap();

  // Draw circle overlay
  useEffect(() => {
    if (!map || !circle) return;

    const circleOverlay = new google.maps.Circle({
      map: map,
      center: circle.center,
      radius: circle.radius,
      strokeColor: '#4F46E5',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#4F46E5',
      fillOpacity: 0.15,
    });

    return () => {
      circleOverlay.setMap(null);
    };
  }, [map, circle]);

  // Fit bounds to show all markers
  useEffect(() => {
    if (!map) return;

    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    locations.forEach((loc) => {
      bounds.extend({ lat: loc.lat, lng: loc.lng });
      hasPoints = true;
    });

    if (centroid) {
      bounds.extend(centroid);
      hasPoints = true;
    }

    candidates.forEach((cand) => {
      bounds.extend({ lat: cand.lat, lng: cand.lng });
      hasPoints = true;
    });

    if (hasPoints) {
      map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
    }
  }, [map, locations, centroid, candidates]);

  return (
    <>
      {/* User-entered location markers (blue) */}
      {locations.map((location) => (
        <AdvancedMarker
          key={location.id}
          position={{ lat: location.lat, lng: location.lng }}
          title={location.address || `Location ${location.id}`}
        >
          <div className="w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-lg" />
        </AdvancedMarker>
      ))}

      {/* Centroid marker (green) */}
      {centroid && (
        <AdvancedMarker position={centroid} title="Center Point">
          <div className="w-8 h-8 bg-green-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        </AdvancedMarker>
      )}

      {/* Candidate markers (orange/red) */}
      {candidates.map((candidate) => (
        <AdvancedMarker
          key={candidate.id}
          position={{ lat: candidate.lat, lng: candidate.lng }}
          title={candidate.name}
          onClick={() => onCandidateClick(candidate)}
        >
          <div
            className={`w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-pointer transition-transform hover:scale-125 ${
              selectedCandidate?.id === candidate.id
                ? 'bg-red-600 scale-125'
                : 'bg-orange-500'
            }`}
          />
        </AdvancedMarker>
      ))}
    </>
  );
}

export default function MapView(props: MapViewProps) {
  const [defaultCenter] = useState({ lat: 37.7749, lng: -122.4194 }); // San Francisco

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      if (e.detail.latLng) {
        props.onMapClick(e.detail.latLng.lat, e.detail.latLng.lng);
      }
    },
    [props]
  );

  return (
    <APIProvider apiKey={props.apiKey}>
      <div className="w-full h-full">
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={12}
          mapId="where2meet-map"
          onClick={handleMapClick}
          gestureHandling="greedy"
          disableDefaultUI={false}
          clickableIcons={false}
        >
          <MapContent {...props} />
        </Map>
      </div>
    </APIProvider>
  );
}
