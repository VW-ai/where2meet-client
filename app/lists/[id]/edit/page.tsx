'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api, VenueListDetail, ListItem, VenueListUpdate } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { ArrowLeft, Trash2, GripVertical, Plus } from 'lucide-react';

interface VenueItem {
  place_id: string;
  venue_name: string;
  venue_address?: string;
  venue_lat: number;
  venue_lng: number;
  rating?: number;
  notes?: string;
  tempId: string;
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

export default function EditListPage() {
  const router = useRouter();
  const params = useParams();
  const { user, token } = useAuth();
  const { isLoaded: googleMapsLoaded } = useGoogleMaps();

  const listId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Food & Drink');
  const [venues, setVenues] = useState<VenueItem[]>([]);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
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

  // Initialize Google Places services
  useEffect(() => {
    if (googleMapsLoaded && typeof window !== 'undefined' && window.google?.maps?.places) {
      setAutocompleteService(new google.maps.places.AutocompleteService());
      setPlacesService(new google.maps.places.PlacesService(document.createElement('div')));
    }
  }, [googleMapsLoaded]);

  // Load existing list data
  useEffect(() => {
    if (!listId || !token) return;

    const fetchList = async () => {
      try {
        const data = await api.getListDetail(listId, token);
        setTitle(data.title);
        setDescription(data.description || '');
        setCategory(data.category);

        // Convert ListItem to VenueItem format
        const venueItems: VenueItem[] = data.items.map((item) => ({
          place_id: item.place_id,
          venue_name: item.venue_name,
          venue_address: item.venue_address,
          venue_lat: item.venue_lat,
          venue_lng: item.venue_lng,
          rating: item.rating ? Number(item.rating) : undefined,
          notes: item.notes || '',
          tempId: item.id, // Use existing ID as tempId
        }));

        setVenues(venueItems);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load list:', err);
        setError('Failed to load list. Please try again.');
        setLoading(false);
      }
    };

    fetchList();
  }, [listId, token]);

  if (!user || !token) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Search handler (same as create page)
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (!value.trim() || !autocompleteService) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const timer = setTimeout(() => {
      autocompleteService.getPlacePredictions(
        {
          input: value,
          types: ['establishment'],
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
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
    }, 300);

    setDebounceTimer(timer);
  };

  const handleAddVenue = (place: PlaceSearchResult) => {
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
    setVenues(venues.map((v) => (v.tempId === tempId ? { ...v, notes } : v)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (venues.length === 0) {
      setError('Please add at least one venue');
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      const updateData: VenueListUpdate = {
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
          notes: v.notes,
        })),
      };

      await api.updateList(listId, updateData, token);

      // Redirect back to list detail page
      router.push(`/lists/${listId}`);
    } catch (err) {
      console.error('Failed to update list:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to update list. Please try again.'
      );
      setUpdating(false);
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
            <h1 className="text-2xl font-bold text-black uppercase">Edit List</h1>
            <div className="w-20"></div>
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

          {/* Venue Search & Management */}
          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-bold text-black mb-4 uppercase">
              Manage Venues
            </h2>

            {/* Search Box */}
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
                    setTimeout(() => setShowSearchResults(false), 200);
                  }}
                  placeholder="Search to add venues (e.g., 'Starbucks NYC' or 'Italian restaurants')"
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

            {/* Current Venues List */}
            {venues.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300">
                <p className="font-medium">No venues yet</p>
                <p className="text-sm mt-1">Search and add venues above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {venues.map((venue, index) => (
                  <div
                    key={venue.tempId}
                    className="border-2 border-black p-4 bg-white"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {/* Drag Handle */}
                      <div className="flex-shrink-0 cursor-move pt-1">
                        <GripVertical className="w-5 h-5 text-gray-400" />
                      </div>

                      {/* Venue Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            <p className="font-bold text-black">
                              {index + 1}. {venue.venue_name}
                            </p>
                            <p className="text-sm text-gray-600">{venue.venue_address}</p>
                            {venue.rating && (
                              <p className="text-sm text-gray-700 mb-2">
                                ⭐ {Number(venue.rating).toFixed(1)}
                              </p>
                            )}
                          </div>

                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveVenue(venue.tempId)}
                            className="p-2 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors flex-shrink-0"
                            title="Remove venue"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Notes Input */}
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="border-t-2 border-black pt-6">
            <button
              type="submit"
              disabled={updating}
              className="w-full py-3 bg-black text-white font-bold uppercase hover:bg-gray-900 transition-colors border-2 border-black disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {updating ? 'Updating...' : 'Update List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
