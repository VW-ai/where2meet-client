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
  selectedCandidate?: any; // Show route button only when venue is selected
  routeFromParticipantId?: string | null;
  onRouteFromChange?: (participantId: string | null) => void;
}

export default function InputPanel({
  locations,
  onAddLocation,
  onRemoveLocation,
  onUpdateLocation,
  myParticipantId,
  isHost,
  selectedCandidate,
  routeFromParticipantId,
  onRouteFromChange,
}: InputPanelProps) {
  const { t } = useTranslation();
  const autocompleteRef = useRef<HTMLInputElement>(null);
  const modalAutocompleteRef = useRef<HTMLInputElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [nickname, setNickname] = useState('');
  const [showNicknamePrompt, setShowNicknamePrompt] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<Location | null>(null);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [isMyOwnLocation, setIsMyOwnLocation] = useState(false);
  const autocompleteInstance = useRef<google.maps.places.Autocomplete | null>(null);
  const modalAutocompleteInstance = useRef<google.maps.places.Autocomplete | null>(null);

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

  // Initialize modal autocomplete for editing
  useEffect(() => {
    if (!editingLocationId || !modalAutocompleteRef.current) return;

    let timeoutId: NodeJS.Timeout;
    let isCleanedUp = false;

    const initModalAutocomplete = () => {
      if (isCleanedUp) return;

      if (!window.google?.maps?.places?.Autocomplete) {
        timeoutId = setTimeout(initModalAutocomplete, 100);
        return;
      }

      try {
        if (!modalAutocompleteRef.current) return;

        const ac = new google.maps.places.Autocomplete(modalAutocompleteRef.current, {
          fields: ['place_id', 'geometry', 'name', 'formatted_address', 'types'],
          types: ['geocode', 'establishment'],
        });

        modalAutocompleteInstance.current = ac;

        ac.addListener('place_changed', () => {
          const place = ac.getPlace();

          if (!place.geometry?.location) {
            console.warn('No geometry found for selected place');
            return;
          }

          // Update pending location with new address
          setPendingLocation({
            id: pendingLocation?.id || Date.now().toString(),
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formatted_address || place.name,
            name: pendingLocation?.name,
          });
        });
      } catch (error) {
        console.error('Error initializing modal autocomplete:', error);
      }
    };

    initModalAutocomplete();

    return () => {
      isCleanedUp = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (modalAutocompleteInstance.current) {
        google.maps.event.clearInstanceListeners(modalAutocompleteInstance.current);
        modalAutocompleteInstance.current = null;
      }
    };
  }, [editingLocationId, pendingLocation?.id, pendingLocation?.name]);

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
          {isHost ? t.addParticipantLocations : t.addYourStartingLocation}
        </h2>
        <p className="text-sm text-blue-600 font-medium mt-1">
          {isHost
            ? t.organizerCanAddMultiple
            : t.startingLocationEmphasis}
        </p>
      </div>

      {/* Nickname Prompt Modal */}
      {showNicknamePrompt && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={handleCancelNickname}>
          <div className="bg-white rounded-lg p-4 max-w-xs w-full mx-4 shadow-xl border-2 border-gray-300" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-2">
              {editingLocationId ? t.editLocation : t.enterNickname}
            </h3>
            <p className="text-xs text-gray-600 mb-3">
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
                    <span className="text-sm font-medium text-gray-900">
                      {t.myLocation}
                    </span>
                  </div>
                </label>
              </div>
            )}

            {/* Name Input */}
            {!isMyOwnLocation && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {isHost ? t.participantName : t.yourNickname}
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
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t.location}
                </label>
                {editingLocationId ? (
                  // Editable address search when editing
                  <div>
                    <input
                      ref={modalAutocompleteRef}
                      type="text"
                      placeholder={pendingLocation.address || t.typeAddressPlaceholder}
                      defaultValue=""
                      className="w-full px-3 py-2 text-sm text-gray-900 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 {t.typeToSearchNewAddress}
                    </p>
                  </div>
                ) : (
                  // Static display when adding new location
                  <div className="p-2 bg-gray-50 border border-gray-300 rounded">
                    <p className="text-xs text-gray-900 font-medium">
                      {pendingLocation.address || t.unnamedLocation}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleConfirmNickname}
                disabled={!isMyOwnLocation && !nickname.trim()}
                className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {t.confirm}
              </button>
              <button
                onClick={handleCancelNickname}
                className="px-3 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300 transition-colors"
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
            {isHost ? t.searchForParticipantLocation : t.searchForAddress}
            {!isReady && <span className="text-xs text-gray-500 ml-2">(Loading...)</span>}
          </label>
        </div>
        <input
          ref={autocompleteRef}
          type="text"
          placeholder={isReady ? (isHost ? t.typeAddressPlaceholder : t.startTypingAddress) : "Loading autocomplete..."}
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
                ? t.typeOrClickMap
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
            {isHost ? t.participantLocations : t.addedLocations} ({locations.length})
          </h3>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {locations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <div className="text-4xl mb-3">📍</div>
              <p className="text-gray-600 text-sm font-medium mb-1">
                {isHost ? t.noParticipantLocationsYet : t.noLocationsYet}
              </p>
              <p className="text-gray-500 text-xs">
                {isHost
                  ? t.searchOrClickMapToAdd
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
                        {location.name || location.address || t.unnamedLocation}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      📌 {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-3 flex-shrink-0">
                    {selectedCandidate && onRouteFromChange && (
                      <button
                        onClick={() => onRouteFromChange(routeFromParticipantId === location.id ? null : location.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors shadow-sm ${
                          routeFromParticipantId === location.id
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                        title={routeFromParticipantId === location.id ? 'Hide route' : `View route from ${location.name || 'this location'}`}
                      >
                        🗺️
                      </button>
                    )}
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
