'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Eye, EyeOff, RefreshCw, Check, User, ChevronUp, ChevronDown, Info, Trash2 } from 'lucide-react';
import { generateUniqueName } from '@/lib/nameGenerator';
import { toast } from 'sonner';

import { Participant } from '@/lib/api';

interface InputSectionProps {
  isJoined: boolean;
  onJoinEvent: (data: { name: string; lat: number; lng: number; blur: boolean }) => Promise<void>;
  onEditLocation: (data: { name?: string; lat?: number; lng?: number; blur?: boolean }) => Promise<void>;
  onRemoveOwnLocation: () => Promise<void>;
  currentParticipant?: Participant;
  isHost: boolean;
}

export default function InputSection({
  isJoined,
  onJoinEvent,
  onEditLocation,
  onRemoveOwnLocation,
  currentParticipant,
  isHost,
}: InputSectionProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [blurLocation, setBlurLocation] = useState(false);  // Default to OFF - show addresses by default
  const [isExpanded, setIsExpanded] = useState(!isJoined);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [addingMode, setAddingMode] = useState<'self' | 'others'>('self'); // Toggle between adding self or others

  const addressInputRef = useRef<HTMLInputElement>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
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

  // Initialize Google Places Autocomplete for address input
  useEffect(() => {
    if (!addressInputRef.current || !isGoogleLoaded || !isExpanded) {
      return;
    }

    // Clean up any existing autocomplete instance
    if (autocomplete) {
      google.maps.event.clearInstanceListeners(autocomplete);
    }

    // Initialize Autocomplete - allow any address/place
    const autocompleteInstance = new google.maps.places.Autocomplete(addressInputRef.current, {
      fields: ['formatted_address', 'geometry', 'name', 'place_id'],
    });

    // Listen for place selection
    autocompleteInstance.addListener('place_changed', () => {
      const place = autocompleteInstance.getPlace();

      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const formattedAddress = place.formatted_address || place.name || '';

        // Store coordinates separately and show human-readable address
        setCoordinates({ lat, lng });
        setAddress(formattedAddress);

        toast.success(`Location set: ${formattedAddress}`);
      }
    });

    setAutocomplete(autocompleteInstance);

    return () => {
      if (autocompleteInstance) {
        google.maps.event.clearInstanceListeners(autocompleteInstance);
      }
    };
  }, [isGoogleLoaded, isExpanded]);

  // Generate anonymous name on mount
  useEffect(() => {
    if (!isJoined) {
      const anonymousName = generateUniqueName(new Set());
      setName(anonymousName);
    }
  }, [isJoined]);

  // Initialize form when participant data is available (for editing)
  useEffect(() => {
    if (currentParticipant && isJoined) {
      console.log('🔄 InputSection: Initializing form with participant data:', {
        name: currentParticipant.name,
        address: currentParticipant.address,
        lat: currentParticipant.lat,
        lng: currentParticipant.lng,
        visibility: currentParticipant.visibility,
      });
      setName(currentParticipant.name || '');
      setCoordinates({ lat: currentParticipant.lat, lng: currentParticipant.lng });
      setAddress(currentParticipant.address || 'Your location');
      // Initialize blur state from participant's visibility setting
      setBlurLocation(currentParticipant.visibility === 'blur');
    }
  }, [currentParticipant, isJoined]);

  // Reset form when switching between modes
  useEffect(() => {
    if (addingMode === 'others' && isHost) {
      // Clear form for adding others
      setName(generateUniqueName(new Set()));
      setAddress('');
      setCoordinates(null);
      setBlurLocation(false);
    } else if (addingMode === 'self' && currentParticipant) {
      // Reset to current participant's data
      setName(currentParticipant.name || '');
      setCoordinates({ lat: currentParticipant.lat, lng: currentParticipant.lng });
      setAddress(currentParticipant.address || 'Your location');
      setBlurLocation(currentParticipant.visibility === 'blur');
    }
  }, [addingMode, isHost, currentParticipant]);

  const handleShuffle = () => {
    const anonymousName = generateUniqueName(new Set());
    setName(anonymousName);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    toast.info('Getting your location...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        setAddress('Current location');
        toast.success('Location retrieved!');
      },
      (error) => {
        toast.error('Unable to retrieve your location');
        console.error('Geolocation error:', error);
      }
    );
  };

  const handleJoin = async () => {
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!coordinates) {
      toast.error('Please select a location');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isHost && addingMode === 'others') {
        // Host adding another participant
        await onJoinEvent({ name: name.trim(), lat: coordinates.lat, lng: coordinates.lng, blur: blurLocation });
        // Clear form for next participant
        setName(generateUniqueName(new Set()));
        setAddress('');
        setCoordinates(null);
        toast.success(`Added ${name.trim()} to the event`);
      } else if (isJoined) {
        // Update existing participant (including visibility)
        await onEditLocation({ name: name.trim(), lat: coordinates.lat, lng: coordinates.lng, blur: blurLocation });
        setIsExpanded(false);
      } else {
        // Join as new participant
        await onJoinEvent({ name: name.trim(), lat: coordinates.lat, lng: coordinates.lng, blur: blurLocation });
        setIsExpanded(false);
      }
    } catch (error) {
      console.error(`Failed to ${isJoined ? 'update' : 'join'}:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Collapsed state (after joining)
  if (isJoined && !isExpanded) {
    return (
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
          >
            <ChevronDown className="w-3 h-3 text-black" />
            <User className="w-4 h-4 text-black" />
            <h3 className="text-xs font-bold text-black uppercase">
              {currentParticipant?.name || 'You'}
            </h3>
          </button>
          {isHost && (
            <button
              onClick={onRemoveOwnLocation}
              className="p-0.5 border border-black bg-white text-black hover:bg-gray-100 transition-colors"
              title="Remove your location"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Expanded state (before joining or editing)
  return (
    <div className="py-3">
      {/* Header with collapse button - only show when editing */}
      {isJoined && (
        <div className="flex items-center justify-between mb-2 px-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
          >
            <ChevronUp className="w-3 h-3 text-black" />
            <User className="w-4 h-4 text-black" />
            <h3 className="text-xs font-bold text-black uppercase">
              {currentParticipant?.name || 'You'}
            </h3>
          </button>
        </div>
      )}

      {/* Mode Toggle - Host only, when joined - Full width like venue tabs */}
      {isHost && isJoined && (
        <div className="mb-3 flex border-b-2 border-black">
          <button
            onClick={() => setAddingMode('self')}
            className={`flex-1 px-3 py-2 font-bold text-xs transition-all border-r border-black ${
              addingMode === 'self'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            UPDATE MYSELF
          </button>
          <button
            onClick={() => setAddingMode('others')}
            className={`flex-1 px-3 py-2 font-bold text-xs transition-all ${
              addingMode === 'others'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            ADD OTHERS
          </button>
        </div>
      )}

      {/* Form inputs - with padding */}
      <div className="px-4">
        {/* Name Input with inline icon - sharp borders */}
        <div className="mb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center flex-1 gap-2 px-3 py-1.5 border-2 border-black focus-within:border-black">
              <User className="w-4 h-4 text-black flex-shrink-0" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="flex-1 text-sm text-black outline-none bg-transparent placeholder:text-gray-400"
              />
            </div>
            <button
              onClick={handleShuffle}
              className="p-1.5 border-2 border-black hover:bg-black hover:text-white text-black transition-all flex-shrink-0"
              title="Shuffle name"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Location Input with inline icon - sharp borders */}
        <div className="mb-3">
          <div className="flex items-center gap-2 px-3 py-1.5 border-2 border-black focus-within:border-black">
            <MapPin className="w-4 h-4 text-black flex-shrink-0" />
            <input
              ref={addressInputRef}
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={isGoogleLoaded ? "Search address or enter coordinates" : "Loading..."}
              disabled={!isGoogleLoaded}
              className="flex-1 text-sm text-black outline-none bg-transparent disabled:cursor-wait placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Action buttons row - Blur, Join/Update, Current Location */}
        <div className="flex items-center justify-between gap-2">
          {/* Blur toggle - left side - sharp square design */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setBlurLocation(!blurLocation)}
              className={`p-2 border-2 border-black transition-all ${
                blurLocation
                  ? 'bg-black text-white hover:bg-gray-900'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
              title={blurLocation ? "Location blurred (~500m)" : "Exact location"}
            >
              {blurLocation ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
            <div className="group relative">
              <Info className="w-3.5 h-3.5 text-black cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 px-2 py-1.5 bg-black text-white text-xs border-2 border-black shadow-lg z-10">
                Blurs your location by ~500m for privacy. Others see approximate area only.
              </div>
            </div>
          </div>

          {/* Join/Update/Add Button - center - high contrast black */}
          <button
            onClick={handleJoin}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-black hover:bg-gray-900 text-white text-sm font-bold border-2 border-black transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">
                  {isHost && addingMode === 'others' ? 'ADDING...' : isJoined ? 'UPDATING...' : 'JOINING...'}
                </span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isHost && addingMode === 'others' ? 'ADD' : isJoined ? 'UPDATE' : 'JOIN'}
                </span>
              </>
            )}
          </button>

          {/* Use Current Location - right side - sharp square design */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleCurrentLocation}
              className="p-2 bg-black hover:bg-gray-900 text-white border-2 border-black transition-all"
              title="Use current location"
            >
              <Navigation className="w-4 h-4" />
            </button>
            <div className="group relative">
              <Info className="w-3.5 h-3.5 text-black cursor-help" />
              <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-48 px-2 py-1.5 bg-black text-white text-xs border-2 border-black shadow-lg z-10">
                Uses your device's GPS to automatically fill in your current coordinates.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
