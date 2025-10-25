'use client';

import { useState, useEffect, useRef } from 'react';
import { Users, EyeOff, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Participant } from '@/lib/api';

interface ParticipationSectionProps {
  participants: Participant[];
  myParticipantId?: string;
  selectedParticipantId?: string | null;
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
  selectedParticipantId,
  onParticipantClick,
  onRemoveParticipant,
  isHost,
  showParticipantNames = true,
  onToggleShowNames,
}: ParticipationSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true); // Default expanded
  const [showAddresses, setShowAddresses] = useState(true); // Default show addresses
  const sectionRef = useRef<HTMLDivElement>(null);

  // Check if section would overflow screen bottom and auto-collapse if needed
  useEffect(() => {
    const checkOverflow = () => {
      if (!sectionRef.current || !isExpanded) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const bottomPosition = rect.bottom;
      const windowHeight = window.innerHeight;

      // If section extends beyond screen, auto-collapse
      if (bottomPosition > windowHeight) {
        setIsExpanded(false);
      }
    };

    // Check on mount and when participants change
    checkOverflow();

    // Check on resize
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [participants.length, isExpanded]);

  // Debug: Log participant data
  console.log('ParticipationSection participants:', participants.map(p => ({
    name: p.name,
    address: p.address,
    lat: p.lat,
    fuzzy_lat: p.fuzzy_lat,
    visibility: p.visibility,
    isBlurred: p.fuzzy_lat !== p.lat || p.fuzzy_lng !== p.lng
  })));

  const getParticipantColor = (index: number) => {
    return PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length];
  };

  const isBlurred = (participant: Participant) => {
    // Check if fuzzy coordinates are different from actual coordinates
    // If they're the same, privacy mode is OFF
    if (participant.fuzzy_lat === null || participant.fuzzy_lng === null) {
      return false;
    }
    return participant.fuzzy_lat !== participant.lat || participant.fuzzy_lng !== participant.lng;
  };

  const formatAddress = (address: string) => {
    // Remove USA and postal codes from address
    // Postal codes pattern: matches 5 digits or 5+4 digit format
    let cleaned = address
      .replace(/,?\s*USA\s*$/i, '') // Remove USA at the end
      .replace(/,?\s*United States\s*$/i, '') // Remove United States at the end
      .replace(/,?\s*\d{5}(-\d{4})?\s*$/i, ''); // Remove postal code at the end

    return cleaned.trim();
  };

  return (
    <div ref={sectionRef} className="px-4 py-3 space-y-2">
      {/* Header - Compact with Collapse Toggle and Names/Address Toggles */}
      <div className="flex items-center justify-between mb-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
        >
          {isExpanded ? (
            <ChevronUp className="w-3 h-3 text-black" />
          ) : (
            <ChevronDown className="w-3 h-3 text-black" />
          )}
          <Users className="w-4 h-4 text-black" />
          <h3 className="text-xs font-bold text-black uppercase">
            Participants ({participants.length})
          </h3>
        </button>
        <div className="flex items-center gap-1">
          {/* Address toggle - only show when expanded */}
          {isExpanded && (
            <button
              onClick={() => setShowAddresses(!showAddresses)}
              className={`px-2 py-0.5 text-xs font-bold uppercase border-2 border-black transition-all ${
                showAddresses
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
              title={showAddresses ? 'Hide addresses' : 'Show addresses'}
            >
              Addr
            </button>
          )}
          {/* Names toggle */}
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
      </div>

      {/* Two-line participant list (collapsible) */}
      {isExpanded && (
        <div className="space-y-0.5 max-h-48 overflow-y-auto">
        {participants.map((participant, index) => {
          const isMe = participant.id === myParticipantId;
          const color = getParticipantColor(index);
          const displayName = participant.name || `Participant ${participant.id.slice(0, 8)}`;

          // Use fuzzy coordinates if available, otherwise exact
          const displayLat = participant.fuzzy_lat ?? participant.lat;
          const displayLng = participant.fuzzy_lng ?? participant.lng;

          const isSelected = participant.id === selectedParticipantId;

          return (
            <div
              key={participant.id}
              onClick={() => onParticipantClick(participant.id)}
              className={`relative flex border-2 border-black cursor-pointer transition-all overflow-hidden ${
                isMe
                  ? 'bg-black text-white'
                  : isSelected
                  ? 'bg-gray-300 text-black'
                  : 'bg-white hover:bg-gray-100'
              }`}
            >
              {/* Left content - One or Two-line layout */}
              <div className="flex-1 min-w-0 relative z-10 p-1.5 pr-2">
                {/* Line 1: Name and indicators */}
                <div className={`flex items-center gap-1.5 ${showAddresses ? 'mb-0.5' : ''}`}>
                  <span className={`text-xs font-bold flex-shrink-0 ${
                    isMe ? 'text-white' : 'text-black'
                  }`}>
                    {isMe && '→ '}
                    {displayName}
                  </span>

                  {/* Blur indicator */}
                  {isBlurred(participant) && (
                    <EyeOff className={`w-3 h-3 flex-shrink-0 ${
                      isMe ? 'text-gray-400' : 'text-neutral-400'
                    }`} title="Location blurred" />
                  )}

                  {/* Remove Button (Host only, can't remove self) */}
                  {isHost && !isMe && onRemoveParticipant && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveParticipant(participant.id);
                      }}
                      className={`ml-auto p-0.5 border border-black transition-colors flex-shrink-0 ${
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

                {/* Line 2: Address or Coordinates - Only show when showAddresses is true */}
                {showAddresses && (
                  <div className="flex items-center">
                    {!isBlurred(participant) && participant.address ? (
                      <span className={`text-xs truncate ${
                        isMe ? 'text-gray-300' : 'text-neutral-600'
                      }`} title={participant.address}>
                        {formatAddress(participant.address)}
                      </span>
                    ) : (
                      <span className={`text-xs truncate ${
                        isMe ? 'text-gray-300' : 'text-neutral-600'
                      }`} title={`${displayLat}, ${displayLng}`}>
                        {displayLat.toFixed(4)}, {displayLng.toFixed(4)}
                      </span>
                    )}
                  </div>
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
