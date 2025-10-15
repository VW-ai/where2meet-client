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
  myParticipantId?: string;
  travelMode?: google.maps.TravelMode;
  onTravelModeChange?: (mode: google.maps.TravelMode) => void;
}

function MapContent({
  locations,
  centroid,
  circle,
  candidates,
  selectedCandidate,
  onMapClick,
  onCandidateClick,
  myParticipantId,
  travelMode,
  onRouteInfoChange,
}: Omit<MapViewProps, 'apiKey' | 'onTravelModeChange'> & {
  onRouteInfoChange?: (info: { distance: string; duration: string } | null) => void;
}) {
  const map = useMap();
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  // Initialize directions renderer
  useEffect(() => {
    if (!map) return;

    const renderer = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: true, // We'll use our own markers
      polylineOptions: {
        strokeColor: '#10B981',
        strokeWeight: 4,
        strokeOpacity: 0.8,
      },
    });

    setDirectionsRenderer(renderer);

    return () => {
      renderer.setMap(null);
    };
  }, [map]);

  // Calculate and display route when candidate is selected
  useEffect(() => {
    if (!map || !directionsRenderer || !selectedCandidate || !myParticipantId) {
      // Clear route if no candidate selected
      if (directionsRenderer) {
        directionsRenderer.setDirections({ routes: [] } as any);
      }
      onRouteInfoChange?.(null);
      return;
    }

    // Find user's location
    const myLocation = locations.find(loc => loc.id === myParticipantId);
    if (!myLocation) {
      onRouteInfoChange?.(null);
      return;
    }

    // Calculate route
    const directionsService = new google.maps.DirectionsService();
    const request: google.maps.DirectionsRequest = {
      origin: { lat: myLocation.lat, lng: myLocation.lng },
      destination: { lat: selectedCandidate.lat, lng: selectedCandidate.lng },
      travelMode: travelMode || google.maps.TravelMode.DRIVING,
    };

    directionsService.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        directionsRenderer.setDirections(result);

        // Extract route info
        const route = result.routes[0];
        if (route && route.legs[0]) {
          onRouteInfoChange?.({
            distance: route.legs[0].distance?.text || '',
            duration: route.legs[0].duration?.text || '',
          });
        }
      } else {
        console.error('Directions request failed:', status);
        onRouteInfoChange?.(null);
      }
    });
  }, [map, directionsRenderer, selectedCandidate, myParticipantId, locations, travelMode, onRouteInfoChange]);

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
      // For single location without candidates, use moderate zoom instead of fitBounds
      if (locations.length === 1 && candidates.length === 0) {
        map.setCenter(locations[0]);
        map.setZoom(14); // Closer zoom level for single participant (was 11, now 14 for better view)
      } else {
        map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
      }
    }
  }, [map, locations, centroid, candidates]);

  return (
    <>
      {/* Participant location markers - Differentiate between own and others */}
      {locations.map((location) => {
        const isMyLocation = myParticipantId && location.id === myParticipantId;
        return (
          <AdvancedMarker
            key={location.id}
            position={{ lat: location.lat, lng: location.lng }}
            title={location.name || location.address || `Participant ${location.id.slice(0, 8)}`}
          >
            <div className="flex flex-col items-center">
              {/* Marker */}
              <div
                className={`w-7 h-7 rounded-full border-3 border-white shadow-lg ${
                  isMyLocation
                    ? 'bg-emerald-500 ring-2 ring-emerald-300'
                    : 'bg-blue-500'
                }`}
              />
              {/* Name label */}
              {location.name && (
                <div className={`mt-1 px-2 py-1 rounded text-xs font-semibold shadow-md ${
                  isMyLocation
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 text-white'
                }`}>
                  {isMyLocation ? 'You' : location.name}
                </div>
              )}
            </div>
          </AdvancedMarker>
        );
      })}

      {/* Centroid marker (purple) */}
      {centroid && (
        <AdvancedMarker position={centroid} title="Center Point">
          <div className="w-8 h-8 bg-purple-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
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
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  // Check if Google Maps is loaded
  useEffect(() => {
    const checkGoogleLoaded = () => {
      if (typeof window !== 'undefined' && window.google?.maps) {
        setIsGoogleLoaded(true);
      } else {
        setTimeout(checkGoogleLoaded, 100);
      }
    };
    checkGoogleLoaded();
  }, []);

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      if (e.detail.latLng) {
        props.onMapClick(e.detail.latLng.lat, e.detail.latLng.lng);
      }
    },
    [props]
  );

  const isModeActive = useCallback((mode: 'DRIVING' | 'WALKING' | 'TRANSIT' | 'BICYCLING') => {
    if (!isGoogleLoaded || !window.google?.maps?.TravelMode) {
      return mode === 'DRIVING' && !props.travelMode;
    }
    const modeEnum = google.maps.TravelMode[mode];
    return props.travelMode === modeEnum || (!props.travelMode && mode === 'DRIVING');
  }, [isGoogleLoaded, props.travelMode]);

  const handleTravelModeClick = useCallback((mode: 'DRIVING' | 'WALKING' | 'TRANSIT' | 'BICYCLING') => {
    if (!isGoogleLoaded || !window.google?.maps?.TravelMode) return;
    const modeEnum = google.maps.TravelMode[mode];
    props.onTravelModeChange?.(modeEnum);
  }, [isGoogleLoaded, props.onTravelModeChange]);

  return (
    <APIProvider
      apiKey={props.apiKey}
      libraries={['places', 'marker']}
    >
      <div className="w-full h-full relative">
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={12}
          mapId="where2meet-map"
          onClick={handleMapClick}
          gestureHandling="greedy"
          disableDefaultUI={false}
          clickableIcons={false}
        >
          <MapContent {...props} onRouteInfoChange={setRouteInfo} />
        </Map>

        {/* Route Info Display with Transportation Mode Selector */}
        {routeInfo && props.selectedCandidate && props.myParticipantId && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 z-10 min-w-[320px]">
            <div className="text-sm font-semibold text-gray-800 mb-3">
              Route to {props.selectedCandidate.name}
            </div>

            {/* Transportation Mode Selector */}
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-600 mb-2">Travel Mode</div>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => handleTravelModeClick('DRIVING')}
                  className={`px-3 py-2 text-sm rounded-lg transition-all ${
                    isModeActive('DRIVING')
                      ? 'bg-blue-600 text-white shadow-md scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="Driving"
                >
                  🚗 Drive
                </button>
                <button
                  onClick={() => handleTravelModeClick('WALKING')}
                  className={`px-3 py-2 text-sm rounded-lg transition-all ${
                    isModeActive('WALKING')
                      ? 'bg-blue-600 text-white shadow-md scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="Walking"
                >
                  🚶 Walk
                </button>
                <button
                  onClick={() => handleTravelModeClick('TRANSIT')}
                  className={`px-3 py-2 text-sm rounded-lg transition-all ${
                    isModeActive('TRANSIT')
                      ? 'bg-blue-600 text-white shadow-md scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="Public Transit"
                >
                  🚌 Transit
                </button>
                <button
                  onClick={() => handleTravelModeClick('BICYCLING')}
                  className={`px-3 py-2 text-sm rounded-lg transition-all ${
                    isModeActive('BICYCLING')
                      ? 'bg-blue-600 text-white shadow-md scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="Bicycling"
                >
                  🚴 Bike
                </button>
              </div>
            </div>

            {/* Route Stats */}
            <div className="flex justify-around text-center pt-3 border-t border-gray-200">
              <div>
                <div className="text-2xl font-bold text-green-600">{routeInfo.duration}</div>
                <div className="text-xs text-gray-600">Duration</div>
              </div>
              <div className="border-l border-gray-300" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{routeInfo.distance}</div>
                <div className="text-xs text-gray-600">Distance</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </APIProvider>
  );
}
