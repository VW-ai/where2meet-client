'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Candidate } from '@/types';

interface VenuesMapViewProps {
  venues: Candidate[];
  selectedVenue: Candidate | null;
  onVenueClick: (venue: Candidate) => void;
  onVote?: (venueId: string, currentlyVoted: boolean) => void;
  allowVote?: boolean;
  participantId?: string;
}

export default function VenuesMapView({
  venues,
  selectedVenue,
  onVenueClick,
  onVote,
  allowVote,
  participantId,
}: VenuesMapViewProps) {
  const [center, setCenter] = useState({ lat: 40.7128, lng: -74.0060 }); // Default: NYC
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  // Calculate center from venues
  useEffect(() => {
    if (venues.length > 0) {
      const avgLat = venues.reduce((sum, v) => sum + v.lat, 0) / venues.length;
      const avgLng = venues.reduce((sum, v) => sum + v.lng, 0) / venues.length;
      setCenter({ lat: avgLat, lng: avgLng });
    }
  }, [venues]);

  // Get user's current location
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setIsLocating(false);
        },
        (error) => {
          console.log('Geolocation error:', error.message);
          setIsLocating(false);
        },
        {
          timeout: 10000,
          maximumAge: 0,
          enableHighAccuracy: true,
        }
      );
    }
  }, []);

  // Fit bounds to show all venues
  useEffect(() => {
    if (!mapRef.current || venues.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    venues.forEach((venue) => {
      bounds.extend({ lat: venue.lat, lng: venue.lng });
    });

    // Add user location to bounds if available
    if (userLocation) {
      bounds.extend(userLocation);
    }

    mapRef.current.fitBounds(bounds, { top: 100, bottom: 100, left: 100, right: 100 });
  }, [venues, userLocation]);

  const centerOnUserLocation = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.setCenter(userLocation);
      mapRef.current.setZoom(14);
    }
  }, [userLocation]);

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  if (!apiKey) {
    return (
      <div className="bg-gray-100 rounded-lg h-[500px] flex items-center justify-center">
        <p className="text-red-600">Google Maps API key not configured</p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey} libraries={['places', 'marker']}>
      <div className="w-full h-[500px] relative rounded-lg overflow-hidden">
        <Map
          defaultCenter={center}
          defaultZoom={12}
          mapId="venues-map"
          gestureHandling="greedy"
          disableDefaultUI={false}
          clickableIcons={false}
          onCameraChanged={(ev) => {
            if (ev.map && !mapRef.current) {
              handleMapReady(ev.map);
            }
          }}
        >
          {/* User location marker (blue triangle) */}
          {userLocation && (
            <AdvancedMarker
              position={userLocation}
              title="Your Location"
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                className="drop-shadow-lg filter drop-shadow-[0_0_4px_rgba(59,130,246,0.6)]"
              >
                <path
                  d="M 16 4 L 28 28 L 4 28 Z"
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="2"
                />
                <circle cx="16" cy="22" r="2" fill="white" />
              </svg>
            </AdvancedMarker>
          )}

          {/* Venue markers */}
          {venues.map((venue) => {
            const isSelected = selectedVenue?.id === venue.id;
            const hasVotes = venue.voteCount && venue.voteCount > 0;

            return (
              <AdvancedMarker
                key={venue.id}
                position={{ lat: venue.lat, lng: venue.lng }}
                title={venue.name}
                onClick={() => onVenueClick(venue)}
              >
                <div className="relative group cursor-pointer">
                  {/* Marker pin */}
                  <div
                    className={`w-10 h-10 rounded-full border-3 border-white shadow-lg flex items-center justify-center transition-all duration-200 ${
                      isSelected
                        ? 'bg-red-600 scale-125 ring-4 ring-red-300'
                        : hasVotes
                        ? 'bg-pink-500 hover:scale-110'
                        : 'bg-orange-500 hover:scale-110'
                    }`}
                  >
                    <span className="text-white text-lg">📍</span>
                  </div>

                  {/* Vote count badge */}
                  {hasVotes && (
                    <div className={`absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white ${
                      isSelected ? 'scale-125' : ''
                    }`}>
                      {venue.voteCount}
                    </div>
                  )}

                  {/* Hover tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <div className="font-semibold">{venue.name}</div>
                    {venue.rating && (
                      <div className="text-yellow-300">⭐ {venue.rating.toFixed(1)}</div>
                    )}
                  </div>
                </div>
              </AdvancedMarker>
            );
          })}
        </Map>

        {/* Locate Me Button */}
        {userLocation && (
          <button
            onClick={centerOnUserLocation}
            disabled={isLocating}
            className="absolute bottom-4 right-4 bg-white hover:bg-gray-50 text-gray-700 font-medium p-3 rounded-lg shadow-lg border-2 border-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10"
            title="Center map on my location"
          >
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}

        {/* Legend */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 text-xs text-black z-10">
          <div className="font-semibold mb-2">Legend</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded-full border-2 border-white"></div>
              <span className="text-black">Venue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-pink-500 rounded-full border-2 border-white"></div>
              <span className="text-black">Voted venue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-600 rounded-full border-2 border-white"></div>
              <span className="text-black">Selected</span>
            </div>
            {userLocation && (
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 32 32">
                  <path d="M 16 4 L 28 28 L 4 28 Z" fill="#3b82f6" stroke="white" strokeWidth="2" />
                </svg>
                <span className="text-black">Your location</span>
              </div>
            )}
          </div>
        </div>

        {/* Selected Venue Info Panel */}
        {selectedVenue && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 z-10 min-w-[320px] max-w-[400px]">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-black mb-1">{selectedVenue.name}</h3>
                {selectedVenue.vicinity && (
                  <p className="text-sm text-gray-600 mb-2">{selectedVenue.vicinity}</p>
                )}
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  {selectedVenue.rating && (
                    <span className="flex items-center gap-1">
                      ⭐ {selectedVenue.rating.toFixed(1)}
                      {selectedVenue.userRatingsTotal && (
                        <span className="text-gray-400">({selectedVenue.userRatingsTotal})</span>
                      )}
                    </span>
                  )}
                  {selectedVenue.distanceFromCenter && (
                    <span>📍 {selectedVenue.distanceFromCenter.toFixed(1)} km</span>
                  )}
                </div>
              </div>
              {/* Vote count badge */}
              {selectedVenue.voteCount !== undefined && selectedVenue.voteCount > 0 && (
                <div className="ml-4 flex flex-col items-center">
                  <div className="text-2xl">❤️</div>
                  <div className="text-lg font-bold text-black">{selectedVenue.voteCount}</div>
                  <div className="text-xs text-gray-500">votes</div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {allowVote && onVote ? (
                participantId ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onVote(selectedVenue.id, selectedVenue.userVoted || false);
                    }}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded transition-colors ${
                      selectedVenue.userVoted
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                  >
                    {selectedVenue.userVoted ? '💔 Unvote' : '🤍 Vote'}
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-500 text-sm font-medium rounded cursor-not-allowed"
                    title="Join the event to vote"
                  >
                    🤍 Vote (Join to vote)
                  </button>
                )
              ) : null}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onVenueClick(selectedVenue);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-black text-sm font-medium rounded hover:border-black transition-colors"
              >
                View Details
              </button>
            </div>
          </div>
        )}
      </div>
    </APIProvider>
  );
}
