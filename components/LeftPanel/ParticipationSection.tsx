'use client';

import { Users, MapPin, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Participant } from '@/lib/api';

interface ParticipationSectionProps {
  participants: Participant[];
  myParticipantId?: string;
  onParticipantClick: (participantId: string) => void;
  onRemoveParticipant?: (participantId: string) => void;
  isHost: boolean;
}

// Predefined color palette for participant markers
const PARTICIPANT_COLORS = [
  { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-600', marker: '#10b981' },
  { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-600', marker: '#0d9488' },
  { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-600', marker: '#f59e0b' },
  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-600', marker: '#9333ea' },
  { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-600', marker: '#ec4899' },
  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-600', marker: '#3b82f6' },
];

export default function ParticipationSection({
  participants,
  myParticipantId,
  onParticipantClick,
  onRemoveParticipant,
  isHost,
}: ParticipationSectionProps) {

  const getParticipantColor = (index: number) => {
    return PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length];
  };

  const isBlurred = (participant: Participant) => {
    return participant.fuzzy_lat !== null && participant.fuzzy_lng !== null;
  };

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-lg p-4 max-h-72 overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-5 h-5 text-emerald-600" />
        <h3 className="text-lg font-bold text-neutral-900">
          Participants ({participants.length})
        </h3>
      </div>

      <div className="space-y-2 overflow-y-auto flex-1">
        {participants.map((participant, index) => {
          const isMe = participant.id === myParticipantId;
          const color = getParticipantColor(index);
          const displayName = participant.name || `Participant ${participant.id.slice(0, 8)}`;
          const truncatedName = displayName.length > 15 ? displayName.slice(0, 15) + '...' : displayName;

          // Use fuzzy coordinates if available, otherwise exact
          const displayLat = participant.fuzzy_lat ?? participant.lat;
          const displayLng = participant.fuzzy_lng ?? participant.lng;
          const locationText = `${displayLat.toFixed(4)}, ${displayLng.toFixed(4)}`;

          return (
            <div
              key={participant.id}
              onClick={() => onParticipantClick(participant.id)}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                isMe
                  ? `${color.bg} ${color.border} shadow-sm`
                  : `bg-white hover:${color.bg} border-neutral-200 hover:${color.border}`
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1">
                  {/* Color Triangle Indicator */}
                  <div
                    className={`w-4 h-4 flex-shrink-0 mt-0.5`}
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '8px solid transparent',
                      borderRight: '8px solid transparent',
                      borderBottom: `12px solid ${color.marker}`,
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className={`font-semibold text-sm ${color.text}`}>
                        {isMe && 'You: '}
                        {truncatedName}
                      </h5>
                      {isBlurred(participant) && (
                        <span title="Location blurred">
                          <EyeOff className="w-3 h-3 text-neutral-400" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-neutral-500 flex-shrink-0" />
                      <p className="text-xs text-neutral-600 truncate" title={locationText}>
                        {locationText}
                        {isBlurred(participant) && (
                          <span className="ml-1 text-neutral-400">(blurred)</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Remove Button (Host only, can't remove self) */}
                {isHost && !isMe && onRemoveParticipant && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveParticipant(participant.id);
                    }}
                    className="p-1.5 hover:bg-red-100 text-neutral-400 hover:text-red-600 rounded transition-colors"
                    title="Remove participant"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
