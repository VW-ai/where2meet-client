'use client';

import { useRef, useEffect } from 'react';
import { Location } from '@/types';

interface InputPanelProps {
  locations: Location[];
  onAddLocation: (location: Location) => void;
  onRemoveLocation: (id: string) => void;
  onUpdateLocation: (id: string, location: Partial<Location>) => void;
}

export default function InputPanel({
  locations,
  onAddLocation,
  onRemoveLocation,
  onUpdateLocation,
}: InputPanelProps) {
  const autocompleteRef = useRef<HTMLInputElement>(null);

  // Initialize autocomplete with auto-suggest
  useEffect(() => {
    if (!autocompleteRef.current) return;

    // Wait for Google Maps to be fully loaded
    const initAutocomplete = () => {
      if (!window.google?.maps?.places?.Autocomplete) {
        // Google Maps not ready yet, try again
        setTimeout(initAutocomplete, 100);
        return;
      }

      try {
        const ac = new google.maps.places.Autocomplete(autocompleteRef.current!, {
          fields: ['place_id', 'geometry', 'name', 'formatted_address', 'types'],
          types: ['geocode', 'establishment'], // Allow addresses and places
        });

        ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          if (place.geometry?.location) {
            const newLocation: Location = {
              id: Date.now().toString(),
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              address: place.formatted_address,
              name: place.name,
            };
            onAddLocation(newLocation);
            if (autocompleteRef.current) {
              autocompleteRef.current.value = '';
            }
          }
        });

        // Cleanup function
        return () => {
          google.maps.event.clearInstanceListeners(ac);
        };
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
      }
    };

    const cleanup = initAutocomplete();
    return () => {
      if (cleanup) cleanup();
    };
  }, [onAddLocation]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Add Locations</h2>

      {/* Search Box with Auto-suggest */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search for an Address or Place
        </label>
        <input
          ref={autocompleteRef}
          type="text"
          placeholder="Start typing an address, city, or place name..."
          className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
        />
        <p className="mt-2 text-xs text-gray-500">
          💡 Type to see suggestions, or click anywhere on the map to add a location
        </p>
      </div>

      {/* Locations List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Added Locations ({locations.length})
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {locations.length === 0 ? (
            <p className="text-gray-500 text-sm italic">
              No locations added yet. Start typing in the search box above or click on the map to add your first location.
            </p>
          ) : (
            locations.map((location) => (
              <div
                key={location.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-800">
                    {location.name || location.address || 'Unnamed Location'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </p>
                </div>
                <button
                  onClick={() => onRemoveLocation(location.id)}
                  className="ml-2 px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
