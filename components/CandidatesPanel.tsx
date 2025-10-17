'use client';

import { useState, useEffect, useRef } from 'react';
import { Candidate, SortMode } from '@/types';
import EmptyState from './EmptyState';
import { useTranslation } from '@/lib/i18n';

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
  const t = useTranslation();

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
      <h2 className="text-base font-bold text-gray-900">Search Venues</h2>

      {/* Search Input */}
      <div className="flex-shrink-0">
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Venue Type
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder="e.g., restaurant, cafe, basketball court"
            className="flex-1 px-4 py-2 text-gray-900 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          />
          <button
            onClick={onSearch}
            disabled={isSearching || !keyword.trim()}
            className={`px-6 py-2 text-white font-medium rounded-md transition-all ${
              isSearching
                ? 'bg-blue-600 animate-pulse cursor-wait'
                : 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
            }`}
          >
            {isSearching ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="font-bold">Searching...</span>
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
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyInCircle ?? true}
                onChange={(e) => onOnlyInCircleChange(e.target.checked)}
                className="w-5 h-5 mt-0.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🔵</span>
                  <span className="text-sm font-bold text-gray-900">
                    {t.onlyInCircle}
                  </span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed mb-2">
                  {t.onlyInCircleDescription}
                </p>
                <div className="flex items-start gap-1.5 bg-purple-100 border border-purple-300 rounded-md px-2 py-1.5">
                  <span className="text-xs mt-0.5">💡</span>
                  <p className="text-xs text-purple-900 leading-relaxed">
                    <strong>What's this?</strong> The purple circle on the map shows the optimal meeting area.
                    When checked, search results will only include venues inside this circle.
                    Uncheck to see all nearby venues.
                  </p>
                </div>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Sort Controls */}
      {candidates.length > 0 && (
        <div className="flex-shrink-0">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Sort By
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => onSortChange('rating')}
              className={`flex-1 px-4 py-2 font-medium rounded-md transition-colors ${
                sortMode === 'rating'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              Rating
            </button>
            <button
              onClick={() => onSortChange('distance')}
              className={`flex-1 px-4 py-2 font-medium rounded-md transition-colors ${
                sortMode === 'distance'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              Distance
            </button>
            <button
              onClick={() => onSortChange('vote')}
              className={`flex-1 px-4 py-2 font-medium rounded-md transition-colors ${
                sortMode === 'vote'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              Votes
            </button>
          </div>
        </div>
      )}

      {/* Candidates List */}
      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Candidate Venues ({candidates.length})
        </h3>
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
                className={`p-3 rounded-md cursor-pointer transition-all ${
                  selectedCandidate?.id === candidate.id
                    ? 'bg-red-100 border-2 border-red-600'
                    : 'bg-white hover:bg-gray-100 border-2 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{candidate.name}</h4>
                    {candidate.vicinity && (
                      <p className="text-sm text-gray-700 mt-1">{candidate.vicinity}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm flex-wrap">
                      {candidate.rating && (
                        <span className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="font-medium">{candidate.rating.toFixed(1)}</span>
                          {candidate.userRatingsTotal && (
                            <span className="text-gray-500">
                              ({candidate.userRatingsTotal})
                            </span>
                          )}
                        </span>
                      )}
                      {candidate.distanceFromCenter && (
                        <span className="text-gray-600">
                          {(candidate.distanceFromCenter / 1000).toFixed(2)} km
                        </span>
                      )}
                      {candidate.openNow !== undefined && (
                        <span
                          className={
                            candidate.openNow ? 'text-green-600' : 'text-red-600'
                          }
                        >
                          {candidate.openNow ? 'Open Now' : 'Closed'}
                        </span>
                      )}
                      {onVote && candidate.voteCount !== undefined && (
                        <span className="flex items-center gap-1 font-medium text-purple-600">
                          🗳️ {candidate.voteCount} {candidate.voteCount === 1 ? 'vote' : 'votes'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <a
                    href={getGoogleMapsUrl(candidate)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View on Maps
                  </a>
                  {onSaveCandidate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSaveCandidate(candidate.id);
                      }}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors"
                    >
                      💾 Save
                    </button>
                  )}
                  {onVote && participantId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onVote(candidate.id);
                      }}
                      className="px-3 py-1 bg-purple-500 text-white text-sm rounded-md hover:bg-purple-600 transition-colors"
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
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"
                    >
                      Remove
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
