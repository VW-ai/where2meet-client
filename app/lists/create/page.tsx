'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, CreateListRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { ArrowLeft, Plus, Trash2, GripVertical, Search } from 'lucide-react';

interface VenueItem {
  place_id: string;
  venue_name: string;
  venue_address?: string;
  venue_lat: number;
  venue_lng: number;
  rating?: number;
  notes?: string;
  tempId: string; // For local tracking before submission
}

interface PlaceSearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
}

export default function CreateListPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { isLoaded: googleMapsLoaded } = useGoogleMaps();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Food & Drink');
  const [venues, setVenues] = useState<VenueItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Venue search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const categories = ['Food & Drink', 'Sports', 'Entertainment', 'Shopping', 'Outdoors', 'Other'];

  // Redirect if not logged in
  useEffect(() => {
    if (!user || !token) {
      router.push('/login');
    }
  }, [user, token, router]);

  // Initialize Google Places services when loaded
  useEffect(() => {
    if (googleMapsLoaded && typeof window !== 'undefined' && window.google?.maps?.places) {
      setAutocompleteService(new google.maps.places.AutocompleteService());
      setPlacesService(new google.maps.places.PlacesService(document.createElement('div')));
    }
  }, [googleMapsLoaded]);

  if (!user || !token) {
    return null;
  }

  // Handle autocomplete search as user types (with debouncing)
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (!value.trim() || !autocompleteService) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    // Debounce the search
    const timer = setTimeout(() => {
      // Get autocomplete predictions
      autocompleteService.getPlacePredictions(
      {
        input: value,
        types: ['establishment'], // Only show businesses/places
      },
      (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          // Fetch details for each prediction
          const predictionPromises = predictions.slice(0, 5).map((prediction) => {
            return new Promise<PlaceSearchResult | null>((resolve) => {
              if (!placesService) {
                resolve(null);
                return;
              }

              placesService.getDetails(
                {
                  placeId: prediction.place_id,
                  fields: ['place_id', 'name', 'formatted_address', 'geometry', 'rating'],
                },
                (place, detailStatus) => {
                  if (detailStatus === google.maps.places.PlacesServiceStatus.OK && place) {
                    resolve({
                      place_id: place.place_id!,
                      name: place.name!,
                      formatted_address: place.formatted_address!,
                      geometry: {
                        location: {
                          lat: place.geometry!.location!.lat(),
                          lng: place.geometry!.location!.lng(),
                        },
                      },
                      rating: place.rating,
                    });
                  } else {
                    resolve(null);
                  }
                }
              );
            });
          });

          Promise.all(predictionPromises).then((results) => {
            const validResults = results.filter((r) => r !== null) as PlaceSearchResult[];
            setSearchResults(validResults);
            setShowSearchResults(validResults.length > 0);
          });
        } else {
          setSearchResults([]);
          setShowSearchResults(false);
        }
      }
    );
    }, 300); // Wait 300ms after user stops typing

    setDebounceTimer(timer);
  };

  const handleAddVenue = (place: PlaceSearchResult) => {
    // Check if venue already added
    if (venues.some((v) => v.place_id === place.place_id)) {
      setError('This venue is already in your list!');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const newVenue: VenueItem = {
      place_id: place.place_id,
      venue_name: place.name,
      venue_address: place.formatted_address,
      venue_lat: place.geometry.location.lat,
      venue_lng: place.geometry.location.lng,
      rating: place.rating,
      notes: '',
      tempId: Date.now().toString() + Math.random(),
    };

    setVenues([...venues, newVenue]);
    setSearchQuery('');
    setShowSearchResults(false);
    setSearchResults([]);
  };

  const handleRemoveVenue = (tempId: string) => {
    setVenues(venues.filter((v) => v.tempId !== tempId));
  };

  const handleUpdateNotes = (tempId: string, notes: string) => {
    setVenues(
      venues.map((v) => (v.tempId === tempId ? { ...v, notes } : v))
    );
  };

  const handleMoveVenue = (index: number, direction: 'up' | 'down') => {
    const newVenues = [...venues];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= venues.length) return;

    [newVenues[index], newVenues[targetIndex]] = [
      newVenues[targetIndex],
      newVenues[index],
    ];

    setVenues(newVenues);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please enter a title for your list');
      return;
    }

    if (venues.length === 0) {
      setError('Please add at least one venue to your list');
      return;
    }

    setCreating(true);

    try {
      const data: CreateListRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        items: venues.map((v) => ({
          place_id: v.place_id,
          venue_name: v.venue_name,
          venue_address: v.venue_address,
          venue_lat: v.venue_lat,
          venue_lng: v.venue_lng,
          rating: v.rating,
          notes: v.notes?.trim() || undefined,
        })),
      };

      const createdList = await api.createList(data, token);
      router.push(`/lists/${createdList.id}`);
    } catch (err) {
      console.error('Failed to create list:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to create list. Please try again.'
      );
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="border-b-2 border-black sticky top-0 bg-white z-10">
          <div className="max-w-4xl mx-auto px-4 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-black hover:text-gray-700 font-bold uppercase text-sm"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <h1 className="text-2xl font-bold text-black uppercase">Create List</h1>
              <div className="w-20"></div> {/* Spacer for centering */}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-600 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-black mb-2 uppercase">
                  List Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Best Ramen in Tokyo"
                  className="w-full px-4 py-3 border-2 border-black text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2 uppercase">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell others what this list is about..."
                  className="w-full px-4 py-3 border-2 border-black text-black focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2 uppercase">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-black text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Venue Search */}
            <div className="border-t-2 border-black pt-6">
              <h2 className="text-xl font-bold text-black mb-4 uppercase">
                Add Venues
              </h2>

              <div className="relative mb-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onFocus={() => {
                      if (searchResults.length > 0) {
                        setShowSearchResults(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay to allow click on dropdown items
                      setTimeout(() => setShowSearchResults(false), 200);
                    }}
                    placeholder="Search for venues (e.g., 'Starbucks NYC' or 'Italian restaurants')"
                    className="w-full px-4 py-3 border-2 border-black text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoComplete="off"
                  />
                  {searchQuery && !showSearchResults && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 border-2 border-black bg-white max-h-96 overflow-y-auto z-20">
                    {searchResults.map((place) => (
                      <button
                        key={place.place_id}
                        type="button"
                        onClick={() => handleAddVenue(place)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-b border-gray-200 last:border-b-0"
                      >
                        <p className="font-bold text-black">{place.name}</p>
                        <p className="text-sm text-gray-600">
                          {place.formatted_address}
                        </p>
                        {place.rating && (
                          <p className="text-sm text-gray-700 mt-1">
                            ⭐ {Number(place.rating).toFixed(1)}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Venues List */}
            {venues.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-black uppercase">
                  Your Venues ({venues.length})
                </h3>
                {venues.map((venue, index) => (
                  <div
                    key={venue.tempId}
                    className="border-2 border-black p-4 bg-white"
                  >
                    <div className="flex items-start gap-3">
                      {/* Reorder buttons */}
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveVenue(index, 'up')}
                          disabled={index === 0}
                          className="text-gray-600 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ▲
                        </button>
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <button
                          type="button"
                          onClick={() => handleMoveVenue(index, 'down')}
                          disabled={index === venues.length - 1}
                          className="text-gray-600 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ▼
                        </button>
                      </div>

                      {/* Venue info */}
                      <div className="flex-1">
                        <p className="font-bold text-black mb-1">
                          {index + 1}. {venue.venue_name}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          {venue.venue_address}
                        </p>
                        {venue.rating && (
                          <p className="text-sm text-gray-700 mb-2">
                            ⭐ {Number(venue.rating).toFixed(1)}
                          </p>
                        )}
                        <input
                          type="text"
                          value={venue.notes || ''}
                          onChange={(e) =>
                            handleUpdateNotes(venue.tempId, e.target.value)
                          }
                          placeholder="Add a note (optional)"
                          className="w-full px-3 py-2 border border-gray-300 text-black text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          maxLength={200}
                        />
                      </div>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveVenue(venue.tempId)}
                        className="p-2 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Submit Button */}
            <div className="border-t-2 border-black pt-6 flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 py-3 border-2 border-black text-black font-bold uppercase hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="flex-1 py-3 bg-black text-white font-bold uppercase hover:bg-gray-900 transition-colors border-2 border-black disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create List'}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}
