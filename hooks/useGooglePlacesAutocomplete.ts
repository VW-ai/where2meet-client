import { useEffect, useRef, useState, useCallback } from 'react';

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
  address_components?: google.maps.GeocoderAddressComponent[];
}

interface UseGooglePlacesAutocompleteProps {
  onPlaceSelect?: (place: PlaceResult) => void;
  types?: string[];
  componentRestrictions?: { country: string | string[] };
}

export const useGooglePlacesAutocomplete = ({
  onPlaceSelect,
  types,
  componentRestrictions,
}: UseGooglePlacesAutocompleteProps = {}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<any>(null);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [containerAttached, setContainerAttached] = useState(false);

  // Keep the ref updated with the latest callback
  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect;
  }, [onPlaceSelect]);

  // Load Google Maps script with Places library (Extended Component Library for web components)
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

    // Load the script with Places library
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key not found');
      setError('Google Maps API key not found');
      return;
    }

    const script = document.createElement('script');
    // Use the Extended Component Library for web components support
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('Google Maps API loaded successfully');
      setIsLoaded(true);
    };

    script.onerror = () => {
      console.error('Failed to load Google Maps script');
      setError('Failed to load Google Maps');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Callback ref - called when element is attached/detached from DOM
  const callbackRef = useCallback((node: HTMLDivElement | null) => {
    console.log('Callback ref called with node:', !!node);
    containerRef.current = node;

    if (node) {
      console.log('✅ Container element attached to DOM');
      setContainerAttached(true);
    } else {
      console.log('❌ Container element detached from DOM');
      setContainerAttached(false);
    }
  }, []);

  // Initialize PlaceAutocompleteElement (new API)
  useEffect(() => {
    console.log('Autocomplete initialization - isLoaded:', isLoaded, 'containerAttached:', containerAttached, 'already initialized:', !!autocompleteRef.current);

    if (!isLoaded) {
      console.log('Google Maps not loaded yet');
      return;
    }

    if (!containerAttached || !containerRef.current) {
      console.log('Container not attached yet');
      return;
    }

    // Don't re-initialize if already initialized
    if (autocompleteRef.current) {
      console.log('Already initialized, skipping');
      return;
    }

    try {
      console.log('Creating input element and Autocomplete (legacy API)');

      // Create a regular input element that we can fully control
      const input = document.createElement('input') as HTMLInputElement;
      input.type = 'text';
      input.placeholder = 'Search for a place';
      input.className = 'w-full px-4 py-3 text-black border border-gray-300 focus:border-black focus:outline-none bg-white';
      input.style.color = '#000000';
      input.style.backgroundColor = '#ffffff';
      input.style.fontSize = '14px';

      // Clear container and append input
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(input);
      console.log('Input element created and appended');

      // Create Autocomplete using legacy API
      const autocompleteOptions: google.maps.places.AutocompleteOptions = {
        fields: ['place_id', 'name', 'formatted_address', 'geometry', 'address_components'],
      };

      // Set types if provided
      if (types && types.length > 0) {
        autocompleteOptions.types = types;
        console.log('Setting autocomplete types:', types);
      } else {
        console.log('No types restriction - all places allowed');
      }

      // Set component restrictions if provided
      if (componentRestrictions) {
        autocompleteOptions.componentRestrictions = componentRestrictions;
        console.log('Setting component restrictions:', componentRestrictions);
      }

      console.log('Creating Autocomplete with options:', autocompleteOptions);
      const autocomplete = new google.maps.places.Autocomplete(input, autocompleteOptions);
      console.log('Autocomplete created:', autocomplete);

      // Handle place selection
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();

        if (!place || !place.place_id) {
          console.warn('No place selected');
          return;
        }

        console.log('Place selected:', place);

        const placeResult: PlaceResult = {
          place_id: place.place_id,
          name: place.name || '',
          formatted_address: place.formatted_address || '',
          geometry: place.geometry ? {
            location: {
              lat: () => place.geometry!.location!.lat(),
              lng: () => place.geometry!.location!.lng(),
            },
          } : undefined,
          address_components: place.address_components || [],
        };

        // Use the ref to call the callback
        console.log('Calling onPlaceSelect with:', placeResult);
        onPlaceSelectRef.current?.(placeResult);
      });

      autocompleteRef.current = autocomplete;
      console.log('Legacy Autocomplete initialized successfully');

      // Handle scroll repositioning - find the scrollable parent (modal content)
      const scrollableParent = input.closest('.overflow-y-auto');
      if (scrollableParent) {
        const repositionDropdown = () => {
          const pacContainer = document.querySelector('.pac-container') as HTMLElement;
          if (pacContainer && pacContainer.style.display !== 'none') {
            // Get input position relative to viewport
            const rect = input.getBoundingClientRect();

            // Position dropdown below input
            pacContainer.style.position = 'fixed';
            pacContainer.style.left = `${rect.left}px`;
            pacContainer.style.top = `${rect.bottom + 2}px`; // 2px gap
            pacContainer.style.width = `${rect.width}px`;
          }
        };

        const inputHandler = () => {
          setTimeout(repositionDropdown, 10);
        };

        // Reposition on scroll
        scrollableParent.addEventListener('scroll', repositionDropdown);

        // Also reposition on input focus and when typing
        input.addEventListener('focus', repositionDropdown);
        input.addEventListener('input', inputHandler);

        // Store the listeners for cleanup
        (input as any)._scrollHandler = repositionDropdown;
        (input as any)._inputHandler = inputHandler;
        (input as any)._scrollParent = scrollableParent;
      }
    } catch (err) {
      console.error('Error initializing autocomplete:', err);
      setError('Failed to initialize autocomplete');
    }

    return () => {
      // Cleanup
      if (autocompleteRef.current) {
        // Remove listeners from Autocomplete
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      if (containerRef.current) {
        const input = containerRef.current.querySelector('input');
        if (input) {
          // Remove all event listeners
          const scrollHandler = (input as any)._scrollHandler;
          const inputHandler = (input as any)._inputHandler;
          const scrollParent = (input as any)._scrollParent;
          if (scrollHandler && scrollParent) {
            scrollParent.removeEventListener('scroll', scrollHandler);
            input.removeEventListener('focus', scrollHandler);
          }
          if (inputHandler) {
            input.removeEventListener('input', inputHandler);
          }
        }
        containerRef.current.innerHTML = '';
      }
      autocompleteRef.current = null;
    };
  }, [isLoaded, types, componentRestrictions, containerAttached]);

  return {
    containerRef: callbackRef, // Use callback ref instead
    isLoaded,
    error,
    autocomplete: autocompleteRef.current,
  };
};
