'use client';

import { useState } from 'react';
import { MapPin, Star, ChevronDown, ChevronUp, Clock, Users } from 'lucide-react';
import { ListItem } from '@/lib/api';

interface ListVenueCardProps {
  item: ListItem;
  index: number;
  onUseForMeeting?: (item: ListItem) => void;
}

// Helper function to manually parse opening hours
function checkIfOpenManually(weekdayText: string[]): boolean | null {
  if (!weekdayText || weekdayText.length === 0) return null;

  try {
    const now = new Date();
    const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    console.log('Manual parser - Current day:', currentDay, dayNamesEn[currentDay]);
    console.log('Manual parser - Weekday text:', weekdayText);

    // Find today's hours (try with and without colon/space)
    let todayHours = weekdayText.find(day => {
      const dayLower = day.toLowerCase();
      const chineseName = dayNames[currentDay];
      const englishName = dayNamesEn[currentDay].toLowerCase();

      return day.startsWith(chineseName) ||
             day.startsWith(chineseName + ':') ||
             dayLower.startsWith(englishName) ||
             dayLower.startsWith(englishName + ':');
    });

    console.log('Manual parser - Today hours:', todayHours);

    if (!todayHours) {
      console.warn('Manual parser - Could not find today in weekday_text');
      return null;
    }

    // Check if closed
    if (todayHours.includes('休息') || todayHours.includes('Closed')) {
      return false;
    }

    // Check if 24 hours
    if (todayHours.includes('24小时营业') || todayHours.includes('Open 24 hours')) {
      return true;
    }

    // Parse hours (format: "Monday: 09:00–22:00" or "星期一: 09:00–22:00")
    const timeMatch = todayHours.match(/(\d{1,2}):(\d{2})[–-](\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const openHour = parseInt(timeMatch[1]);
      const openMin = parseInt(timeMatch[2]);
      const closeHour = parseInt(timeMatch[3]);
      const closeMin = parseInt(timeMatch[4]);

      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const currentTime = currentHour * 60 + currentMin;
      const openTime = openHour * 60 + openMin;
      const closeTime = closeHour * 60 + closeMin;

      console.log('Manual parser - Time check:', {
        current: `${currentHour}:${currentMin} (${currentTime} mins)`,
        open: `${openHour}:${openMin} (${openTime} mins)`,
        close: `${closeHour}:${closeMin} (${closeTime} mins)`,
        isOpen: currentTime >= openTime && currentTime < closeTime
      });

      return currentTime >= openTime && currentTime < closeTime;
    }

    console.warn('Manual parser - Could not parse time from:', todayHours);
    return null;
  } catch (err) {
    console.error('Error parsing opening hours manually:', err);
    return null;
  }
}

export default function ListVenueCard({ item, index, onUseForMeeting }: ListVenueCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [placeDetails, setPlaceDetails] = useState<google.maps.places.PlaceResult | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isOpen, setIsOpen] = useState<boolean | null>(null);

  const fetchPlaceDetails = async () => {
    if (placeDetails || loadingDetails) return;

    setLoadingDetails(true);
    try {
      if (typeof window !== 'undefined' && window.google?.maps?.places) {
        const service = new google.maps.places.PlacesService(document.createElement('div'));

        service.getDetails(
          {
            placeId: item.place_id,
            fields: ['opening_hours', 'formatted_phone_number', 'website', 'user_ratings_total', 'types', 'price_level', 'photos'],
          },
          (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
              setPlaceDetails(place);

              // Determine if place is open
              if (place.opening_hours) {
                try {
                  // Check for 24-hour places first
                  const weekdayText = place.opening_hours.weekday_text || [];
                  const is24Hours = weekdayText.some(day =>
                    day.includes('24小时营业') ||
                    day.includes('Open 24 hours') ||
                    day.includes('24 hours')
                  );

                  if (is24Hours) {
                    setIsOpen(true);
                  } else if (typeof place.opening_hours.isOpen === 'function') {
                    // Try to use isOpen() function
                    try {
                      const openNow = place.opening_hours.isOpen();
                      console.log('isOpen() returned:', openNow, 'for', item.venue_name);

                      // If isOpen() returns undefined or null, fall back to manual parsing
                      if (openNow === undefined || openNow === null) {
                        console.warn('isOpen() returned undefined/null, using manual parsing');
                        setIsOpen(checkIfOpenManually(weekdayText));
                      } else {
                        setIsOpen(openNow);
                      }
                    } catch (isOpenErr) {
                      console.warn('isOpen() failed, trying manual parsing:', isOpenErr);
                      // Fallback to manual parsing
                      setIsOpen(checkIfOpenManually(weekdayText));
                    }
                  } else {
                    // No isOpen function, use manual parsing
                    setIsOpen(checkIfOpenManually(weekdayText));
                  }
                } catch (err) {
                  console.error('Error determining if place is open:', err);
                  setIsOpen(null);
                }
              }
            }
            setLoadingDetails(false);
          }
        );
      }
    } catch (err) {
      console.error('Failed to fetch place details:', err);
      setLoadingDetails(false);
    }
  };

  const handleToggle = () => {
    if (!expanded && !placeDetails) {
      fetchPlaceDetails();
    }
    setExpanded(!expanded);
  };

  return (
    <div className="border-2 border-black bg-white">
      {/* Main Card Content */}
      <div className="p-4">
        {/* Header with index and name */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 w-8 h-8 bg-black text-white flex items-center justify-center font-bold text-sm">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-black mb-1">{item.venue_name}</h3>

            {/* Rating and Address */}
            <div className="space-y-1">
              {item.rating && (
                <div className="flex items-center gap-1 text-sm text-gray-700">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{Number(item.rating).toFixed(1)}</span>
                  {placeDetails?.user_ratings_total && (
                    <span className="text-gray-500">({placeDetails.user_ratings_total} reviews)</span>
                  )}
                </div>
              )}

              {item.venue_address && (
                <div className="flex items-start gap-1 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="break-words">{item.venue_address}</span>
                </div>
              )}
            </div>

            {/* Notes */}
            {item.notes && (
              <div className="mt-3 p-3 bg-gray-50 border-l-4 border-black">
                <p className="text-sm text-gray-700 italic">"{item.notes}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleToggle}
            className="flex-1 px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 transition-colors font-bold text-sm uppercase flex items-center justify-center gap-2"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Less Info
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                More Info
              </>
            )}
          </button>

          {onUseForMeeting && (
            <button
              onClick={() => onUseForMeeting(item)}
              className="px-4 py-2 border-2 border-black bg-black text-white hover:bg-gray-900 transition-colors font-bold text-sm uppercase"
            >
              Use for Meeting
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t-2 border-black bg-gray-50 p-4">
          {loadingDetails ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : placeDetails ? (
            <div className="space-y-4">
              {/* Photos */}
              {placeDetails.photos && placeDetails.photos.length > 0 && (
                <div>
                  <h4 className="font-bold text-black uppercase text-sm mb-2">Photos</h4>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {placeDetails.photos.slice(0, 10).map((photo, i) => (
                      <div
                        key={i}
                        className="flex-shrink-0 w-32 h-32 border-2 border-black overflow-hidden cursor-pointer"
                        onClick={() => window.open(photo.getUrl({ maxWidth: 1200, maxHeight: 1200 }), '_blank')}
                      >
                        <img
                          src={photo.getUrl({ maxWidth: 300, maxHeight: 300 })}
                          alt={`${item.venue_name} photo ${i + 1}`}
                          className="w-full h-full object-cover hover:scale-110 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Opening Hours */}
              {placeDetails.opening_hours && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-black" />
                    <h4 className="font-bold text-black uppercase text-sm">Hours</h4>
                  </div>
                  <div className="space-y-1">
                    {(() => {
                      const weekdayText = placeDetails.opening_hours.weekday_text || [];
                      const is24Hours = weekdayText.length > 0 && weekdayText.every(day =>
                        day.includes('24小时营业') ||
                        day.includes('Open 24 hours') ||
                        day.includes('24 hours')
                      );

                      if (is24Hours) {
                        return (
                          <p className="text-sm font-bold text-green-600">
                            ● Open 24 Hours
                          </p>
                        );
                      }

                      return (
                        <>
                          {weekdayText.map((day, i) => (
                            <p key={i} className="text-sm text-gray-700 font-mono">
                              {day}
                            </p>
                          ))}
                          {isOpen !== null && (
                            <p className={`text-sm font-bold mt-2 ${
                              isOpen ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {isOpen ? '● Open Now' : '● Closed Now'}
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {placeDetails.formatted_phone_number && (
                  <div>
                    <p className="text-xs font-bold text-black uppercase mb-1">Phone</p>
                    <a
                      href={`tel:${placeDetails.formatted_phone_number}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {placeDetails.formatted_phone_number}
                    </a>
                  </div>
                )}

                {placeDetails.website && (
                  <div>
                    <p className="text-xs font-bold text-black uppercase mb-1">Website</p>
                    <a
                      href={placeDetails.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate block"
                    >
                      Visit Website →
                    </a>
                  </div>
                )}

                {placeDetails.price_level !== undefined && (
                  <div>
                    <p className="text-xs font-bold text-black uppercase mb-1">Price Level</p>
                    <p className="text-sm text-gray-700">
                      {'$'.repeat(placeDetails.price_level)}
                    </p>
                  </div>
                )}

                {placeDetails.types && placeDetails.types.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-black uppercase mb-1">Type</p>
                    <p className="text-sm text-gray-700 capitalize">
                      {placeDetails.types[0].replace(/_/g, ' ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 text-center py-4">
              Additional details not available
            </p>
          )}
        </div>
      )}
    </div>
  );
}
