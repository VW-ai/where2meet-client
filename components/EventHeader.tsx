'use client';

import { AvatarCircles } from './ui/avatar-circles';

interface EventHeaderProps {
  title: string;
  category?: string;
  hostName: string;
  meetingTime: string;
  locationArea: string;
  venueName?: string;  // For fixed location events
  venueAddress?: string;  // For fixed location events
  participantCount: number;
  participantLimit?: number;
  participantAvatars?: string[];
  onShare: () => void;
  onJoin?: () => void;
  onLeave?: () => void;
  onEdit?: () => void;  // For host to edit event
  userRole: 'host' | 'participant' | 'guest';
  isHost?: boolean;  // Is current user the host
  isParticipant?: boolean;  // Is current user a participant
  isJoining?: boolean;
  isLeaving?: boolean;
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
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export default function EventHeader({
  title,
  category,
  hostName,
  meetingTime,
  locationArea,
  venueName,
  venueAddress,
  participantCount,
  participantLimit,
  participantAvatars,
  onShare,
  onJoin,
  onLeave,
  onEdit,
  userRole,
  isHost,
  isParticipant,
  isJoining,
  isLeaving,
}: EventHeaderProps) {
  const emoji = getCategoryEmoji(category);

  return (
    <div className="bg-white border-b border-gray-300 px-4 sm:px-6 md:px-8 py-4 md:py-6">
      {/* Title */}
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-4 md:mb-5 flex items-center gap-2 md:gap-3">
        <span className="text-3xl sm:text-4xl md:text-5xl">{emoji}</span>
        <span className="break-words">{title}</span>
      </h1>

      {/* Host & Time & Location */}
      <div className="space-y-2 md:space-y-3 mb-4 md:mb-5">
        <p className="text-base md:text-lg text-gray-700">
          <span className="font-medium">Hosted by</span>{' '}
          <span className="text-black font-bold">@{hostName}</span>
        </p>
        <p className="text-base md:text-lg text-gray-700 flex items-center gap-2">
          <span className="text-lg md:text-xl">🕐</span>
          <span className="break-words">{formatTime(meetingTime)}</span>
        </p>
        <div className="text-base md:text-lg text-gray-700">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 text-lg md:text-xl">📍</span>
            <div className="flex-1 min-w-0">
              {venueName && <div className="font-semibold text-black text-base md:text-lg break-words">{venueName}</div>}
              {venueAddress && <div className="text-sm md:text-base text-gray-600 break-words">{venueAddress}</div>}
              {!venueName && !venueAddress && <span className="break-words">{locationArea}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Progress & Avatars */}
      <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4 md:mb-6">
        {/* Progress Indicator */}
        {participantLimit && (
          <div className="inline-block px-4 py-2 rounded bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
            <span className="text-base text-gray-700">
              <span className="font-bold text-green-600">
                In Progress {participantCount}
              </span>
              <span className="font-normal">/{participantLimit}</span>
            </span>
          </div>
        )}

        {/* Avatars */}
        {participantAvatars && participantAvatars.length > 0 && (
          <AvatarCircles
            numPeople={Math.max(0, participantCount - participantAvatars.length)}
            avatarUrls={participantAvatars.slice(0, 4)}
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        {/* Share Button - Always visible */}
        <button
          onClick={onShare}
          className="w-full sm:w-auto px-5 sm:px-7 py-3 sm:py-3.5 border-2 border-black text-black text-base font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span>Share Event</span>
        </button>

        {/* Host buttons: Join/Leave */}
        {isHost && (
          <>
            {/* Join/Leave button for host */}
            {!isParticipant && onJoin && (
              <button
                onClick={onJoin}
                disabled={isJoining}
                className="w-full sm:flex-1 px-5 sm:px-7 py-3 sm:py-3.5 bg-black text-white text-base font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isJoining ? 'Joining...' : 'Join Event'}
              </button>
            )}

            {isParticipant && onLeave && (
              <button
                onClick={onLeave}
                disabled={isLeaving}
                className="w-full sm:w-auto px-5 sm:px-7 py-3 sm:py-3.5 border-2 border-gray-300 text-gray-700 text-base font-medium rounded-lg hover:border-black hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLeaving ? 'Leaving...' : 'Leave Event'}
              </button>
            )}
          </>
        )}

        {/* Guest buttons */}
        {!isHost && userRole === 'guest' && onJoin && (
          <button
            onClick={onJoin}
            disabled={isJoining}
            className="w-full sm:flex-1 px-5 sm:px-7 py-3 sm:py-3.5 bg-black text-white text-base font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoining ? 'Joining...' : 'Join Event'}
          </button>
        )}

        {/* Participant (non-host) buttons */}
        {!isHost && userRole === 'participant' && onLeave && (
          <button
            onClick={onLeave}
            disabled={isLeaving}
            className="w-full sm:w-auto px-5 sm:px-7 py-3 sm:py-3.5 border-2 border-gray-300 text-gray-700 text-base font-medium rounded-lg hover:border-black hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLeaving ? 'Leaving...' : 'Leave Event'}
          </button>
        )}
      </div>
    </div>
  );
}
