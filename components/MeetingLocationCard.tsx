'use client';

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
  const handleGetDirections = () => {
    // Open Google Maps with the venue location
    if (lat && lng) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
        '_blank'
      );
    } else if (venueAddress) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueAddress)}`,
        '_blank'
      );
    } else {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueName)}`,
        '_blank'
      );
    }
  };

  return (
    <div className="bg-white border border-gray-300 overflow-hidden">
      {/* Map Placeholder */}
      <div className="h-64 bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 relative flex items-center justify-center">
        {/* Map placeholder - will be replaced with actual map later */}
        <div className="text-center">
          <div className="text-6xl mb-2">📍</div>
          <div className="text-sm text-gray-600 bg-white/80 px-4 py-2 rounded">
            Map integration coming soon
          </div>
        </div>

        {/* Coordinates indicator if available */}
        {lat && lng && (
          <div className="absolute top-3 left-3 bg-white px-3 py-1 text-xs text-gray-600 border border-gray-300">
            {lat.toFixed(6)}, {lng.toFixed(6)}
          </div>
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
            <span>🧭</span>
            <span>Get Directions</span>
          </button>
          <button
            onClick={() => {
              // Copy address to clipboard
              const textToCopy = venueAddress || venueName;
              navigator.clipboard.writeText(textToCopy);
              alert('Location copied to clipboard!');
            }}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium hover:border-black hover:text-black transition-colors"
          >
            Copy Address
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-4 p-4 bg-green-50 border border-green-200">
          <p className="text-sm text-green-800">
            ✓ This is a fixed location event - the meeting place has been confirmed by the host
          </p>
        </div>
      </div>
    </div>
  );
}
