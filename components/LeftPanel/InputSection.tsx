'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Eye, EyeOff, RefreshCw, Check, Edit2, User, ChevronUp, Info, X } from 'lucide-react';
import { generateUniqueName } from '@/lib/nameGenerator';
import { toast } from 'sonner';

interface InputSectionProps {
  isJoined: boolean;
  onJoinEvent: (data: { name: string; lat: number; lng: number; blur: boolean }) => Promise<void>;
  onEditLocation: (data: { name?: string; lat?: number; lng?: number }) => Promise<void>;
  onRemoveOwnLocation: () => Promise<void>;
  currentUserName?: string;
  currentUserLocation?: string;
  isHost: boolean;
}

export default function InputSection({
  isJoined,
  onJoinEvent,
  onEditLocation,
  onRemoveOwnLocation,
  currentUserName,
  currentUserLocation,
  isHost,
}: InputSectionProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [blurLocation, setBlurLocation] = useState(true);
  const [isExpanded, setIsExpanded] = useState(!isJoined);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    // Initialize Autocomplete - allow any address/place
    const autocompleteInstance = new google.maps.places.Autocomplete(addressInputRef.current, {
      fields: ['formatted_address', 'geometry', 'name'],
    });

    // Listen for place selection
    autocompleteInstance.addListener('place_changed', () => {
      const place = autocompleteInstance.getPlace();

      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        // Set address as coordinates for the backend
        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        toast.success(`Location set: ${place.formatted_address || place.name || 'Selected location'}`);
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
        setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
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
    if (!address.trim()) {
      toast.error('Please enter your location');
      return;
    }

    // Parse lat/lng from address (if it's coordinates)
    const coordMatch = address.match(/([-+]?\d+\.\d+),\s*([-+]?\d+\.\d+)/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);

      setIsSubmitting(true);
      try {
        await onJoinEvent({ name: name.trim(), lat, lng, blur: blurLocation });
        setIsExpanded(false);
      } catch (error) {
        console.error('Failed to join:', error);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      toast.error('Please enter coordinates or use location search');
    }
  };

  // Collapsed state (after joining)
  if (isJoined && !isExpanded) {
    return (
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setIsExpanded(true)}>
              <p className="text-sm font-semibold text-neutral-900 truncate">{currentUserName}</p>
              <p className="text-xs text-neutral-500 truncate">{currentUserLocation}</p>
            </div>
            {isHost && (
              <button
                onClick={onRemoveOwnLocation}
                className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded text-xs font-medium transition-colors flex-shrink-0"
                title="Delete this entry"
              >
                Delete
              </button>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(true)}
            className="p-1 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors flex-shrink-0 ml-2"
            title="Edit"
          >
            <ChevronUp className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>
    );
  }

  // Expanded state (before joining or editing)
  return (
    <div className="px-4 py-3">
      {/* Collapse button - only show when editing */}
      {isJoined && (
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
            title="Collapse"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      )}

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

        {/* Join/Update Button - center - high contrast black */}
        <button
          onClick={handleJoin}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-black hover:bg-gray-900 text-white text-sm font-bold border-2 border-black transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="hidden sm:inline">{isJoined ? 'UPDATING...' : 'JOINING...'}</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">{isJoined ? 'UPDATE' : 'JOIN'}</span>
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
  );
}
