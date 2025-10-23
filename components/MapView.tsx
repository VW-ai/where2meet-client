'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap, MapMouseEvent } from '@vis.gl/react-google-maps';
import { Location, Circle, Candidate } from '@/types';
import { Car, PersonStanding, Train, Bike, Clock, Route, Heart } from 'lucide-react';

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
  routeFromParticipantId?: string | null; // For hosts to view routes from any participant
  travelMode?: google.maps.TravelMode;
  onTravelModeChange?: (mode: google.maps.TravelMode) => void;
  onCentroidDrag?: (lat: number, lng: number) => void;
  isHost?: boolean;
  language?: string;
  participantColors?: Map<string, string>; // Map of participant ID to color
  candidateColors?: Map<string, string>; // Map of candidate ID to color (red shades)
  showParticipantNames?: boolean; // Toggle for showing participant names
  selectedParticipantId?: string | null; // For two-way binding with participant list
  chartRouteMode?: boolean; // When true, show route in grey instead of participant color
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
  routeFromParticipantId,
  travelMode,
  onRouteInfoChange,
  userLocation,
  onCentroidDrag,
  isHost,
  onMapReady,
  onLocationClick,
  participantColors,
  candidateColors,
  showParticipantNames = true,
  selectedParticipantId,
  chartRouteMode = false,
}: Omit<MapViewProps, 'apiKey' | 'onTravelModeChange'> & {
  onRouteInfoChange?: (info: { distance: string; duration: string } | null) => void;
  userLocation?: { lat: number; lng: number } | null;
  onMapReady?: (map: google.maps.Map) => void;
  onLocationClick?: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  // Notify parent when map is ready
  useEffect(() => {
    if (map && onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);
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

  // Center map on selected participant (two-way binding from list click)
  useEffect(() => {
    if (map && selectedParticipantId) {
      const participant = locations.find(loc => loc.id === selectedParticipantId);
      if (participant) {
        map.panTo({ lat: participant.lat, lng: participant.lng });
        map.setZoom(14); // Zoom in a bit to focus on the participant
      }
    }
  }, [map, selectedParticipantId, locations]);

  // Initialize directions renderer
  useEffect(() => {
    if (!map) return;

    // Create a hidden div for directions panel to prevent Google Maps from creating visible UI
    const hiddenPanel = document.createElement('div');
    hiddenPanel.style.display = 'none';

    // Use grey color when in chart route mode, otherwise black
    const routeColor = chartRouteMode ? '#808080' : '#000000';

    const renderer = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: true, // We'll use our own markers
      suppressInfoWindows: true, // Suppress the default info windows
      panel: hiddenPanel, // Use hidden div to capture any panel output
      polylineOptions: {
        strokeColor: routeColor, // Grey for chart mode, black otherwise
        strokeWeight: 6, // Thicker line (increased from 4)
        strokeOpacity: 1.0, // Fully opaque (increased from 0.8)
      },
    });

    setDirectionsRenderer(renderer);

    return () => {
      renderer.setMap(null);
      if (hiddenPanel.parentNode) {
        hiddenPanel.parentNode.removeChild(hiddenPanel);
      }
    };
  }, [map, chartRouteMode]);

  // Calculate and display route when candidate is selected
  useEffect(() => {
    // Use routeFromParticipantId if provided (for hosts), otherwise use myParticipantId
    const participantIdForRoute = routeFromParticipantId || myParticipantId;

    if (!map || !directionsRenderer || !selectedCandidate || !participantIdForRoute) {
      // Clear route if no candidate selected
      if (directionsRenderer) {
        directionsRenderer.setDirections({ routes: [] } as any);
      }
      onRouteInfoChange?.(null);
      return;
    }

    // Find the participant's location for route calculation
    const participantLocation = locations.find(loc => loc.id === participantIdForRoute);
    if (!participantLocation) {
      onRouteInfoChange?.(null);
      return;
    }

    // Calculate route
    const directionsService = new google.maps.DirectionsService();
    const request: google.maps.DirectionsRequest = {
      origin: { lat: participantLocation.lat, lng: participantLocation.lng },
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
  }, [map, directionsRenderer, selectedCandidate, myParticipantId, routeFromParticipantId, locations, travelMode, onRouteInfoChange]);

  // Draw circle overlay
  useEffect(() => {
    console.log('🟣 MapView circle effect triggered - map:', !!map, 'circle:', circle);

    if (!map) {
      console.log('🟣 MapView: No map yet, skipping circle render');
      return;
    }

    if (!circle) {
      console.log('🟣 MapView: No circle data, skipping circle render');
      return;
    }

    console.log('🟣 MapView: Creating circle overlay with:', {
      center: circle.center,
      radius: circle.radius,
      radiusKm: (circle.radius / 1000).toFixed(2)
    });

    const circleOverlay = new google.maps.Circle({
      map: map,
      center: circle.center,
      radius: circle.radius,
      strokeColor: '#000000', // Black border for techno style
      strokeOpacity: 1.0, // Solid black border
      strokeWeight: 3, // Thicker border
      fillColor: '#1a1a1a', // Very dark grey-black
      fillOpacity: 0.08, // Very transparent
    });

    console.log('🟣 MapView: Circle overlay created successfully');

    return () => {
      console.log('🟣 MapView: Cleaning up circle overlay');
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
      {/* Participant location markers - Triangle shapes with assigned colors */}
      {locations.map((location) => {
        // Identify user's own marker for special styling
        const isMyLocation = myParticipantId && location.id === myParticipantId;
        const isSelected = selectedParticipantId === location.id;
        // Get assigned color from map, fallback to default
        const assignedColor = participantColors?.get(location.id) || '#3b82f6';

        return (
          <AdvancedMarker
            key={location.id}
            position={{ lat: location.lat, lng: location.lng }}
            title={location.name || location.address || `Participant ${location.id.slice(0, 8)}`}
            onClick={() => {
              // Center map on this participant's location when clicked
              onLocationClick?.(location.lat, location.lng);
            }}
          >
            <div className="flex flex-col items-center group">
              {/* Triangle Marker */}
              <svg
                width={isSelected ? "40" : "32"}
                height={isSelected ? "40" : "32"}
                viewBox="0 0 32 32"
                className={`drop-shadow-lg transition-all duration-200 ${isSelected ? 'scale-125' : ''}`}
              >
                {/* Triangle pointing up */}
                <path
                  d="M 16 4 L 28 28 L 4 28 Z"
                  fill={assignedColor}
                  stroke={isMyLocation ? assignedColor : 'white'}
                  strokeWidth={isMyLocation ? '3' : '2'}
                />
                {/* Inner highlight for "you" marker */}
                {isMyLocation && (
                  <circle cx="16" cy="22" r="2" fill="white" />
                )}
              </svg>
              {/* Name label - Show if toggle is on OR on hover OR selected */}
              {location.name && (
                <div
                  className={`mt-1 px-2 py-1 text-xs font-semibold shadow-md border-2 transition-opacity ${
                    isMyLocation ? 'border-white text-white' : 'border-black text-white'
                  } ${
                    showParticipantNames || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  style={{ backgroundColor: assignedColor }}
                >
                  {isMyLocation && '→ '}
                  {location.name}
                </div>
              )}
            </div>
          </AdvancedMarker>
        );
      })}

      {/* Centroid marker (black) - Draggable for hosts */}
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
          <div className={`w-8 h-8 bg-black rounded-full border-2 border-white shadow-lg flex items-center justify-center ${isHost ? 'cursor-move hover:scale-110 transition-transform' : ''}`}>
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        </AdvancedMarker>
      )}

      {/* Candidate markers - Hearts for saved (voted), Circles for search results */}
      {candidates.map((candidate) => {
        const isSelected = selectedCandidate?.id === candidate.id;
        const isSaved = (candidate.voteCount ?? 0) > 0; // Saved locations have votes
        // Get assigned color from map, fallback to red for saved, grey for search results
        const assignedColor = isSaved
          ? (candidateColors?.get(candidate.id) || '#ef4444')
          : '#6b7280'; // grey for search results

        return (
          <AdvancedMarker
            key={candidate.id}
            position={{ lat: candidate.lat, lng: candidate.lng }}
            title={candidate.name}
            onClick={() => onCandidateClick(candidate)}
          >
            {isSaved ? (
              // Saved locations: Hearts with red color palette
              <Heart
                className={`cursor-pointer transition-all duration-200 drop-shadow-lg ${
                  isSelected
                    ? 'w-8 h-8' // Bigger when selected
                    : 'w-5 h-5'
                }`}
                fill={isSelected ? '#fbbf24' : assignedColor} // Bright yellow when selected, assigned red shade otherwise
                stroke="black"
                strokeWidth={2}
              />
            ) : (
              // Search results: Simple grey circles
              <div
                className={`border-2 border-black shadow-lg cursor-pointer transition-all duration-200 rounded-full ${
                  isSelected
                    ? 'w-6 h-6' // Bigger when selected
                    : 'w-4 h-4'
                }`}
                style={{
                  backgroundColor: isSelected ? '#fbbf24' : assignedColor // Bright yellow when selected, grey otherwise
                }}
              />
            )}
          </AdvancedMarker>
        );
      })}
    </>
  );
}

export default function MapView(props: MapViewProps) {
  const [defaultCenter, setDefaultCenter] = useState({ lat: 37.7749, lng: -122.4194 }); // Default: San Francisco
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Get user's current location on mount
  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('📍 User location obtained:', position.coords.latitude, position.coords.longitude);
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setDefaultCenter(location); // Set as default center
          setIsLocating(false);
        },
        (error) => {
          console.log('⚠️ Geolocation error (using default center):', error.message);
          setIsLocating(false);
          // Keep default center (San Francisco) if geolocation fails
        },
        {
          timeout: 10000,
          maximumAge: 0, // Don't use cached position, get fresh location
          enableHighAccuracy: true,
        }
      );
    }
  };

  const centerOnCircle = () => {
    if (props.circle?.center && mapRef.current) {
      // Center on the circle's center point (centroid)
      mapRef.current.setCenter(props.circle.center);
      mapRef.current.setZoom(14);
    } else if (props.centroid && mapRef.current) {
      // Fallback to centroid if circle not available
      mapRef.current.setCenter(props.centroid);
      mapRef.current.setZoom(14);
    }
  };

  const centerOnLocation = useCallback((lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.setCenter({ lat, lng });
      mapRef.current.setZoom(14);
    }
  }, []);

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
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
    if (!isGoogleLoaded || !window.google?.maps?.TravelMode) {
      console.log('Google Maps not loaded yet');
      return;
    }
    const modeEnum = google.maps.TravelMode[mode];
    console.log('Travel mode clicked:', mode, 'enum:', modeEnum);
    if (props.onTravelModeChange) {
      props.onTravelModeChange(modeEnum);
      console.log('onTravelModeChange called with:', modeEnum);
    } else {
      console.log('onTravelModeChange is not defined');
    }
  }, [isGoogleLoaded, props]);

  // Map language codes for Google Maps API
  const mapLanguage = props.language === 'zh' ? 'zh-CN' : props.language || 'en';

  return (
    <APIProvider
      apiKey={props.apiKey}
      libraries={['places', 'marker']}
      language={mapLanguage}
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
          <MapContent
            {...props}
            onRouteInfoChange={setRouteInfo}
            userLocation={userLocation}
            onMapReady={handleMapReady}
            onLocationClick={centerOnLocation}
          />
        </Map>

        {/* Center on Circle Button - Techno Style */}
        <button
          onClick={centerOnCircle}
          disabled={!props.circle && !props.centroid}
          className="absolute bottom-32 right-4 w-12 h-12 bg-white hover:bg-black text-black hover:text-white font-medium border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10 flex items-center justify-center"
          title="Center map on search area"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth={2} />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
          </svg>
        </button>

        {/* Route Info Display - Compact with Horizontal Bottom Buttons (Top Right) */}
        {routeInfo && props.selectedCandidate && props.myParticipantId && (
          <div className="absolute top-4 right-4 bg-white border-2 border-black shadow-lg z-10 w-[160px]">
            {/* Header */}
            <div className="px-2 py-1 bg-black text-white border-b-2 border-black">
              <div className="text-xs font-bold uppercase truncate">{props.selectedCandidate.name}</div>
            </div>

            {/* Route Stats - Compact */}
            <div className="px-2 py-1.5 space-y-1 text-black">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span className="text-xs font-bold">{routeInfo.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <Route className="w-3 h-3 flex-shrink-0" />
                <span className="text-xs font-bold">{routeInfo.distance}</span>
              </div>
            </div>

            {/* Bottom: Horizontal Transportation Mode Icons */}
            <div className="flex border-t-2 border-black">
              <button
                onClick={() => handleTravelModeClick('DRIVING')}
                className={`flex-1 p-1 border-r border-black transition-all ${
                  isModeActive('DRIVING')
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
                title="Driving"
              >
                <Car className="w-3 h-3 mx-auto" />
              </button>
              <button
                onClick={() => handleTravelModeClick('WALKING')}
                className={`flex-1 p-1 border-r border-black transition-all ${
                  isModeActive('WALKING')
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
                title="Walking"
              >
                <PersonStanding className="w-3 h-3 mx-auto" />
              </button>
              <button
                onClick={() => handleTravelModeClick('TRANSIT')}
                className={`flex-1 p-1 border-r border-black transition-all ${
                  isModeActive('TRANSIT')
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
                title="Public Transit"
              >
                <Train className="w-3 h-3 mx-auto" />
              </button>
              <button
                onClick={() => handleTravelModeClick('BICYCLING')}
                className={`flex-1 p-1 transition-all ${
                  isModeActive('BICYCLING')
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
                title="Bicycling"
              >
                <Bike className="w-3 h-3 mx-auto" />
              </button>
            </div>
          </div>
        )}
      </div>
    </APIProvider>
  );
}
