'use client';

import { useRef, useEffect, useState } from 'react';
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
  const [isReady, setIsReady] = useState(false);
  const [nickname, setNickname] = useState('');
  const [showNicknamePrompt, setShowNicknamePrompt] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<Location | null>(null);
  const autocompleteInstance = useRef<google.maps.places.Autocomplete | null>(null);

  // Initialize autocomplete with auto-suggest
  useEffect(() => {
    if (!autocompleteRef.current) return;

    let timeoutId: NodeJS.Timeout;
    let isCleanedUp = false;

    // Wait for Google Maps to be fully loaded
    const initAutocomplete = () => {
      if (isCleanedUp) return;

      // Check if Google Maps and Places library are loaded
      if (!window.google?.maps?.places?.Autocomplete) {
        console.log('Waiting for Google Maps Places library to load...');
        // Google Maps not ready yet, try again
        timeoutId = setTimeout(initAutocomplete, 100);
        return;
      }

      console.log('Google Maps Places library loaded, initializing autocomplete...');

      try {
        if (!autocompleteRef.current) return;

        // Create autocomplete instance
        const ac = new google.maps.places.Autocomplete(autocompleteRef.current, {
          fields: ['place_id', 'geometry', 'name', 'formatted_address', 'types'],
          types: ['geocode', 'establishment'], // Allow addresses and places
        });

        autocompleteInstance.current = ac;

        ac.addListener('place_changed', () => {
          const place = ac.getPlace();

          // Check if place has geometry
          if (!place.geometry?.location) {
            console.warn('No geometry found for selected place');
            return;
          }

          const newLocation: Location = {
            id: Date.now().toString(),
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formatted_address || place.name,
          };

          // Store pending location and show nickname prompt
          setPendingLocation(newLocation);
          setShowNicknamePrompt(true);

          // Clear input
          if (autocompleteRef.current) {
            autocompleteRef.current.value = '';
          }
        });

        setIsReady(true);
        console.log('Autocomplete initialized successfully');
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
      }
    };

    // Start initialization
    initAutocomplete();

    // Cleanup
    return () => {
      isCleanedUp = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (autocompleteInstance.current) {
        google.maps.event.clearInstanceListeners(autocompleteInstance.current);
        autocompleteInstance.current = null;
      }
    };
  }, [onAddLocation]);

  const handleConfirmNickname = () => {
    if (!nickname.trim()) {
      alert('Please enter a nickname');
      return;
    }

    if (pendingLocation) {
      onAddLocation({
        ...pendingLocation,
        name: nickname.trim(),
      });
      setShowNicknamePrompt(false);
      setPendingLocation(null);
      setNickname('');
    }
  };

  const handleCancelNickname = () => {
    setShowNicknamePrompt(false);
    setPendingLocation(null);
    setNickname('');
  };

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-gray-900">Add Your Location</h2>

      {/* Nickname Prompt Modal */}
      {showNicknamePrompt && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={handleCancelNickname}>
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Enter Your Nickname</h3>
            <p className="text-sm text-gray-700 mb-4">
              This will be visible to the event organizer and other participants.
            </p>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmNickname()}
              placeholder="e.g., Alice, Bob, John"
              autoFocus
              className="w-full px-4 py-3 text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleConfirmNickname}
                disabled={!nickname.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Confirm
              </button>
              <button
                onClick={handleCancelNickname}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Box with Auto-suggest */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Search for an Address or Place {!isReady && <span className="text-xs text-gray-500">(Loading...)</span>}
        </label>
        <input
          ref={autocompleteRef}
          type="text"
          placeholder={isReady ? "Start typing an address, city, or place name..." : "Loading autocomplete..."}
          disabled={!isReady}
          className={`w-full px-3 py-2 text-sm text-gray-900 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 ${
            !isReady ? 'bg-gray-50 cursor-wait' : 'bg-white'
          }`}
        />
        <p className="mt-2 text-xs text-gray-700">
          {isReady ? (
            <>💡 Type to see suggestions, or click anywhere on the map to add a location</>
          ) : (
            <>⏳ Waiting for Google Maps to load...</>
          )}
        </p>
      </div>

      {/* Locations List */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Added Locations ({locations.length})
        </h3>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {locations.length === 0 ? (
            <p className="text-gray-700 text-sm italic">
              No locations added yet. Start typing in the search box above or click on the map to add your first location.
            </p>
          ) : (
            locations.map((location) => (
              <div
                key={location.id}
                className="flex items-center justify-between p-3 bg-white border-2 border-gray-200 rounded-md hover:border-gray-300 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {location.name || location.address || 'Unnamed Location'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </p>
                </div>
                <button
                  onClick={() => onRemoveLocation(location.id)}
                  className="ml-2 px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
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
