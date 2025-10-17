'use client';

import { useRef, useEffect, useState } from 'react';
import { Location } from '@/types';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

interface InputPanelProps {
  locations: Location[];
  onAddLocation: (location: Location) => void;
  onRemoveLocation: (id: string) => void;
  onUpdateLocation: (id: string, location: Partial<Location>) => void;
  myParticipantId?: string;
  isHost?: boolean;
}

export default function InputPanel({
  locations,
  onAddLocation,
  onRemoveLocation,
  onUpdateLocation,
  myParticipantId,
  isHost,
}: InputPanelProps) {
  const { t } = useTranslation();
  const autocompleteRef = useRef<HTMLInputElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [nickname, setNickname] = useState('');
  const [showNicknamePrompt, setShowNicknamePrompt] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<Location | null>(null);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [isMyOwnLocation, setIsMyOwnLocation] = useState(false);
  const autocompleteInstance = useRef<google.maps.places.Autocomplete | null>(null);

  // Check if organizer already has their own location
  const organizerHasOwnLocation = isHost && locations.some(loc => loc.name === 'You');

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

          // If not editing, clear nickname and reset isMyOwnLocation. If editing, keep current nickname
          if (!editingLocationId) {
            setNickname('');
            setIsMyOwnLocation(false);
          }

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
    // For organizer's own location, nickname is optional (will be "You")
    if (!isMyOwnLocation && !nickname.trim()) {
      alert(t.pleaseEnterNickname);
      return;
    }

    if (editingLocationId) {
      // Editing existing location
      handleConfirmEdit();
    } else if (pendingLocation) {
      // Adding new location
      const locationName = isMyOwnLocation ? 'You' : nickname.trim();
      onAddLocation({
        ...pendingLocation,
        name: locationName,
      });
      setShowNicknamePrompt(false);
      setPendingLocation(null);
      setNickname('');
      setIsMyOwnLocation(false);
    }
  };

  const handleCancelNickname = () => {
    setShowNicknamePrompt(false);
    setPendingLocation(null);
    setNickname('');
    setEditingLocationId(null);
    setIsMyOwnLocation(false);
  };

  const handleEditLocation = (locationId: string) => {
    const location = locations.find(l => l.id === locationId);
    if (location) {
      setEditingLocationId(locationId);
      setNickname(location.name || '');
      // Pre-populate with current location so user can update just the name
      setPendingLocation({
        id: location.id,
        lat: location.lat,
        lng: location.lng,
        address: location.address,
        name: location.name,
      });
      setShowNicknamePrompt(true);
    }
  };

  const handleConfirmEdit = () => {
    if (!nickname.trim()) {
      alert(t.pleaseEnterNickname);
      return;
    }

    if (editingLocationId && pendingLocation) {
      // Update location with new coordinates and name
      onUpdateLocation(editingLocationId, {
        lat: pendingLocation.lat,
        lng: pendingLocation.lng,
        address: pendingLocation.address,
        name: nickname.trim(),
      });
      setShowNicknamePrompt(false);
      setPendingLocation(null);
      setNickname('');
      setEditingLocationId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-bold text-gray-900">
          {isHost ? '👑 Add Participant Locations' : t.addYourStartingLocation}
        </h2>
        <p className="text-sm text-blue-600 font-medium mt-1">
          {isHost
            ? '💡 As organizer, you can add multiple locations for different participants'
            : t.startingLocationEmphasis}
        </p>
      </div>

      {/* Nickname Prompt Modal */}
      {showNicknamePrompt && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={handleCancelNickname}>
          <div className={`bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border-4 ${
            editingLocationId
              ? 'border-amber-400'
              : 'border-blue-400'
          }`} onClick={(e) => e.stopPropagation()}>
            {/* Header with badge */}
            <div className="flex items-center gap-3 mb-3">
              {editingLocationId ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 border-2 border-amber-400 rounded-full">
                  <span className="text-lg">✏️</span>
                  <span className="text-sm font-bold text-amber-900">EDIT MODE</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 border-2 border-blue-400 rounded-full">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-bold text-blue-900">ADD NEW</span>
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {editingLocationId ? t.editLocation : t.enterNickname}
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              {editingLocationId ? t.editLocationDescription : t.nicknameVisible}
            </p>

            {/* "This is my location" checkbox for organizer */}
            {isHost && !editingLocationId && !organizerHasOwnLocation && (
              <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMyOwnLocation}
                    onChange={(e) => {
                      setIsMyOwnLocation(e.target.checked);
                      if (e.target.checked) {
                        setNickname(''); // Clear nickname when selecting "my location"
                      }
                    }}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-bold text-blue-900">
                      📍 This is my own location
                    </span>
                    <p className="text-xs text-blue-700 mt-1">
                      Your location will be marked as "You" on the map
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Name Input */}
            {!isMyOwnLocation && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {isHost ? 'Participant Name' : 'Your Nickname'}
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmNickname()}
                  placeholder={isHost ? 'e.g., Alice, Bob, Team Member' : t.nicknamePlaceholder}
                  autoFocus={!isMyOwnLocation}
                  className="w-full px-4 py-3 text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
                {isHost && (
                  <p className="text-xs text-gray-600 mt-2">
                    💡 Enter the name of the participant whose location you're adding
                  </p>
                )}
              </div>
            )}

            {/* Current/Selected Location Display */}
            {pendingLocation && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-base">📍</span>
                  {editingLocationId ? 'Current Location' : 'Selected Location'}
                </label>
                <div className={`p-3 border-2 rounded-lg ${
                  editingLocationId
                    ? 'bg-amber-50 border-amber-300'
                    : 'bg-blue-50 border-blue-300'
                }`}>
                  <p className="text-sm text-gray-900 font-medium">
                    {pendingLocation.address || 'Unnamed Location'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {pendingLocation.lat.toFixed(6)}, {pendingLocation.lng.toFixed(6)}
                  </p>
                </div>

                {/* Change Location button when editing - inline with location display */}
                {editingLocationId && (
                  <button
                    onClick={() => {
                      // Close modal and focus search box to select new location
                      setShowNicknamePrompt(false);
                      setTimeout(() => {
                        if (autocompleteRef.current) {
                          autocompleteRef.current.focus();
                        }
                      }, 100);
                    }}
                    className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <span className="text-lg">🔄</span>
                    <span>Change to Different Location</span>
                  </button>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleConfirmNickname}
                disabled={!isMyOwnLocation && !nickname.trim()}
                className={`flex-1 px-5 py-3 text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none ${
                  editingLocationId
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                    : 'bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600'
                }`}
              >
                {editingLocationId ? '💾 Save Changes' : `✨ ${t.confirm}`}
              </button>
              <button
                onClick={handleCancelNickname}
                className="px-5 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors border-2 border-gray-300"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Box with Auto-suggest */}
      <div className="bg-gradient-to-br from-blue-50 to-green-50 p-4 rounded-lg border-2 border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">📍</span>
          <label className="block text-sm font-bold text-gray-900">
            {isHost ? 'Search for Participant Location' : t.searchForAddress}
            {!isReady && <span className="text-xs text-gray-500 ml-2">(Loading...)</span>}
          </label>
        </div>
        <input
          ref={autocompleteRef}
          type="text"
          placeholder={isReady ? (isHost ? "Type address, city, or place name..." : t.startTypingAddress) : "Loading autocomplete..."}
          disabled={!isReady}
          className={`w-full px-4 py-3 text-sm text-gray-900 border-2 rounded-md shadow-sm transition-all ${
            !isReady
              ? 'bg-gray-50 border-gray-300 cursor-wait'
              : 'bg-white border-blue-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:shadow-md'
          }`}
        />
        <div className="mt-2 flex items-start gap-2">
          <span className="text-xs">{isReady ? '💡' : '⏳'}</span>
          <p className="text-xs text-gray-700 leading-relaxed">
            {isReady ? (
              isHost
                ? 'Type to search for a location, or click anywhere on the map to add a location'
                : <>{t.clickMapToAdd}</>
            ) : (
              <>Waiting for Google Maps to load...</>
            )}
          </p>
        </div>
      </div>

      {/* Locations List */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">👥</span>
          <h3 className="text-sm font-bold text-gray-900">
            {isHost ? 'Participant Locations' : t.addedLocations} ({locations.length})
          </h3>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {locations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <div className="text-4xl mb-3">📍</div>
              <p className="text-gray-600 text-sm font-medium mb-1">
                {isHost ? 'No locations added yet' : t.noLocationsYet}
              </p>
              <p className="text-gray-500 text-xs">
                {isHost
                  ? 'Search above or click the map to add participant locations'
                  : 'Add your starting location using the search box or map'}
              </p>
            </div>
          ) : (
            locations.map((location) => {
              const canEdit = isHost || location.id === myParticipantId;
              const isOrganizerLocation = location.name === 'You';

              return (
                <div
                  key={location.id}
                  className={`flex items-center justify-between p-3 border-2 rounded-lg hover:shadow-sm transition-all ${
                    isOrganizerLocation
                      ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-300 hover:border-green-400'
                      : 'bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {isOrganizerLocation && <span className="text-lg">👑</span>}
                      <p className={`font-bold truncate ${isOrganizerLocation ? 'text-green-900' : 'text-gray-900'}`}>
                        {location.name || location.address || 'Unnamed Location'}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      📌 {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-3 flex-shrink-0">
                    {canEdit && (
                      <button
                        onClick={() => handleEditLocation(location.id)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                        title="Edit this location"
                      >
                        {t.edit}
                      </button>
                    )}
                    {(isHost || location.id === myParticipantId) && (
                      <button
                        onClick={() => onRemoveLocation(location.id)}
                        className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-md hover:bg-red-700 transition-colors shadow-sm"
                        title="Remove this location"
                      >
                        {t.remove}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
