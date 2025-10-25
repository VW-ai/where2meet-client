'use client';

import { useState } from 'react';

interface VenuePhotoProps {
  photoReference?: string;
  venueName: string;
  className?: string;
}

export default function VenuePhoto({ photoReference, venueName, className = '' }: VenuePhotoProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Construct Google Places Photo URL
  const getPhotoUrl = (reference: string, maxWidth: number = 400): string => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${reference}&key=${apiKey}`;
  };

  // Fallback icon based on venue category
  const getFallbackIcon = (): string => {
    // Generic venue icon
    return '🏢';
  };

  // Show fallback if no photo reference or image failed to load
  if (!photoReference || imageError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-4xl">{getFallbackIcon()}</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className} bg-gray-100`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
          <span className="text-2xl text-gray-400">📷</span>
        </div>
      )}
      <img
        src={getPhotoUrl(photoReference)}
        alt={venueName}
        className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImageError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
}
