'use client';

import { Event } from '@/types';
import EventFeedStatusBadge from './EventFeedStatusBadge';
import { AvatarCircles } from '@/components/ui/avatar-circles';
import SpotlightCard from './SpotlightCard';
import { useState } from 'react';

interface EventCardProps {
  event: Event;
  userRole?: 'host' | 'participant' | 'guest';
  onView: (eventId: string) => void;
  onJoin?: (eventId: string) => void | Promise<void>;
  onLeave?: (eventId: string) => void | Promise<void>;
}

const getCategoryEmoji = (category?: string) => {
  const emojiMap: Record<string, string> = {
    food: '☕',
    sports: '🏀',
    entertainment: '🎬',
    work: '💼',
    music: '🎵',
    outdoors: '🌳',
  };
  return emojiMap[category || 'other'] || '📅';
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

export default function EventCard({ event, userRole = 'guest', onView, onJoin, onLeave }: EventCardProps) {
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const emoji = getCategoryEmoji(event.category);
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
      <div className="relative z-10 p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className={`font-semibold text-lg flex items-center gap-2 ${
            event.background_image ? 'text-white' : 'text-black'
          }`}>
            <span>{emoji}</span>
            <span>{event.title}</span>
          </h3>
          <div className="flex gap-1">
            {isHost && <EventFeedStatusBadge status="host" />}
            {isParticipant && !isHost && <EventFeedStatusBadge status="joined" />}
            {isFull && <EventFeedStatusBadge status="full" />}
            {isClosed && <EventFeedStatusBadge status="closed" />}
            {isPast && <EventFeedStatusBadge status="past" />}
          </div>
        </div>

        {/* Location - Different display for fixed vs collaborative */}
        <p className={`text-sm mb-2 ${
          event.background_image ? 'text-gray-200' : 'text-gray-600'
        }`}>
          {event.location_type === 'fixed' ? (
            // Fixed location: Show venue name
            <>📍 {event.fixed_venue_name || event.location_area}</>
          ) : (
            // Collaborative: Show area + finding location status
            <>
              📍 {event.location_area}
              {' · '}
              <span className={event.background_image ? 'text-blue-300' : 'text-blue-600'}>
                🗺️ Finding location
              </span>
              {event.venue_count > 0 && ` · ${event.venue_count} venue${event.venue_count !== 1 ? 's' : ''}`}
            </>
          )}
        </p>

        {/* Progress Indicator and Avatars on same row */}
        <div className="flex items-center gap-4 mb-3">
          {/* Progress Indicator - Always show for active events */}
          {event.status === 'active' && (
            <div className={`inline-block px-3 py-1.5 rounded ${
              event.background_image
                ? 'bg-white/20 backdrop-blur-sm'
                : 'bg-gradient-to-r from-green-50 to-blue-50 border border-green-200'
            }`}>
              <span className={`text-sm ${
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

        <p className={`text-sm mb-3 ${
          event.background_image ? 'text-gray-200' : 'text-gray-600'
        }`}>
          {event.average_rating && `⭐ ${event.average_rating.toFixed(1)}`}
          {event.distance_km && `${event.average_rating ? ' · ' : ''}📍 ${event.distance_km.toFixed(1)} km`}
          {event.category && ` · ${getCategoryEmoji(event.category)} ${event.category}`}
        </p>

        <p className={`text-sm mb-3 ${
          event.background_image ? 'text-gray-200' : 'text-gray-600'
        }`}>
          🕐 {formatTime(event.meeting_time)}
        </p>

        <div className="flex gap-3">
          {isHost ? (
            <>
              <button
                onClick={() => onView(event.id)}
                className={`flex-1 py-2 px-4 border font-medium transition-colors ${
                  event.background_image
                    ? 'border-white text-white hover:bg-white/20'
                    : 'border-black text-black hover:bg-gray-50'
                }`}
              >
                View
              </button>
              <button
                onClick={() => onView(event.id)}
                className={`py-2 px-4 font-medium transition-colors ${
                  event.background_image
                    ? 'bg-white text-black hover:bg-gray-200'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                Manage
              </button>
            </>
          ) : isParticipant ? (
            <>
              <button
                onClick={() => onView(event.id)}
                className={`flex-1 py-2 px-4 font-medium transition-colors ${
                  event.background_image
                    ? 'bg-white text-black hover:bg-gray-200'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                View Event
              </button>
              {onLeave && (
                <button
                  onClick={handleLeave}
                  disabled={isLeaving}
                  className={`py-2 px-4 border font-medium transition-colors disabled:opacity-50 ${
                    event.background_image
                      ? 'border-white/50 text-gray-200 hover:border-white hover:text-white'
                      : 'border-gray-300 text-gray-600 hover:border-black hover:text-black'
                  }`}
                >
                  {isLeaving ? '...' : 'Leave'}
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => onView(event.id)}
                className={`flex-1 py-2 px-4 border font-medium transition-colors ${
                  event.background_image
                    ? 'border-white text-white hover:bg-white/20'
                    : 'border-black text-black hover:bg-gray-50'
                }`}
              >
                View
              </button>
              {!isFull && !isClosed && !isPast && onJoin && (
                <button
                  onClick={handleJoin}
                  disabled={isJoining}
                  className={`py-2 px-4 font-medium transition-colors disabled:opacity-50 ${
                    event.background_image
                      ? 'bg-white text-black hover:bg-gray-200'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  {isJoining ? '...' : event.location_type === 'collaborative' ? 'Join to Vote' : 'Join'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </SpotlightCard>
  );
}
