import { useEffect, useRef, useState } from 'react';

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry?: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
}

interface UseGooglePlacesAutocompleteProps {
  onPlaceSelect?: (place: PlaceResult) => void;
  types?: string[];
  componentRestrictions?: { country: string | string[] };
}

export const useGooglePlacesAutocomplete = ({
  onPlaceSelect,
  types = ['establishment'],
  componentRestrictions,
}: UseGooglePlacesAutocompleteProps = {}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Google Maps script
  useEffect(() => {
    // Check if already loaded
    if (typeof window !== 'undefined' && window.google?.maps?.places) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Wait for it to load
      const checkLoaded = setInterval(() => {
        if (window.google?.maps?.places) {
          setIsLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    // Load the script
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError('Google Maps API key not found');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      setError('Failed to load Google Maps');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Initialize autocomplete
  useEffect(() => {
    if (!isLoaded || !inputRef.current) {
      return;
    }

    try {
      // Create autocomplete instance
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        types,
        componentRestrictions,
        fields: ['place_id', 'name', 'formatted_address', 'geometry'],
      });

      // Handle place selection
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();

        if (!place.geometry || !place.geometry.location) {
          console.warn('No details available for input:', place.name);
          return;
        }

        const placeResult: PlaceResult = {
          place_id: place.place_id || '',
          name: place.name || '',
          formatted_address: place.formatted_address || '',
          geometry: place.geometry,
        };

        onPlaceSelect?.(placeResult);
      });

      autocompleteRef.current = autocomplete;
    } catch (err) {
      console.error('Error initializing autocomplete:', err);
      setError('Failed to initialize autocomplete');
    }

    return () => {
      // Cleanup autocomplete listeners
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onPlaceSelect, types, componentRestrictions]);

  return {
    inputRef,
    isLoaded,
    error,
    autocomplete: autocompleteRef.current,
  };
};
