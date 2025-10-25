'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface MeetingLocationCardProps {
  venueName: string;
  venueAddress?: string;
  lat?: number;
  lng?: number;
}

export default function MeetingLocationCard({
  venueName,
  venueAddress,
  lat,
  lng,
}: MeetingLocationCardProps) {
  const [mapError, setMapError] = useState(false);

  const handleGetDirections = () => {
    // Open Google Maps with the venue location
    if (lat && lng) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        '_blank'
      );
    } else if (venueAddress) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venueAddress)}`,
        '_blank'
      );
    } else {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venueName)}`,
        '_blank'
      );
    }
  };

  const handleCopyAddress = async () => {
    const textToCopy = venueAddress || venueName;
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.success('Address copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy address');
    }
  };

  // Build Google Maps embed URL
  const getMapEmbedUrl = () => {
    if (!lat || !lng) return null;
    return `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${lat},${lng}&zoom=15`;
  };

  const mapEmbedUrl = getMapEmbedUrl();

  return (
    <div className="bg-white border border-gray-300 overflow-hidden">
      {/* Google Maps Embed */}
      <div className="h-64 bg-gray-100 relative">
        {mapEmbedUrl && !mapError ? (
          <iframe
            src={mapEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            onError={() => setMapError(true)}
            className="w-full h-full"
          />
        ) : (
          // Fallback: Static Google Maps image
          lat && lng ? (
            <img
              src={`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=800x400&markers=color:red%7C${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
              alt="Map"
              className="w-full h-full object-cover"
              onError={() => setMapError(true)}
            />
          ) : (
            // Final fallback
            <div className="h-full bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-2">📍</div>
                <div className="text-sm text-gray-600 bg-white/80 px-4 py-2 rounded">
                  Map unavailable
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Venue Info */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-black mb-2">{venueName}</h3>
            {venueAddress && (
              <p className="text-gray-600 flex items-start gap-2">
                <span className="text-gray-400 flex-shrink-0">📍</span>
                <span>{venueAddress}</span>
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleGetDirections}
            className="flex-1 py-3 bg-black text-white font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span>Get Directions</span>
          </button>
          <button
            onClick={handleCopyAddress}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium hover:border-black hover:text-black transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Address
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-4 p-4 bg-green-50 border border-green-200">
          <p className="text-sm text-green-800 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>This is a fixed location event - the meeting place has been confirmed by the host</span>
          </p>
        </div>
      </div>
    </div>
  );
}
