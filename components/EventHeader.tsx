'use client';

import { AvatarCircles } from './ui/avatar-circles';

interface EventHeaderProps {
  title: string;
  category?: string;
  hostName: string;
  meetingTime: string;
  locationArea: string;
  participantCount: number;
  participantLimit?: number;
  participantAvatars?: string[];
  onShare: () => void;
  onJoin?: () => void;
  onLeave?: () => void;
  userRole: 'host' | 'participant' | 'guest';
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
  participantCount,
  participantLimit,
  participantAvatars,
  onShare,
  onJoin,
  onLeave,
  userRole,
  isJoining,
  isLeaving,
}: EventHeaderProps) {
  const emoji = getCategoryEmoji(category);

  return (
    <div className="bg-white border-b border-gray-300 px-8 py-6">
      {/* Title */}
      <h1 className="text-3xl font-bold text-black mb-4 flex items-center gap-3">
        <span className="text-4xl">{emoji}</span>
        {title}
      </h1>

      {/* Host & Time & Location */}
      <div className="space-y-2 mb-4">
        <p className="text-gray-700">
          <span className="font-medium">Hosted by</span>{' '}
          <span className="text-black font-bold">@{hostName}</span>
        </p>
        <p className="text-gray-700 flex items-center gap-2">
          <span>🕐</span>
          <span>{formatTime(meetingTime)}</span>
        </p>
        <p className="text-gray-700 flex items-center gap-2">
          <span>📍</span>
          <span>{locationArea}</span>
        </p>
      </div>

      {/* Progress & Avatars */}
      <div className="flex items-center gap-4 mb-6">
        {/* Progress Indicator */}
        {participantLimit && (
          <div className="inline-block px-3 py-1.5 rounded bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
            <span className="text-sm text-gray-700">
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
      <div className="flex gap-3">
        {/* Share Button - Always visible */}
        <button
          onClick={onShare}
          className="px-6 py-3 border-2 border-black text-black font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share Event
        </button>

        {/* Role-specific buttons */}
        {userRole === 'guest' && onJoin && (
          <button
            onClick={onJoin}
            disabled={isJoining}
            className="flex-1 px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoining ? 'Joining...' : 'Join Event'}
          </button>
        )}

        {userRole === 'participant' && onLeave && (
          <button
            onClick={onLeave}
            disabled={isLeaving}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:border-black hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLeaving ? 'Leaving...' : 'Leave Event'}
          </button>
        )}

        {userRole === 'host' && (
          <button
            className="flex-1 px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Manage Event
          </button>
        )}
      </div>
    </div>
  );
}
