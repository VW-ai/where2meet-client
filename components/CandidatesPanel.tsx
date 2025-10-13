'use client';

import { useState } from 'react';
import { Candidate, SortMode } from '@/types';

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
}: CandidatesPanelProps) {
  const getGoogleMapsUrl = (candidate: Candidate, origin?: { lat: number; lng: number }) => {
    const dest = `${candidate.lat},${candidate.lng}`;
    if (origin) {
      return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${dest}&query_place_id=${candidate.placeId}`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Search Venues</h2>

      {/* Search Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Venue Type
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder="e.g., restaurant, cafe, basketball court"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          />
          <button
            onClick={onSearch}
            disabled={isSearching || !keyword.trim()}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Sort Controls */}
      {candidates.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => onSortChange('rating')}
              className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                sortMode === 'rating'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Rating
            </button>
            <button
              onClick={() => onSortChange('distance')}
              className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                sortMode === 'distance'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Distance
            </button>
          </div>
        </div>
      )}

      {/* Candidates List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Candidate Venues ({candidates.length})
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {candidates.length === 0 ? (
            <p className="text-gray-500 text-sm italic">
              No venues found. Add at least 2 locations and search for a venue type.
            </p>
          ) : (
            candidates.map((candidate) => (
              <div
                key={candidate.id}
                onClick={() => onCandidateClick(candidate)}
                className={`p-4 rounded-md cursor-pointer transition-all ${
                  selectedCandidate?.id === candidate.id
                    ? 'bg-red-100 border-2 border-red-500'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{candidate.name}</h4>
                    {candidate.vicinity && (
                      <p className="text-sm text-gray-600 mt-1">{candidate.vicinity}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm">
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
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <a
                    href={getGoogleMapsUrl(candidate)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View on Maps
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
