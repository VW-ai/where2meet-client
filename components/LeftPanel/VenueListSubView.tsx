'use client';

import { Trophy, Heart, MapPin, Star, Trash2 } from 'lucide-react';
import { Candidate } from '@/types';

interface VenueListSubViewProps {
  candidates: Candidate[];
  selectedCandidate: Candidate | null;
  onCandidateClick: (candidate: Candidate) => void;
  onVote?: (candidateId: string) => void;
  participantId?: string;
  onRemoveCandidate?: (candidateId: string) => void;
  isHost: boolean;
}

export default function VenueListSubView({
  candidates,
  selectedCandidate,
  onCandidateClick,
  onVote,
  participantId,
  onRemoveCandidate,
  isHost,
}: VenueListSubViewProps) {

  // Sort by vote count (highest first)
  const sortedCandidates = [...candidates].sort((a, b) => {
    const voteA = a.voteCount || 0;
    const voteB = b.voteCount || 0;
    return voteB - voteA;
  });

  const topChoice = sortedCandidates[0];

  const handleVoteClick = async (candidateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onVote) {
      onVote(candidateId);
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
    <div className="p-4 space-y-3">
      {/* Top Choice Banner */}
      {topChoice && topChoice.voteCount && topChoice.voteCount > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-600 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Trophy className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">
                Top Choice
              </p>
              <h4 className="font-bold text-neutral-900 text-base">{topChoice.name}</h4>
              {topChoice.vicinity && (
                <p className="text-xs text-neutral-600 mt-1">{topChoice.vicinity}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                {topChoice.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium text-neutral-700">
                      {topChoice.rating.toFixed(1)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-700">
                    {topChoice.voteCount} {topChoice.voteCount === 1 ? 'vote' : 'votes'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Venue List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sortedCandidates.map((candidate, index) => {
          const isTopChoice = index === 0 && candidate.voteCount && candidate.voteCount > 0;
          const isSelected = selectedCandidate?.id === candidate.id;
          const voteCount = candidate.voteCount || 0;

          return (
            <div
              key={candidate.id}
              onClick={() => onCandidateClick(candidate)}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'bg-emerald-50 border-emerald-600 shadow-md'
                  : isTopChoice
                  ? 'bg-emerald-50/50 border-emerald-300 hover:border-emerald-400'
                  : 'bg-white border-neutral-200 hover:border-emerald-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-start gap-2">
                    {isTopChoice && (
                      <Trophy className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h5 className="font-semibold text-neutral-900 text-sm">{candidate.name}</h5>
                      {candidate.vicinity && (
                        <p className="text-xs text-neutral-600 mt-0.5">{candidate.vicinity}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {participantId && onVote && (
                    <button
                      onClick={(e) => handleVoteClick(candidate.id, e)}
                      className="p-2 hover:bg-emerald-100 rounded-full transition-colors"
                      title="Vote for this venue"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          voteCount > 0 ? 'fill-emerald-600 text-emerald-600' : 'text-neutral-400'
                        }`}
                      />
                    </button>
                  )}
                  {isHost && onRemoveCandidate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveCandidate(candidate.id);
                      }}
                      className="p-2 hover:bg-red-100 text-neutral-400 hover:text-red-600 rounded-full transition-colors"
                      title="Remove from list"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                {candidate.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-neutral-700">{candidate.rating.toFixed(1)}</span>
                    {candidate.userRatingsTotal && (
                      <span className="text-neutral-500">({candidate.userRatingsTotal})</span>
                    )}
                  </div>
                )}
                {candidate.distanceFromCenter !== undefined && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-neutral-500" />
                    <span className="text-neutral-600">
                      {(candidate.distanceFromCenter / 1000).toFixed(2)} km
                    </span>
                  </div>
                )}
                {voteCount > 0 && (
                  <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <Heart className="w-3 h-3 fill-emerald-600" />
                    <span>{voteCount}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
