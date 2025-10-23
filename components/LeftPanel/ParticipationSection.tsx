'use client';

import { useState } from 'react';
import { Users, EyeOff, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Participant } from '@/lib/api';

interface ParticipationSectionProps {
  participants: Participant[];
  myParticipantId?: string;
  onParticipantClick: (participantId: string) => void;
  onRemoveParticipant?: (participantId: string) => void;
  isHost: boolean;
  showParticipantNames?: boolean;
  onToggleShowNames?: (show: boolean) => void;
}

// Predefined color palette for participant markers
const PARTICIPANT_COLORS = [
  '#10b981', // emerald
  '#0d9488', // teal
  '#f59e0b', // amber
  '#9333ea', // purple
  '#ec4899', // pink
  '#3b82f6', // blue
];

export default function ParticipationSection({
  participants,
  myParticipantId,
  onParticipantClick,
  onRemoveParticipant,
  isHost,
  showParticipantNames = true,
  onToggleShowNames,
}: ParticipationSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true); // Default expanded

  const getParticipantColor = (index: number) => {
    return PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length];
  };

  const isBlurred = (participant: Participant) => {
    return participant.fuzzy_lat !== null && participant.fuzzy_lng !== null;
  };

  return (
    <div className="px-4 py-3 space-y-2">
      {/* Header - Compact with Collapse Toggle and Names Toggle */}
      <div className="flex items-center justify-between mb-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
        >
          <Users className="w-4 h-4 text-black" />
          <h3 className="text-xs font-bold text-black uppercase">
            Participants ({participants.length})
          </h3>
          {isExpanded ? (
            <ChevronUp className="w-3 h-3 text-black" />
          ) : (
            <ChevronDown className="w-3 h-3 text-black" />
          )}
        </button>
        {onToggleShowNames && (
          <button
            onClick={() => onToggleShowNames(!showParticipantNames)}
            className={`px-2 py-0.5 text-xs font-bold uppercase border-2 border-black transition-all ${
              showParticipantNames
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
            title={showParticipantNames ? 'Hide names on map' : 'Show names on map'}
          >
            Names
          </button>
        )}
      </div>

      {/* Ultra-compact 1-line participant list (collapsible) */}
      {isExpanded && (
        <div className="space-y-0.5 max-h-48 overflow-y-auto">
        {participants.map((participant, index) => {
          const isMe = participant.id === myParticipantId;
          const color = getParticipantColor(index);
          const displayName = participant.name || `Participant ${participant.id.slice(0, 8)}`;
          const truncatedName = displayName.length > 12 ? displayName.slice(0, 12) + '...' : displayName;

          // Use fuzzy coordinates if available, otherwise exact
          const displayLat = participant.fuzzy_lat ?? participant.lat;
          const displayLng = participant.fuzzy_lng ?? participant.lng;

          return (
            <div
              key={participant.id}
              onClick={() => onParticipantClick(participant.id)}
              className={`relative flex items-center border-2 border-black cursor-pointer transition-all overflow-hidden ${
                isMe
                  ? 'bg-black text-white'
                  : 'bg-white hover:bg-gray-100'
              }`}
            >
              {/* Left content - 75% */}
              <div className="flex items-center gap-1.5 p-1.5 flex-1 min-w-0 relative z-10">
                {/* Name (with "You" arrow if self) */}
                <span className={`text-xs font-bold flex-shrink-0 ${
                  isMe ? 'text-white' : 'text-black'
                }`}>
                  {isMe && '→ '}
                  {truncatedName}
                </span>

                {/* Bullet separator */}
                <span className={`text-xs ${isMe ? 'text-gray-400' : 'text-neutral-400'}`}>•</span>

                {/* Coordinates */}
                <span className={`text-xs truncate flex-1 ${
                  isMe ? 'text-gray-300' : 'text-neutral-600'
                }`} title={`${displayLat}, ${displayLng}`}>
                  {displayLat.toFixed(2)}, {displayLng.toFixed(2)}
                </span>

                {/* Blur indicator */}
                {isBlurred(participant) && (
                  <span title="Location blurred">
                    <EyeOff className={`w-3 h-3 flex-shrink-0 ${
                      isMe ? 'text-gray-400' : 'text-neutral-400'
                    }`} />
                  </span>
                )}

                {/* Remove Button (Host only, can't remove self) */}
                {isHost && !isMe && onRemoveParticipant && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveParticipant(participant.id);
                    }}
                    className={`p-0.5 border border-black transition-colors flex-shrink-0 ${
                      isMe
                        ? 'bg-white text-black hover:bg-gray-200'
                        : 'bg-white text-black hover:bg-gray-100'
                    }`}
                    title="Remove participant"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Color tag - Rightmost 25% with angled left edge */}
              <div
                className="absolute right-0 top-0 bottom-0 w-[25%] flex-shrink-0"
                style={{
                  backgroundColor: color,
                  clipPath: 'polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%)',
                }}
                title={`Map marker color: ${color}`}
              />
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
