'use client';

import { useState, useEffect } from 'react';
import { MapPin, Navigation, Eye, EyeOff, RefreshCw, Check, X, Edit2 } from 'lucide-react';
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
      <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-neutral-900">You: {currentUserName}</p>
              <p className="text-xs text-neutral-600">{currentUserLocation}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(true)}
              className="p-2 text-neutral-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            {isHost && (
              <button
                onClick={onRemoveOwnLocation}
                className="p-2 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Expanded state (before joining or editing)
  return (
    <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-600" />
          {isJoined ? 'Edit Your Location' : 'Join This Event'}
        </h3>
        {isJoined && (
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 text-neutral-600 hover:text-neutral-900 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Name Input */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-neutral-900 mb-2">
          Your Name (Optional)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., swift_wolf"
            className="flex-1 px-4 py-2 text-neutral-900 border-2 border-neutral-300 rounded-md focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
          <button
            onClick={handleShuffle}
            className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md transition-colors"
            title="Generate new name"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Address Input */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-neutral-900 mb-2">
          Your Location
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Search address or coordinates"
          className="w-full px-4 py-2 text-neutral-900 border-2 border-neutral-300 rounded-md focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 mb-2"
        />
        <button
          onClick={handleCurrentLocation}
          className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2"
        >
          <Navigation className="w-4 h-4" />
          Use Current Location
        </button>
      </div>

      {/* Privacy Toggle */}
      <div className="mb-4">
        <label className="flex items-center gap-3 cursor-pointer bg-neutral-50 border border-neutral-300 rounded-md px-4 py-3">
          <input
            type="checkbox"
            checked={blurLocation}
            onChange={(e) => setBlurLocation(e.target.checked)}
            className="w-4 h-4 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500"
          />
          <div className="flex items-center gap-2 flex-1">
            {blurLocation ? (
              <EyeOff className="w-4 h-4 text-neutral-600" />
            ) : (
              <Eye className="w-4 h-4 text-neutral-600" />
            )}
            <span className="text-sm font-medium text-neutral-900">
              Blur my location (~500m)
            </span>
          </div>
        </label>
      </div>

      {/* Join Button */}
      <button
        onClick={handleJoin}
        disabled={isSubmitting}
        className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md shadow-sm hover:shadow-md transition-all disabled:bg-neutral-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Joining...
          </>
        ) : (
          <>
            <Check className="w-5 h-5" />
            {isJoined ? 'Update Location' : 'Join Event'}
          </>
        )}
      </button>
    </div>
  );
}
