'use client';

import { Event } from '@/types';
import EventFeedStatusBadge from './EventFeedStatusBadge';
import { AvatarCircles } from '@/components/ui/avatar-circles';
import SpotlightCard from './SpotlightCard';
import { useState } from 'react';
import { Calendar, MapPin, Film, Dribbble, Star, Trophy, Bike, Footprints, Dumbbell, CircleDot, Volleyball, Theater, Music as MusicIcon, Gamepad2, Laugh, Mic2, PartyPopper, Clock, Users, Circle, Disc } from 'lucide-react';

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

const getCategoryIcon = (category?: string, size: 'small' | 'large' = 'large') => {
  const sizeClasses = size === 'small' ? 'w-3 h-3 sm:w-4 sm:h-4' : 'w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8';

  if (!category) return <Calendar className={`${sizeClasses} flex-shrink-0`} />;

  // Icon map for all categories (both parent and subcategories)
  const iconMap: Record<string, React.ReactElement> = {
    // Parent categories
    sports: <Trophy className={`${sizeClasses} flex-shrink-0`} />,
    entertainment: <Film className={`${sizeClasses} flex-shrink-0`} />,

    // Sports subcategories
    'Basketball': <Dribbble className={`${sizeClasses} flex-shrink-0`} />,
    'Soccer': <Disc className={`${sizeClasses} flex-shrink-0`} />,
    'Tennis': <CircleDot className={`${sizeClasses} flex-shrink-0`} />,
    'Running': <Footprints className={`${sizeClasses} flex-shrink-0`} />,
    'Gym': <Dumbbell className={`${sizeClasses} flex-shrink-0`} />,
    'Cycling': <Bike className={`${sizeClasses} flex-shrink-0`} />,
    'Volleyball': <Volleyball className={`${sizeClasses} flex-shrink-0`} />,
    'Badminton': <CircleDot className={`${sizeClasses} flex-shrink-0`} />,

    // Entertainment subcategories
    'Movies': <Film className={`${sizeClasses} flex-shrink-0`} />,
    'Theater': <Theater className={`${sizeClasses} flex-shrink-0`} />,
    'Concerts': <MusicIcon className={`${sizeClasses} flex-shrink-0`} />,
    'Museums': <Theater className={`${sizeClasses} flex-shrink-0`} />,
    'Gaming': <Gamepad2 className={`${sizeClasses} flex-shrink-0`} />,
    'Comedy': <Laugh className={`${sizeClasses} flex-shrink-0`} />,
    'Karaoke': <Mic2 className={`${sizeClasses} flex-shrink-0`} />,
    'Festival': <PartyPopper className={`${sizeClasses} flex-shrink-0`} />,
  };

  return iconMap[category] || <Calendar className={`${sizeClasses} flex-shrink-0`} />;
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
        <div className="mb-3 flex flex-wrap gap-2 items-center">
          {event.location_type === 'fixed' ? (
            // Fixed location: Show venue name
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 border-2 ${
              event.background_image
                ? 'bg-white/10 backdrop-blur-sm border-white text-white'
                : 'bg-white border-black text-black'
            }`}>
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-bold">{event.fixed_venue_name || event.location_area}</span>
            </div>
          ) : (
            // Collaborative: Show area + finding location status
            <>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 border-2 ${
                event.background_image
                  ? 'bg-white/10 backdrop-blur-sm border-white text-white'
                  : 'bg-white border-black text-black'
              }`}>
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-bold">{event.location_area}</span>
              </div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 border-2 ${
                event.background_image
                  ? 'bg-white/10 backdrop-blur-sm border-white text-white'
                  : 'bg-white border-black text-black'
              }`}>
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-bold uppercase">Finding location</span>
              </div>
              {event.venue_count > 0 && (
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 border-2 ${
                  event.background_image
                    ? 'bg-white/10 backdrop-blur-sm border-white text-white'
                    : 'bg-white border-black text-black'
                }`}>
                  <span className="text-xs font-bold uppercase">{event.venue_count} venue{event.venue_count !== 1 ? 's' : ''}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Progress Indicator and Avatars on same row */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 mb-3 md:mb-4">
          {/* Progress Indicator - Always show for active events */}
          {event.status === 'active' && (
            <div className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 border-2 ${
              event.background_image
                ? 'bg-white/20 backdrop-blur-sm border-white text-white'
                : 'bg-white border-black text-black'
            }`}>
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-bold uppercase">
                {event.participant_count}/{event.participant_limit || '∞'}
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

        {/* Category, Rating, Distance Info - Techno Style */}
        <div className="flex flex-wrap gap-2 mb-3 items-center">
          {event.category && (
            <div className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 border-2 ${
              event.background_image
                ? 'bg-white/10 backdrop-blur-sm border-white text-white'
                : 'bg-white border-black text-black'
            }`}>
              {getCategoryIcon(event.category, 'small')}
              <span className="text-xs sm:text-sm font-bold uppercase">
                {event.category}
              </span>
            </div>
          )}
          {event.average_rating && (
            <div className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 border-2 ${
              event.background_image
                ? 'bg-white/10 backdrop-blur-sm border-white text-white'
                : 'bg-white border-black text-black'
            }`}>
              <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current flex-shrink-0" />
              <span className="text-xs sm:text-sm font-bold">{event.average_rating.toFixed(1)}</span>
            </div>
          )}
          {event.distance_km && (
            <div className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 border-2 ${
              event.background_image
                ? 'bg-white/10 backdrop-blur-sm border-white text-white'
                : 'bg-white border-black text-black'
            }`}>
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-bold">{event.distance_km.toFixed(1)} KM</span>
            </div>
          )}
        </div>

        {/* Time Info - Techno Style */}
        <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border-2 mb-3 md:mb-4 ${
          event.background_image
            ? 'bg-white/10 backdrop-blur-sm border-white text-white'
            : 'bg-white border-black text-black'
        }`}>
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-bold uppercase">{formatTime(event.meeting_time)}</span>
        </div>

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
