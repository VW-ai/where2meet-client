'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import InputPanel from '@/components/InputPanel';
import CandidatesPanel from '@/components/CandidatesPanel';
import { Location, Candidate, Circle, SortMode } from '@/types';
import { computeCentroid, computeMinimumEnclosingCircle, expandCircle, haversineDistance } from '@/lib/algorithms';

// Dynamically import MapView to avoid SSR issues with Google Maps
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-200 flex items-center justify-center">Loading map...</div>,
});

export default function Home() {
  const [apiKey, setApiKey] = useState<string>('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [centroid, setCentroid] = useState<{ lat: number; lng: number } | null>(null);
  const [circle, setCircle] = useState<Circle | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('rating');
  const [keyword, setKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Load API key and locations from environment/storage
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    setApiKey(key);

    // Load from localStorage
    const saved = localStorage.getItem('where2meet-locations');
    if (saved) {
      try {
        setLocations(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved locations', e);
      }
    }
  }, []);

  // Save locations to localStorage
  useEffect(() => {
    localStorage.setItem('where2meet-locations', JSON.stringify(locations));
  }, [locations]);

  // Recompute centroid and circle whenever locations change
  useEffect(() => {
    if (locations.length === 0) {
      setCentroid(null);
      setCircle(null);
      return;
    }

    const newCentroid = computeCentroid(locations);
    setCentroid(newCentroid);

    if (locations.length >= 1) {
      const mec = computeMinimumEnclosingCircle(locations);
      if (mec) {
        // Expand by 10% for search radius
        const expanded = expandCircle(mec, 0.1);
        setCircle(expanded);
      }
    }
  }, [locations]);

  const handleAddLocation = useCallback((location: Location) => {
    setLocations((prev) => [...prev, location]);
  }, []);

  const handleRemoveLocation = useCallback((id: string) => {
    setLocations((prev) => prev.filter((loc) => loc.id !== id));
  }, []);

  const handleUpdateLocation = useCallback((id: string, updates: Partial<Location>) => {
    setLocations((prev) =>
      prev.map((loc) => (loc.id === id ? { ...loc, ...updates } : loc))
    );
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    const newLocation: Location = {
      id: Date.now().toString(),
      lat,
      lng,
      address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    };
    handleAddLocation(newLocation);
  }, [handleAddLocation]);

  const searchPlaces = useCallback(async () => {
    if (!circle || !centroid || !keyword.trim()) {
      alert('Please add at least 2 locations and enter a search keyword');
      return;
    }

    // Check if Google Maps is loaded
    if (!window.google?.maps?.places?.PlacesService) {
      alert('Google Maps is still loading. Please wait a moment and try again.');
      return;
    }

    setIsSearching(true);
    setCandidates([]);
    setSelectedCandidate(null);

    try {
      // Use Places Library (nearbySearch)
      const service = new google.maps.places.PlacesService(
        document.createElement('div')
      );

      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(circle.center.lat, circle.center.lng),
        radius: circle.radius,
        keyword: keyword,
        // You can also use 'type' for specific categories
      };

      service.nearbySearch(request, (results, status) => {
        try {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            // De-duplicate by place_id
            const uniqueResults = new Map<string, google.maps.places.PlaceResult>();
            results.forEach((place) => {
              if (place.place_id) {
                uniqueResults.set(place.place_id, place);
              }
            });

            // Convert to our Candidate type
            const newCandidates: Candidate[] = Array.from(uniqueResults.values())
              .filter((place) => place.geometry?.location && place.place_id)
              .map((place, index) => {
                const lat = place.geometry!.location!.lat();
                const lng = place.geometry!.location!.lng();
                const distanceFromCenter = haversineDistance(
                  circle.center.lat,
                  circle.center.lng,
                  lat,
                  lng
                );
                const inCircle = distanceFromCenter <= circle.radius;

                return {
                  id: `${place.place_id}-${index}`,
                  placeId: place.place_id!,
                  name: place.name || 'Unnamed Place',
                  lat,
                  lng,
                  rating: place.rating,
                  userRatingsTotal: place.user_ratings_total,
                  distanceFromCenter,
                  inCircle,
                  openNow: place.opening_hours?.open_now,
                  vicinity: place.vicinity,
                  types: place.types,
                };
              });

            // Basic filtering: prefer open places, minimum rating
            const filtered = newCandidates.filter((c) => {
              // Optional: filter by rating threshold
              if (c.rating && c.rating < 3.0) return false;
              return true;
            });

            setCandidates(filtered);

            if (filtered.length === 0) {
              alert(`No results found for "${keyword}". Try a different search term or add more locations.`);
            }
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            setCandidates([]);
            alert(`No results found for "${keyword}". Try a different search term or expand your search area.`);
          } else {
            console.error('Places search failed:', status);
            let errorMessage = 'Search failed. ';
            switch (status) {
              case google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT:
                errorMessage += 'Query limit reached. Please try again later.';
                break;
              case google.maps.places.PlacesServiceStatus.REQUEST_DENIED:
                errorMessage += 'Request denied. Check your API key permissions.';
                break;
              case google.maps.places.PlacesServiceStatus.INVALID_REQUEST:
                errorMessage += 'Invalid request. Please check your input.';
                break;
              default:
                errorMessage += 'Please try again.';
            }
            alert(errorMessage);
          }
        } catch (callbackError) {
          console.error('Error processing search results:', callbackError);
          alert('An error occurred while processing results. Please try again.');
        } finally {
          setIsSearching(false);
        }
      });
    } catch (error) {
      console.error('Search error:', error);
      alert('An error occurred during search. Please try again.');
      setIsSearching(false);
    }
  }, [circle, centroid, keyword]);

  // Sort candidates
  const sortedCandidates = useCallback(() => {
    const sorted = [...candidates];
    if (sortMode === 'rating') {
      sorted.sort((a, b) => {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return ratingB - ratingA; // Higher rating first
      });
    } else {
      sorted.sort((a, b) => {
        const distA = a.distanceFromCenter || Infinity;
        const distB = b.distanceFromCenter || Infinity;
        return distA - distB; // Closer first
      });
    }
    return sorted;
  }, [candidates, sortMode]);

  if (!apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">API Key Missing</h1>
          <p className="text-gray-700 mb-4">
            Please set your Google Maps API key in the <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> file:
          </p>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
          </pre>
          <p className="text-gray-600 text-sm mt-4">
            See <code className="bg-gray-100 px-2 py-1 rounded">.env.local.example</code> for reference.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800">Where2Meet</h1>
          <p className="text-gray-600 mt-1">
            Find the perfect meeting place for your group
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Inputs */}
          <div className="lg:col-span-1 space-y-6">
            <InputPanel
              locations={locations}
              onAddLocation={handleAddLocation}
              onRemoveLocation={handleRemoveLocation}
              onUpdateLocation={handleUpdateLocation}
            />

            <CandidatesPanel
              candidates={sortedCandidates()}
              selectedCandidate={selectedCandidate}
              sortMode={sortMode}
              onSortChange={setSortMode}
              onCandidateClick={setSelectedCandidate}
              keyword={keyword}
              onKeywordChange={setKeyword}
              onSearch={searchPlaces}
              isSearching={isSearching}
            />
          </div>

          {/* Right Panel - Map */}
          <div className="lg:col-span-2 h-[600px] lg:h-[calc(100vh-200px)] bg-white rounded-lg shadow-lg overflow-hidden">
            <MapView
              apiKey={apiKey}
              locations={locations}
              centroid={centroid}
              circle={circle}
              candidates={sortedCandidates()}
              selectedCandidate={selectedCandidate}
              onMapClick={handleMapClick}
              onCandidateClick={setSelectedCandidate}
            />
          </div>
        </div>

        {/* Info Section */}
        {circle && (
          <div className="mt-6 bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Analysis Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Center Point (Centroid)</p>
                <p className="font-mono text-gray-800">
                  {centroid?.lat.toFixed(6)}, {centroid?.lng.toFixed(6)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Search Radius</p>
                <p className="font-mono text-gray-800">
                  {(circle.radius / 1000).toFixed(2)} km
                </p>
              </div>
              <div>
                <p className="text-gray-600">Total Locations</p>
                <p className="font-mono text-gray-800">{locations.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
