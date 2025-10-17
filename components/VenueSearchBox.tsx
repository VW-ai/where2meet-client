'use client';

import { useEffect, useRef, useState } from 'react';

interface VenueSearchBoxProps {
  apiKey: string;
  onPlaceSelected: (place: {
    place_id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    rating?: number;
  }) => void;
  disabled?: boolean;
}

export default function VenueSearchBox({ apiKey, onPlaceSelected, disabled }: VenueSearchBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  // Wait for Google Maps Places library to load
  useEffect(() => {
    const checkGoogleLoaded = () => {
      if (typeof window !== 'undefined' && window.google?.maps?.places?.Autocomplete) {
        setIsGoogleLoaded(true);
      } else {
        setTimeout(checkGoogleLoaded, 100);
      }
    };
    checkGoogleLoaded();
  }, []);

  useEffect(() => {
    if (!inputRef.current || !isGoogleLoaded || !window.google?.maps?.places?.Autocomplete) return;

    // Initialize Autocomplete
    const autocompleteInstance = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['establishment'], // Focus on places/venues
      fields: ['place_id', 'name', 'formatted_address', 'geometry', 'rating', 'user_ratings_total'],
    });

    // Listen for place selection
    autocompleteInstance.addListener('place_changed', () => {
      const place = autocompleteInstance.getPlace();

      if (!place.geometry || !place.geometry.location) {
        console.error('No geometry found for selected place');
        return;
      }

      setIsLoading(true);

      const placeData = {
        place_id: place.place_id || '',
        name: place.name || '',
        address: place.formatted_address || '',
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        rating: place.rating,
      };

      onPlaceSelected(placeData);

      // Clear input
      if (inputRef.current) {
        inputRef.current.value = '';
      }

      setIsLoading(false);
    });

    setAutocomplete(autocompleteInstance);

    return () => {
      if (autocompleteInstance) {
        google.maps.event.clearInstanceListeners(autocompleteInstance);
      }
    };
  }, [isGoogleLoaded, onPlaceSelected]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder={isGoogleLoaded ? "Search for a specific venue..." : "Loading..."}
        disabled={disabled || isLoading || !isGoogleLoaded}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
