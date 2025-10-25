'use client';

import { useState, useEffect } from 'react';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';

interface AddVenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (venueData: {
    place_id: string;
    name: string;
    address?: string;
    lat: number;
    lng: number;
    rating?: number;
  }) => Promise<void>;
}

export default function AddVenueModal({ isOpen, onClose, onSubmit }: AddVenueModalProps) {
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [venuePlaceId, setVenuePlaceId] = useState('');
  const [venueLat, setVenueLat] = useState<number | undefined>();
  const [venueLng, setVenueLng] = useState<number | undefined>();
  const [venueRating, setVenueRating] = useState<number | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google Places Autocomplete (legacy API)
  const { containerRef, isLoaded } = useGooglePlacesAutocomplete({
    onPlaceSelect: (place) => {
      console.log('Venue selected:', place);

      setVenueName(place.name || place.formatted_address);
      setVenueAddress(place.formatted_address);
      setVenuePlaceId(place.place_id);

      if (place.geometry?.location) {
        setVenueLat(place.geometry.location.lat());
        setVenueLng(place.geometry.location.lng());
      }

      // Get rating from place details if available
      setVenueRating(undefined);
    },
    // No type restriction - allows all places (venues, addresses, etc.)
    types: undefined,
  });

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        // Restore body scroll
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';

        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!venueName.trim()) {
      setError('Please search for and select a venue');
      return;
    }

    if (!venuePlaceId) {
      setError('Please select a venue from the suggestions');
      return;
    }

    if (!venueLat || !venueLng) {
      setError('Venue location is required');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        place_id: venuePlaceId,
        name: venueName,
        address: venueAddress,
        lat: venueLat,
        lng: venueLng,
        rating: venueRating,
      });

      // Reset form
      setVenueName('');
      setVenueAddress('');
      setVenuePlaceId('');
      setVenueLat(undefined);
      setVenueLng(undefined);
      setVenueRating(undefined);

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add venue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset form
      setVenueName('');
      setVenueAddress('');
      setVenuePlaceId('');
      setVenueLat(undefined);
      setVenueLng(undefined);
      setVenueRating(undefined);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-300 px-6 py-4 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-black">Suggest a Venue</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-600 hover:text-black text-2xl leading-none disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-800">
                💡 Search for a venue using Google Places. Select from the suggestions that appear as you type.
              </p>
            </div>

            {/* Venue Search */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Search for Venue *
              </label>
              {/* Google Places Autocomplete Container */}
              <div ref={containerRef} className="w-full min-h-[44px]" style={{ display: 'block', visibility: 'visible' }} />
              <p className="text-xs text-gray-500 mt-1">
                {isLoaded ? (
                  <>✨ Start typing to search with Google Maps</>
                ) : (
                  <>🔍 Loading Google Maps...</>
                )}
              </p>
            </div>

            {/* Selected Venue Preview */}
            {venueName && venueAddress && (
              <div className="p-4 bg-gray-50 border border-gray-200">
                <p className="text-xs font-medium text-gray-700 mb-2">Selected Venue:</p>
                <p className="font-medium text-black">{venueName}</p>
                <p className="text-sm text-gray-600 mt-1">{venueAddress}</p>
                {venueLat && venueLng && (
                  <p className="text-xs text-gray-500 mt-2">
                    📍 {venueLat.toFixed(6)}, {venueLng.toFixed(6)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 border border-red-500 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex gap-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium hover:border-black hover:text-black transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !venuePlaceId}
              className="flex-1 py-3 bg-black text-white font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Venue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
