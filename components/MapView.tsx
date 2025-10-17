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
  onCentroidDrag?: (lat: number, lng: number) => void;
  isHost?: boolean;
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
  userLocation,
  onCentroidDrag,
  isHost,
}: Omit<MapViewProps, 'apiKey' | 'onTravelModeChange'> & {
  onRouteInfoChange?: (info: { distance: string; duration: string } | null) => void;
  userLocation?: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [hasInitialCentered, setHasInitialCentered] = useState(false);

  // Center map on user location when obtained (only once, only if no locations added yet)
  useEffect(() => {
    if (map && userLocation && !hasInitialCentered && locations.length === 0) {
      console.log('Centering map on user location:', userLocation);
      map.setCenter(userLocation);
      map.setZoom(12); // Reduced from 14 to 12 for less aggressive zoom
      setHasInitialCentered(true);
    }
  }, [map, userLocation, hasInitialCentered, locations.length]);

  // Initialize directions renderer
  useEffect(() => {
    if (!map) return;

    const renderer = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: true, // We'll use our own markers
      polylineOptions: {
        strokeColor: '#3B82F6', // Bright blue for better visibility
        strokeWeight: 6, // Thicker line (increased from 4)
        strokeOpacity: 1.0, // Fully opaque (increased from 0.8)
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
        map.setZoom(12); // Moderate zoom level for single participant - not too aggressive
      } else {
        map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
      }
    }
  }, [map, locations, centroid, candidates]);

  return (
    <>
      {/* Participant location markers - Triangle shapes */}
      {locations.map((location) => {
        // "You" marker: either participant's own location OR organizer's marked location
        const isMyLocation = (myParticipantId && location.id === myParticipantId) || location.name === 'You';
        return (
          <AdvancedMarker
            key={location.id}
            position={{ lat: location.lat, lng: location.lng }}
            title={location.name || location.address || `Participant ${location.id.slice(0, 8)}`}
          >
            <div className="flex flex-col items-center">
              {/* Triangle Marker */}
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                className={`drop-shadow-lg ${
                  isMyLocation ? 'filter drop-shadow-[0_0_4px_rgba(16,185,129,0.6)]' : ''
                }`}
              >
                {/* Triangle pointing up */}
                <path
                  d="M 16 4 L 28 28 L 4 28 Z"
                  fill={isMyLocation ? '#10b981' : '#3b82f6'}
                  stroke="white"
                  strokeWidth="2"
                />
                {/* Inner highlight for "you" marker */}
                {isMyLocation && (
                  <circle cx="16" cy="22" r="2" fill="white" />
                )}
              </svg>
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

      {/* Centroid marker (purple) - Draggable for hosts */}
      {centroid && (
        <AdvancedMarker
          position={centroid}
          title={isHost ? "Center Point (Drag to adjust)" : "Center Point"}
          draggable={isHost}
          onDragEnd={(e: google.maps.MapMouseEvent) => {
            if (e.latLng && onCentroidDrag) {
              onCentroidDrag(e.latLng.lat(), e.latLng.lng());
            }
          }}
        >
          <div className={`w-8 h-8 bg-purple-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${isHost ? 'cursor-move hover:scale-110 transition-transform' : ''}`}>
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        </AdvancedMarker>
      )}

      {/* Candidate markers - Differentiate user-added (pink squares) from search results (orange circles) */}
      {candidates.map((candidate) => {
        const isUserAdded = candidate.addedBy === 'organizer';
        const isSelected = selectedCandidate?.id === candidate.id;

        return (
          <AdvancedMarker
            key={candidate.id}
            position={{ lat: candidate.lat, lng: candidate.lng }}
            title={`${candidate.name}${isUserAdded ? ' (User Added)' : ''}`}
            onClick={() => onCandidateClick(candidate)}
          >
            <div
              className={`border-2 border-white shadow-lg cursor-pointer transition-all duration-200 hover:scale-150 ${
                isUserAdded
                  ? 'rounded-sm' // Square for user-added
                  : 'rounded-full' // Circle for search results
              } ${
                isSelected
                  ? isUserAdded
                    ? 'w-7 h-7 bg-pink-600 ring-2 ring-pink-300 scale-90'
                    : 'w-7 h-7 bg-red-600 ring-2 ring-red-300 scale-150'
                  : isUserAdded
                  ? 'w-4 h-4 bg-pink-500'
                  : 'w-4 h-4 bg-orange-500'
              }`}
            />
          </AdvancedMarker>
        );
      })}
    </>
  );
}

export default function MapView(props: MapViewProps) {
  const [defaultCenter] = useState({ lat: 37.7749, lng: -122.4194 }); // Default: San Francisco
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  // Get user's current location on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('User location obtained:', position.coords.latitude, position.coords.longitude);
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Geolocation error (using default center):', error.message);
          // Keep default center (San Francisco) if geolocation fails
        },
        {
          timeout: 5000,
          maximumAge: 60000, // Cache for 1 minute
        }
      );
    }
  }, []);

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
          <MapContent {...props} onRouteInfoChange={setRouteInfo} userLocation={userLocation} />
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
