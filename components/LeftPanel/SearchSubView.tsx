'use client';

import { Search, MapPin, Star, Heart, RefreshCw, Utensils, Coffee, Beer, Trees, Dumbbell, Film, Navigation, Info } from 'lucide-react';
import { Candidate, SortMode } from '@/types';
import { useRef, useEffect, useState } from 'react';

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
  { label: 'Restaurant', value: 'restaurant', Icon: Utensils },
  { label: 'Cafe', value: 'cafe', Icon: Coffee },
  { label: 'Bar', value: 'bar', Icon: Beer },
  { label: 'Park', value: 'park', Icon: Trees },
  { label: 'Gym', value: 'gym', Icon: Dumbbell },
  { label: 'Cinema', value: 'movie_theater', Icon: Film },
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

  const inputRef = useRef<HTMLInputElement>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  // Wait for Google Maps Places library to load
  useEffect(() => {
    const checkGoogleLoaded = () => {
      if (typeof window !== 'undefined' && window.google?.maps?.places?.Autocomplete) {
        setIsGoogleLoaded(true);
      } else {
        setTimeout(checkGoogleLoaded, 100);
      }
    };
    checkGoogleLoaded();
  }, []);

  // Initialize Google Places Autocomplete for name search
  useEffect(() => {
    if (searchType !== 'name' || !inputRef.current || !isGoogleLoaded) {
      // Clear autocomplete if switching away from name search
      if (autocomplete) {
        google.maps.event.clearInstanceListeners(autocomplete);
        setAutocomplete(null);
      }
      return;
    }

    // Initialize Autocomplete
    const autocompleteInstance = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['establishment'], // Focus on places/venues
      fields: ['place_id', 'name', 'formatted_address', 'geometry'],
    });

    // Listen for place selection
    autocompleteInstance.addListener('place_changed', () => {
      const place = autocompleteInstance.getPlace();

      if (place.name) {
        // Update keyword with selected place name
        onKeywordChange(place.name);
      }
    });

    setAutocomplete(autocompleteInstance);

    return () => {
      if (autocompleteInstance) {
        google.maps.event.clearInstanceListeners(autocompleteInstance);
      }
    };
  }, [searchType, isGoogleLoaded, onKeywordChange]);

  const handleCategoryClick = (category: string) => {
    onKeywordChange(category);
  };

  const handleVoteClick = async (candidateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Voting also saves the candidate (adds it to the saved list)
    if (onSaveCandidate) {
      onSaveCandidate(candidateId);
    }
    if (onVote) {
      onVote(candidateId);
    }
  };

  return (
    <div className="px-4 py-3 space-y-2">
      {/* Search Type Toggle - techno black/white */}
      <div className="flex gap-0 border-2 border-black">
        <button
          onClick={() => onSearchTypeChange('type')}
          className={`flex-1 p-2 text-xs font-bold transition-all border-r-2 border-black ${
            searchType === 'type'
              ? 'bg-black text-white'
              : 'bg-white text-black hover:bg-gray-100'
          }`}
          title="Search by type"
        >
          <Utensils className="w-4 h-4 mx-auto" />
        </button>
        <button
          onClick={() => onSearchTypeChange('name')}
          className={`flex-1 p-2 text-xs font-bold transition-all ${
            searchType === 'name'
              ? 'bg-black text-white'
              : 'bg-white text-black hover:bg-gray-100'
          }`}
          title="Search by name"
        >
          <Search className="w-4 h-4 mx-auto" />
        </button>
      </div>

      {/* Search Input - sharp borders */}
      <div className="flex gap-1">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black" />
          <input
            ref={inputRef}
            type="text"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder={searchType === 'type' ? 'restaurant' : (isGoogleLoaded ? 'Joe\'s Pizza' : 'Loading...')}
            disabled={searchType === 'name' && !isGoogleLoaded}
            className="w-full pl-8 pr-2 py-1.5 text-xs text-black border-2 border-black focus:border-black outline-none disabled:bg-gray-100 disabled:cursor-wait placeholder:text-gray-400"
          />
        </div>
        <button
          onClick={onSearch}
          disabled={isSearching || !keyword.trim()}
          className={`p-1.5 border-2 border-black transition-all ${
            isSearching || !keyword.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-black text-white hover:bg-gray-900'
          }`}
          title="Search"
        >
          {isSearching ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Category Chips - techno black/white style */}
      {searchType === 'type' && (
        <div className="flex flex-wrap gap-1">
          {CATEGORY_CHIPS.map((chip) => {
            const Icon = chip.Icon;
            return (
              <button
                key={chip.value}
                onClick={() => handleCategoryClick(chip.value)}
                className={`flex items-center gap-1 px-2 py-1 text-xs border-2 border-black transition-all ${
                  keyword === chip.value
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
                title={chip.label}
              >
                <Icon className="w-3 h-3" />
                <span className="text-xs font-bold">{chip.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Sort & Filter - Compact icon buttons with techno styling */}
      <div className="flex items-center justify-between gap-2">
        {/* Sort buttons - techno black/white style */}
        <div className="flex gap-1">
          <button
            onClick={() => onSortChange('rating')}
            className={`p-1.5 border-2 border-black transition-all ${
              sortMode === 'rating'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
            title="Sort by rating"
          >
            <Star className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSortChange('distance')}
            className={`p-1.5 border-2 border-black transition-all ${
              sortMode === 'distance'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
            title="Sort by distance"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSortChange('vote')}
            className={`p-1.5 border-2 border-black transition-all ${
              sortMode === 'vote'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
            title="Sort by votes"
          >
            <Heart className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Circle filter - checkbox with info tooltip only */}
        <div className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={onlyInCircle}
            onChange={(e) => onOnlyInCircleChange(e.target.checked)}
            className="w-3.5 h-3.5 border-2 border-black cursor-pointer accent-black"
          />
          <div className="group relative">
            <Info className="w-3.5 h-3.5 text-black cursor-help" />
            <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-56 px-2 py-1.5 bg-black text-white text-xs border-2 border-black shadow-lg z-10">
              Filter results to the search area circle on map (based on all participants' locations)
            </div>
          </div>
        </div>
      </div>

      {/* Results - Ultra compact 2-line cards */}
      <div className="space-y-0.5 max-h-96 overflow-y-auto">
        {candidates.length === 0 ? (
          <div className="text-center py-6 text-neutral-400">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">No results</p>
          </div>
        ) : (
          candidates.map((candidate) => {
            const hasVoted = candidate.voteCount && candidate.voteCount > 0;
            const isSelected = selectedCandidate?.id === candidate.id;

            return (
              <div
                key={candidate.id}
                onClick={() => onCandidateClick(candidate)}
                className={`p-1.5 border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-black text-white border-black'
                    : 'bg-white border-black hover:bg-gray-100'
                }`}
              >
                {/* Line 1: Name + Rating + Distance */}
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <h5 className={`font-semibold text-xs truncate flex-1 ${
                    isSelected ? 'text-white' : 'text-neutral-900'
                  }`}>
                    {candidate.name}
                  </h5>
                  <div className="flex items-center gap-1.5 text-xs flex-shrink-0">
                    {candidate.rating && (
                      <div className="flex items-center gap-0.5">
                        <Star className={`w-3 h-3 ${
                          isSelected ? 'fill-white text-white' : 'fill-yellow-400 text-yellow-400'
                        }`} />
                        <span className={`font-medium ${
                          isSelected ? 'text-white' : 'text-neutral-700'
                        }`}>{candidate.rating.toFixed(1)}</span>
                      </div>
                    )}
                    {candidate.distanceFromCenter !== undefined && (
                      <div className="flex items-center gap-0.5">
                        <MapPin className={`w-3 h-3 ${
                          isSelected ? 'text-white' : 'text-neutral-500'
                        }`} />
                        <span className={isSelected ? 'text-white' : 'text-neutral-600'}>
                          {(candidate.distanceFromCenter / 1000).toFixed(1)}km
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Line 2: Address + Vote/Add */}
                <div className="flex items-center justify-between gap-1">
                  <p className={`text-xs truncate flex-1 ${
                    isSelected ? 'text-gray-300' : 'text-neutral-500'
                  }`}>
                    {candidate.vicinity || 'No address'}
                  </p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {hasVoted && (
                      <div className={`flex items-center gap-0.5 text-xs font-semibold ${
                        isSelected ? 'text-white' : 'text-black'
                      }`}>
                        <Heart className={`w-3 h-3 ${
                          isSelected ? 'fill-white' : 'fill-black'
                        }`} />
                        <span>{candidate.voteCount}</span>
                      </div>
                    )}
                    {participantId && onVote && (
                      <button
                        onClick={(e) => handleVoteClick(candidate.id, e)}
                        className={`p-0.5 border border-black transition-colors ${
                          isSelected
                            ? 'bg-white text-black hover:bg-gray-200'
                            : 'bg-white hover:bg-gray-100'
                        }`}
                        title="Save and Vote"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            hasVoted ? 'fill-black text-black' : 'text-neutral-400'
                          }`}
                        />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
