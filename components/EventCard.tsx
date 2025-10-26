'use client';

import { Event } from '@/types';
import EventFeedStatusBadge from './EventFeedStatusBadge';
import { AvatarCircles } from '@/components/ui/avatar-circles';
import SpotlightCard from './SpotlightCard';
import { useState } from 'react';
import { Calendar, MapPin, Film, Dribbble, Star } from 'lucide-react';

interface EventCardProps {
  event: Event;
  userRole?: 'host' | 'participant' | 'guest';
  onView: (eventId: string) => void;
  onJoin?: (eventId: string) => void | Promise<void>;
  onLeave?: (eventId: string) => void | Promise<void>;
  showManageButton?: boolean; // Only show Manage button in My Posts page
}

// Map subcategories to their parent categories
const subcategoryToParent: Record<string, string> = {
  // Sports subcategories
  'Basketball': 'sports',
  'Soccer': 'sports',
  'Tennis': 'sports',
  'Running': 'sports',
  'Gym': 'sports',
  'Cycling': 'sports',
  'Volleyball': 'sports',
  'Badminton': 'sports',
  // Entertainment subcategories
  'Movies': 'entertainment',
  'Theater': 'entertainment',
  'Concerts': 'entertainment',
  'Museums': 'entertainment',
  'Gaming': 'entertainment',
  'Comedy': 'entertainment',
  'Karaoke': 'entertainment',
  'Festival': 'entertainment',
};

const getCategoryIcon = (category?: string) => {
  if (!category) return <Calendar className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex-shrink-0" />;

  // Check if it's a subcategory first
  const parentCategory = subcategoryToParent[category];

  const iconMap: Record<string, React.ReactElement> = {
    sports: <Dribbble className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex-shrink-0" />,
    entertainment: <Film className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex-shrink-0" />,
  };

  return iconMap[parentCategory || category] || <Calendar className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex-shrink-0" />;
};

const getParentCategory = (category?: string): string | null => {
  if (!category) return null;
  const parent = subcategoryToParent[category];
  if (parent) {
    return parent.charAt(0).toUpperCase() + parent.slice(1);
  }
  // If it's already a parent category
  if (category === 'sports' || category === 'entertainment') {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }
  return null;
};

const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday) return `Today at ${timeStr}`;
  if (isTomorrow) return `Tomorrow at ${timeStr}`;

  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  return `${dateStr} at ${timeStr}`;
};

export default function EventCard({ event, userRole = 'guest', onView, onJoin, onLeave, showManageButton = false }: EventCardProps) {
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const categoryIcon = getCategoryIcon(event.category);
  const isHost = userRole === 'host';
  const isParticipant = userRole === 'participant';
  const isFull = event.participant_limit && event.participant_count >= event.participant_limit;
  const isPast = event.status === 'past';
  const isClosed = event.status === 'closed';

  const handleJoin = async () => {
    if (!onJoin) return;
    setIsJoining(true);
    try {
      await onJoin(event.id);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!onLeave) return;
    setIsLeaving(true);
    try {
      await onLeave(event.id);
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <SpotlightCard
      className={`border transition-colors ${
        isParticipant || isHost
          ? 'border-black'
          : 'border-gray-300'
      } ${isPast || isClosed ? 'opacity-60' : ''}`}
      spotlightColor="rgba(255, 255, 255, 0.15)"
    >
      {/* Background Image */}
      {event.background_image && (
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${event.background_image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Dark overlay for text readability - fades diagonally from bottom-left to top-right */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/95 via-black/70 via-black/40 to-transparent" />
        </div>
      )}

      {/* Content - positioned above background */}
      <div className="relative z-10 p-4 sm:p-5 md:p-6">
        <div className="flex items-start justify-between mb-3 md:mb-4">
          <h3 className={`font-semibold text-lg sm:text-xl md:text-2xl flex items-center gap-2 break-words flex-1 ${
            event.background_image ? 'text-white' : 'text-black'
          }`}>
            {categoryIcon}
            <span className="break-words">{event.title}</span>
          </h3>
          <div className="flex gap-1 flex-shrink-0 ml-2">
            {isHost && <EventFeedStatusBadge status="host" />}
            {isParticipant && !isHost && <EventFeedStatusBadge status="joined" />}
            {isFull && <EventFeedStatusBadge status="full" />}
            {isClosed && <EventFeedStatusBadge status="closed" />}
            {isPast && <EventFeedStatusBadge status="past" />}
          </div>
        </div>

        {/* Location - Different display for fixed vs collaborative */}
        <p className={`text-sm sm:text-base md:text-lg mb-2 md:mb-3 break-words ${
          event.background_image ? 'text-gray-200' : 'text-gray-600'
        }`}>
          {event.location_type === 'fixed' ? (
            // Fixed location: Show venue name
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              {event.fixed_venue_name || event.location_area}
            </span>
          ) : (
            // Collaborative: Show area + finding location status
            <span className="flex items-center gap-1.5 flex-wrap">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                {event.location_area}
              </span>
              {' · '}
              <span className={event.background_image ? 'text-blue-300' : 'text-blue-600'}>
                <MapPin className="w-4 h-4 inline-block flex-shrink-0 mr-1" />
                Finding location
              </span>
              {event.venue_count > 0 && ` · ${event.venue_count} venue${event.venue_count !== 1 ? 's' : ''}`}
            </span>
          )}
        </p>

        {/* Progress Indicator and Avatars on same row */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 mb-3 md:mb-4">
          {/* Progress Indicator - Always show for active events */}
          {event.status === 'active' && (
            <div className={`inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded ${
              event.background_image
                ? 'bg-white/20 backdrop-blur-sm'
                : 'bg-gradient-to-r from-green-50 to-blue-50 border border-green-200'
            }`}>
              <span className={`text-sm sm:text-base ${
                event.background_image ? 'text-white' : 'text-gray-700'
              }`}>
                <span className={`font-bold ${
                  event.background_image ? 'text-green-300' : 'text-green-600'
                }`}>
                  In Progress {event.participant_count}
                </span>
                <span className="font-normal">
                  /{event.participant_limit || '∞'}
                </span>
              </span>
            </div>
          )}

          {/* Participants Avatars */}
          {event.participant_avatars && event.participant_avatars.length > 0 && (
            <AvatarCircles
              numPeople={Math.max(0, event.participant_count - event.participant_avatars.length)}
              avatarUrls={event.participant_avatars.slice(0, 4)}
            />
          )}
        </div>

        <p className={`text-sm sm:text-base md:text-lg mb-2 md:mb-3 break-words ${
          event.background_image ? 'text-gray-200' : 'text-gray-600'
        }`}>
          {event.category && (
            <span className="inline-flex items-center gap-1.5">
              {getCategoryIcon(event.category)} {getParentCategory(event.category)} - {event.category}
            </span>
          )}
          {event.average_rating && (
            <span className="inline-flex items-center gap-1">
              {event.category ? ' · ' : ''}
              <Star className="w-4 h-4 fill-current inline-block" />
              {event.average_rating.toFixed(1)}
            </span>
          )}
          {event.distance_km && (
            <span className="inline-flex items-center gap-1">
              {' · '}
              <MapPin className="w-4 h-4 inline-block" />
              {event.distance_km.toFixed(1)} km
            </span>
          )}
        </p>

        <p className={`text-sm sm:text-base md:text-lg mb-3 md:mb-4 break-words ${
          event.background_image ? 'text-gray-200' : 'text-gray-600'
        }`}>
          🕐 {formatTime(event.meeting_time)}
        </p>

        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={() => onView(event.id)}
            className={`w-full py-2.5 sm:py-3 px-4 sm:px-5 text-sm sm:text-base md:text-lg font-medium transition-colors rounded-lg ${
              event.background_image
                ? 'bg-white text-black hover:bg-gray-200'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            View
          </button>
        </div>
      </div>
    </SpotlightCard>
  );
}
