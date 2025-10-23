'use client';

import { useState, useEffect, useRef } from 'react';
import { Candidate, SortMode } from '@/types';
import EmptyState from './EmptyState';
import VenuePhoto from './VenuePhoto';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

interface CandidatesPanelProps {
  candidates: Candidate[];
  selectedCandidate: Candidate | null;
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  onCandidateClick: (candidate: Candidate) => void;
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  onSearch: () => void;
  isSearching: boolean;
  onVote?: (candidateId: string) => void;
  participantId?: string;
  onRemoveCandidate?: (candidateId: string) => void;
  onSaveCandidate?: (candidateId: string) => void;
  isHost?: boolean;
  onlyInCircle?: boolean;
  onOnlyInCircleChange?: (value: boolean) => void;
}

export default function CandidatesPanel({
  candidates,
  selectedCandidate,
  sortMode,
  onSortChange,
  onCandidateClick,
  keyword,
  onKeywordChange,
  onSearch,
  isSearching,
  onVote,
  participantId,
  onRemoveCandidate,
  onSaveCandidate,
  isHost,
  onlyInCircle,
  onOnlyInCircleChange,
}: CandidatesPanelProps) {
  const selectedRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Auto-scroll to selected candidate when it changes
  useEffect(() => {
    if (selectedCandidate && selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [selectedCandidate]);
  const getGoogleMapsUrl = (candidate: Candidate, origin?: { lat: number; lng: number }) => {
    const dest = `${candidate.lat},${candidate.lng}`;
    if (origin) {
      return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${dest}&query_place_id=${candidate.placeId}`;
  };

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* Search Input - Only show if no results */}
      {candidates.length === 0 && (
        <>
          <div className="flex-shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={keyword}
                onChange={(e) => onKeywordChange(e.target.value)}
                placeholder="Search venues..."
                className="flex-1 px-3 py-2 text-black bg-white border border-black/10 rounded focus:ring-2 focus:ring-[#08c605] focus:border-[#08c605] outline-none"
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              />
              <button
                onClick={onSearch}
                disabled={isSearching || !keyword.trim()}
                className={`px-5 py-2 text-white font-medium rounded transition-all ${
                  isSearching
                    ? 'bg-[#08c605] animate-pulse cursor-wait'
                    : 'bg-[#08c605] hover:bg-[#06a004] disabled:bg-gray-300 disabled:cursor-not-allowed'
                }`}
              >
                {isSearching ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </div>

          {/* MEC Circle Filter Toggle */}
          {onOnlyInCircleChange && (
            <div className="flex-shrink-0">
              <label className="flex items-center gap-2 cursor-pointer bg-white border border-black/10 rounded px-3 py-2">
                <input
                  type="checkbox"
                  checked={onlyInCircle ?? true}
                  onChange={(e) => onOnlyInCircleChange(e.target.checked)}
                  className="w-4 h-4 border-gray-300 rounded focus:ring-[#08c605]"
                  style={{ accentColor: '#08c605' }}
                />
                <span className="text-sm text-black">
                  {onlyInCircle ? 'In circle' : 'All results'}
                </span>
              </label>
            </div>
          )}
        </>
      )}

      {/* Sort Controls */}
      {candidates.length > 0 && (
        <div className="flex-shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => onSortChange('rating')}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-colors ${
                sortMode === 'rating'
                  ? 'bg-[#08c605] text-white'
                  : 'bg-white text-black border border-black/10 hover:bg-gray-50'
              }`}
            >
              ★ Rating
            </button>
            <button
              onClick={() => onSortChange('distance')}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-colors ${
                sortMode === 'distance'
                  ? 'bg-[#08c605] text-white'
                  : 'bg-white text-black border border-black/10 hover:bg-gray-50'
              }`}
            >
              📍 Distance
            </button>
            <button
              onClick={() => onSortChange('vote')}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-colors ${
                sortMode === 'vote'
                  ? 'bg-[#08c605] text-white'
                  : 'bg-white text-black border border-black/10 hover:bg-gray-50'
              }`}
            >
              🗳️ Votes
            </button>
          </div>
        </div>
      )}

      {/* Candidates List */}
      <div className="flex-1 flex flex-col min-h-0">
        {candidates.length > 0 && (
          <div className="text-xs text-gray-400 mb-2">
            {candidates.length} {candidates.length === 1 ? 'venue' : 'venues'}
          </div>
        )}
        <div className="space-y-2 flex-1 overflow-y-auto">
          {candidates.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="No Venues Found"
              message="Search by keyword to discover meeting venues in the area"
              suggestions={["coffee", "restaurant", "park", "cinema", "gym"]}
            />
          ) : (
            candidates.map((candidate) => (
              <div
                key={candidate.id}
                ref={selectedCandidate?.id === candidate.id ? selectedRef : null}
                onClick={() => onCandidateClick(candidate)}
                className={`p-2 rounded cursor-pointer transition-all ${
                  selectedCandidate?.id === candidate.id
                    ? 'bg-[#08c605]/10 border-2 border-[#08c605]'
                    : 'bg-white hover:bg-gray-50 border border-black/10'
                }`}
              >
                <div className="flex gap-2">
                  {/* Venue Photo */}
                  <VenuePhoto
                    photoReference={candidate.photoReference}
                    venueName={candidate.name}
                    className="w-14 h-14 rounded flex-shrink-0"
                  />

                  {/* Venue Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-black text-xs truncate">{candidate.name}</h4>
                    <div className="flex items-center gap-2 mt-1 text-xs flex-wrap">
                      {candidate.rating && (
                        <span className="flex items-center gap-0.5 text-[#08c605] font-medium">
                          ★ {candidate.rating.toFixed(1)}
                        </span>
                      )}
                      {candidate.distanceFromCenter && (
                        <span className="text-gray-400">
                          {(candidate.distanceFromCenter / 1000).toFixed(1)}km
                        </span>
                      )}
                      {onVote && candidate.voteCount !== undefined && candidate.voteCount > 0 && (
                        <span className="text-[#08c605] font-medium">
                          🗳️ {candidate.voteCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex gap-1.5 flex-wrap">
                  <a
                    href={getGoogleMapsUrl(candidate)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-black text-white text-xs font-medium rounded hover:bg-gray-800 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Maps
                  </a>
                  {onSaveCandidate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSaveCandidate(candidate.id);
                      }}
                      className="px-2.5 py-1 bg-[#08c605] text-white text-xs font-medium rounded hover:bg-[#06a004] transition-colors"
                    >
                      Save
                    </button>
                  )}
                  {onVote && participantId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onVote(candidate.id);
                      }}
                      className="px-2.5 py-1 bg-[#08c605] text-white text-xs font-medium rounded hover:bg-[#06a004] transition-colors"
                    >
                      Vote
                    </button>
                  )}
                  {isHost && onRemoveCandidate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Remove ${candidate.name}?`)) {
                          onRemoveCandidate(candidate.id);
                        }
                      }}
                      className="px-2.5 py-1 bg-black text-white text-xs font-medium rounded hover:bg-gray-800 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
