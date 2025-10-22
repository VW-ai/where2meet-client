'use client';

import { Search, ArrowUpDown, MapPin, Star, Heart, Plus, RefreshCw } from 'lucide-react';
import { Candidate, SortMode } from '@/types';

interface SearchSubViewProps {
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  onSearch: () => void;
  isSearching: boolean;
  searchType: 'type' | 'name';
  onSearchTypeChange: (type: 'type' | 'name') => void;
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  onlyInCircle: boolean;
  onOnlyInCircleChange: (value: boolean) => void;
  candidates: Candidate[];
  selectedCandidate: Candidate | null;
  onCandidateClick: (candidate: Candidate) => void;
  onVote?: (candidateId: string) => void;
  participantId?: string;
  onSaveCandidate?: (candidateId: string) => void;
  isHost: boolean;
  hasAutoSearched: boolean;
}

const CATEGORY_CHIPS = [
  { label: 'Restaurant', value: 'restaurant', icon: '🍽️' },
  { label: 'Cafe', value: 'cafe', icon: '☕' },
  { label: 'Bar', value: 'bar', icon: '🍺' },
  { label: 'Park', value: 'park', icon: '🌳' },
  { label: 'Gym', value: 'gym', icon: '💪' },
  { label: 'Cinema', value: 'movie_theater', icon: '🎬' },
];

export default function SearchSubView({
  keyword,
  onKeywordChange,
  onSearch,
  isSearching,
  searchType,
  onSearchTypeChange,
  sortMode,
  onSortChange,
  onlyInCircle,
  onOnlyInCircleChange,
  candidates,
  selectedCandidate,
  onCandidateClick,
  onVote,
  participantId,
  onSaveCandidate,
  isHost,
  hasAutoSearched,
}: SearchSubViewProps) {

  const handleCategoryClick = (category: string) => {
    onKeywordChange(category);
  };

  const handleVoteClick = async (candidateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onVote) {
      onVote(candidateId);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Search Type Toggle */}
      <div className="flex gap-2 p-1 bg-neutral-100 rounded-lg">
        <button
          onClick={() => onSearchTypeChange('type')}
          className={`flex-1 px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
            searchType === 'type'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          By Type
        </button>
        <button
          onClick={() => onSearchTypeChange('name')}
          className={`flex-1 px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
            searchType === 'name'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          By Name
        </button>
      </div>

      {/* Search Input */}
      <div>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              placeholder={searchType === 'type' ? 'e.g., restaurant, cafe' : 'e.g., Joe\'s Pizza'}
              className="w-full pl-10 pr-4 py-2 text-neutral-900 border-2 border-neutral-300 rounded-md focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>
          <button
            onClick={onSearch}
            disabled={isSearching || !keyword.trim()}
            className={`px-4 py-2 text-white font-semibold rounded-md transition-all ${
              isSearching
                ? 'bg-emerald-600 cursor-wait'
                : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-400 disabled:cursor-not-allowed'
            }`}
          >
            {isSearching ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : hasAutoSearched ? (
              <RefreshCw className="w-5 h-5" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Category Chips (only show when search type is 'type') */}
        {searchType === 'type' && (
          <div className="flex flex-wrap gap-2 mt-3">
            {CATEGORY_CHIPS.map((chip) => (
              <button
                key={chip.value}
                onClick={() => handleCategoryClick(chip.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  keyword === chip.value
                    ? 'bg-emerald-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sort & Filter */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <ArrowUpDown className="w-4 h-4 text-neutral-600" />
          <span className="text-sm font-medium text-neutral-700">Sort:</span>
          <div className="flex gap-1">
            <button
              onClick={() => onSortChange('rating')}
              className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
                sortMode === 'rating'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Rating
            </button>
            <button
              onClick={() => onSortChange('distance')}
              className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
                sortMode === 'distance'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Distance
            </button>
            <button
              onClick={() => onSortChange('vote')}
              className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
                sortMode === 'vote'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Votes
            </button>
          </div>
        </div>
      </div>

      {/* Circle Filter */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={onlyInCircle}
          onChange={(e) => onOnlyInCircleChange(e.target.checked)}
          className="w-4 h-4 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500"
        />
        <span className="text-sm font-medium text-neutral-700">Only show within circle</span>
      </label>

      {/* Results */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-neutral-900">
            Results ({candidates.length})
          </h4>
        </div>

        {candidates.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <Search className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
            <p className="text-sm font-medium">No results yet</p>
            <p className="text-xs">Try searching for venues</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {candidates.map((candidate) => {
              const hasVoted = candidate.voteCount && candidate.voteCount > 0;
              const isSelected = selectedCandidate?.id === candidate.id;

              return (
                <div
                  key={candidate.id}
                  onClick={() => onCandidateClick(candidate)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-600 shadow-md'
                      : 'bg-white border-neutral-200 hover:border-emerald-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h5 className="font-semibold text-neutral-900 text-sm">{candidate.name}</h5>
                      {candidate.vicinity && (
                        <p className="text-xs text-neutral-600 mt-0.5">{candidate.vicinity}</p>
                      )}
                    </div>
                    {participantId && onVote && (
                      <button
                        onClick={(e) => handleVoteClick(candidate.id, e)}
                        className="ml-2 p-2 hover:bg-emerald-100 rounded-full transition-colors"
                        title="Vote for this venue"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            hasVoted ? 'fill-emerald-600 text-emerald-600' : 'text-neutral-400'
                          }`}
                        />
                      </button>
                    )}
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
                    {hasVoted && (
                      <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                        <Heart className="w-3 h-3 fill-emerald-600" />
                        <span>{candidate.voteCount}</span>
                      </div>
                    )}
                  </div>

                  {onSaveCandidate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSaveCandidate(candidate.id);
                      }}
                      className="mt-2 w-full px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add to List
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
