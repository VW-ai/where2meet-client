'use client';

import { Trophy, Heart, MapPin, Star, Trash2 } from 'lucide-react';
import { Candidate } from '@/types';
import { useRef, useEffect } from 'react';

interface VenueListSubViewProps {
  candidates: Candidate[];
  selectedCandidate: Candidate | null;
  onCandidateClick: (candidate: Candidate) => void;
  onVote?: (candidateId: string) => void;
  onDownvote?: (candidateId: string) => void;
  participantId?: string;
  myVotedCandidateIds: Set<string>;
  onRemoveCandidate?: (candidateId: string) => void;
  isHost: boolean;
  candidateColors?: Map<string, string>;
}

export default function VenueListSubView({
  candidates,
  selectedCandidate,
  onCandidateClick,
  onVote,
  onDownvote,
  participantId,
  myVotedCandidateIds,
  onRemoveCandidate,
  isHost,
  candidateColors,
}: VenueListSubViewProps) {

  // Refs for auto-scroll functionality
  const candidateRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Auto-scroll to selected candidate when it changes
  useEffect(() => {
    if (selectedCandidate && candidateRefs.current[selectedCandidate.id]) {
      candidateRefs.current[selectedCandidate.id]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedCandidate]);

  // Filter out venues with 0 votes, then sort by vote count (highest first), then by name
  const sortedCandidates = [...candidates]
    .filter(c => c.voteCount && c.voteCount > 0)
    .sort((a, b) => {
      const voteA = a.voteCount || 0;
      const voteB = b.voteCount || 0;

      // First sort by votes (descending)
      if (voteB !== voteA) {
        return voteB - voteA;
      }

      // If votes are equal, sort by name
      return a.name.localeCompare(b.name);
    });

  const topChoice = sortedCandidates[0];

  const handleVoteClick = async (candidateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onVote) {
      onVote(candidateId);
    }
  };

  const handleDownvoteClick = async (candidateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownvote) {
      onDownvote(candidateId);
    }
  };

  if (candidates.length === 0) {
    return (
      <div className="p-4 text-center py-12 text-neutral-500">
        <Heart className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
        <p className="text-sm font-medium">No venues added yet</p>
        <p className="text-xs">Save venues from search results to see them here</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 space-y-2">
      {/* Top Choice Banner - Compact */}
      {topChoice && topChoice.voteCount && topChoice.voteCount > 0 && (
        <div className="bg-black text-white border-2 border-black p-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-white flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-white text-xs truncate">{topChoice.name}</h4>
                <div className="flex items-center gap-0.5 text-white flex-shrink-0">
                  <Heart className="w-3 h-3 fill-white" />
                  <span className="text-xs font-bold">{topChoice.voteCount}</span>
                </div>
              </div>
              {topChoice.vicinity && (
                <p className="text-xs text-gray-300 truncate">{topChoice.vicinity}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Venue List - Ultra-compact 2-line cards */}
      <div className="space-y-0.5 max-h-96 overflow-y-auto">
        {sortedCandidates.map((candidate, index) => {
          const isTopChoice = index === 0 && candidate.voteCount && candidate.voteCount > 0;
          const isSelected = selectedCandidate?.id === candidate.id;
          const voteCount = candidate.voteCount || 0;
          const hasUserVoted = myVotedCandidateIds.has(candidate.id);
          const assignedColor = candidateColors?.get(candidate.id) || '#ef4444';

          return (
            <div
              key={candidate.id}
              ref={(el) => { candidateRefs.current[candidate.id] = el; }}
              onClick={() => onCandidateClick(candidate)}
              className={`relative p-1.5 border-2 cursor-pointer transition-all overflow-hidden ${
                isSelected
                  ? 'bg-black text-white border-black'
                  : 'bg-white border-black hover:bg-gray-100'
              }`}
            >
              {/* Line 1: Name + Trophy (if top) + Rating + Distance */}
              <div className="relative z-10 flex items-center justify-between gap-1 mb-0.5">
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  {isTopChoice && <Trophy className={`w-3 h-3 flex-shrink-0 ${
                    isSelected ? 'text-white' : 'text-black'
                  }`} />}
                  <h5 className={`font-semibold text-xs truncate ${
                    isSelected ? 'text-white' : 'text-neutral-900'
                  }`}>
                    {candidate.name}
                  </h5>
                </div>
                <div className="flex items-center gap-1.5 text-xs flex-shrink-0">
                  {candidate.rating && (
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-black">
                        {candidate.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                  {candidate.distanceFromCenter !== undefined && (
                    <div className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-black" />
                      <span className="text-black">
                        {(candidate.distanceFromCenter / 1000).toFixed(1)}km
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Line 2: Address + Vote/Remove */}
              <div className="relative z-10 flex items-center justify-between gap-1">
                <p className={`text-xs truncate flex-1 ${
                  isSelected ? 'text-gray-300' : 'text-neutral-500'
                }`}>
                  {candidate.vicinity || 'No address'}
                </p>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Upvote button */}
                  {participantId && onVote && (
                    <button
                      onClick={(e) => handleVoteClick(candidate.id, e)}
                      className={`p-0.5 border border-black transition-colors ${
                        isSelected
                          ? 'bg-white text-black hover:bg-gray-200'
                          : 'bg-white hover:bg-gray-100'
                      }`}
                      title={hasUserVoted ? 'Remove vote' : 'Vote'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${
                        hasUserVoted ? 'fill-black text-black' : 'text-neutral-400'
                      }`} />
                    </button>
                  )}

                  {/* Vote count */}
                  <span className={`text-xs font-bold min-w-[1.5rem] text-center ${
                    isSelected ? 'text-white' : 'text-black'
                  }`}>
                    {voteCount}
                  </span>

                  {/* Downvote button */}
                  {participantId && onDownvote && (
                    <button
                      onClick={(e) => handleDownvoteClick(candidate.id, e)}
                      className={`p-0.5 border border-black transition-colors ${
                        isSelected
                          ? 'bg-white text-black hover:bg-gray-200'
                          : 'bg-white hover:bg-gray-100'
                      }`}
                      title="Downvote"
                    >
                      <Heart className="w-3.5 h-3.5 fill-black text-black rotate-180" />
                    </button>
                  )}

                  {/* Remove button (host only) */}
                  {isHost && onRemoveCandidate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveCandidate(candidate.id);
                      }}
                      className={`p-0.5 border border-black transition-colors ${
                        isSelected
                          ? 'bg-white text-black hover:bg-gray-200'
                          : 'bg-white text-black hover:bg-gray-100'
                      }`}
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Color tag - Rightmost with angled left edge (similar to participant list) */}
              <div
                className="absolute right-0 top-0 bottom-0 w-[30%] flex-shrink-0 z-0"
                style={{
                  backgroundColor: assignedColor,
                  clipPath: 'polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%)',
                }}
                title={`Map marker color: ${assignedColor}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
