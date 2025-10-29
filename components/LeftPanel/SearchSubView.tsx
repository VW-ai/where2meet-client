'use client';

import { Search, MapPin, Star, Heart, RefreshCw, Utensils, Coffee, Beer, Trees, Dumbbell, Film, Navigation, Info } from 'lucide-react';
import { Candidate, SortMode } from '@/types';
import { useRef, useEffect, useState, useCallback } from 'react';

interface SearchSubViewProps {
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  onSearch: () => void;
  isSearching: boolean;
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  onlyInCircle: boolean;
  onOnlyInCircleChange: (value: boolean) => void;
  candidates: Candidate[];
  selectedCandidate: Candidate | null;
  onCandidateClick: (candidate: Candidate) => void;
  onVote?: (candidateId: string) => void;
  participantId?: string;
  myVotedCandidateIds: Set<string>;
  onSaveCandidate?: (candidateId: string) => void;
  isHost: boolean;
  hasAutoSearched: boolean;
  onAddVenueFromAutocomplete?: (place: {
    place_id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    rating?: number;
  }) => Promise<void>;
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
  sortMode,
  onSortChange,
  onlyInCircle,
  onOnlyInCircleChange,
  candidates,
  selectedCandidate,
  onCandidateClick,
  onVote,
  participantId,
  myVotedCandidateIds,
  onSaveCandidate,
  isHost,
  hasAutoSearched,
  onAddVenueFromAutocomplete,
}: SearchSubViewProps) {

  // Refs for auto-scroll functionality
  const candidateRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Google Places Autocomplete for keyword input
  const keywordInputRef = useRef<HTMLInputElement>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  // Track place_id from autocomplete for auto-selection after search
  const pendingAutoSelectRef = useRef<string | null>(null);
  const latestCandidatesRef = useRef<Candidate[]>(candidates);
  const latestOnCandidateClickRef = useRef(onCandidateClick);

  useEffect(() => {
    latestCandidatesRef.current = candidates;
  }, [candidates]);

  useEffect(() => {
    latestOnCandidateClickRef.current = onCandidateClick;
  }, [onCandidateClick]);

  const ensurePlaceHasGeometry = useCallback(async (rawPlace: google.maps.places.PlaceResult | undefined) => {
    if (!rawPlace) {
      return null;
    }

    if (rawPlace.geometry?.location) {
      return rawPlace;
    }

    if (!rawPlace.place_id) {
      return null;
    }

    // PlacesService should already be initialized eagerly in the Google load effect
    if (!placesServiceRef.current) {
      console.error('❌ PlacesService not initialized - this should not happen');
      return null;
    }

    console.log('🔍 Fetching full place details via PlacesService...');
    return new Promise<google.maps.places.PlaceResult | null>((resolve) => {
      placesServiceRef.current!.getDetails(
        {
          placeId: rawPlace.place_id!,
          fields: ['name', 'place_id', 'geometry', 'formatted_address', 'rating'],
        },
        (result, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && result) {
            resolve(result);
          } else {
            console.error('❌ Failed to fetch full place details:', status, rawPlace.place_id);
            resolve(null);
          }
        }
      );
    });
  }, []);

  // Wait for Google Maps Places library to load
  useEffect(() => {
    const checkGoogleLoaded = () => {
      if (typeof window !== 'undefined' && window.google?.maps?.places?.Autocomplete) {
        setIsGoogleLoaded(true);

        // Initialize PlacesService EAGERLY (not lazily) to avoid timing issues
        // This ensures it's ready when ensurePlaceHasGeometry needs it
        if (!placesServiceRef.current && window.google?.maps?.places?.PlacesService) {
          placesServiceRef.current = new google.maps.places.PlacesService(document.createElement('div'));
          console.log('✅ PlacesService initialized eagerly');
        }
      } else {
        setTimeout(checkGoogleLoaded, 100);
      }
    };
    checkGoogleLoaded();
  }, []);

  // Initialize Google Places Autocomplete for keyword input
  useEffect(() => {
    if (!keywordInputRef.current || !isGoogleLoaded) {
      return;
    }

    const inputElement = keywordInputRef.current;

    // Initialize Autocomplete - NO type restriction to allow both generic terms and specific venues
    const autocompleteInstance = new google.maps.places.Autocomplete(inputElement, {
      // Remove types restriction - allow user to type generic keywords OR select specific places
      fields: ['name', 'place_id', 'geometry', 'formatted_address', 'rating'],
    });

    const handlePlaceSelection = () => {
      console.log('🚨 handlePlaceSelection called');
      const rawPlace = autocompleteInstance.getPlace();

      console.log('🔍 Autocomplete place selected:', rawPlace);
      console.log('🔍 Place name:', rawPlace?.name);
      console.log('🔍 Place ID:', rawPlace?.place_id);
      console.log('🔍 Formatted address:', rawPlace?.formatted_address);
      console.log('🔍 Has geometry?', !!rawPlace?.geometry);
      console.log('🔍 Has location?', !!rawPlace?.geometry?.location);

      ensurePlaceHasGeometry(rawPlace).then((place) => {
        if (!place) {
          console.warn('⚠️ Skipping place selection: no place data returned');
          return;
        }

        console.log('🔍 Enhanced place details:', {
          name: place.name,
          placeId: place.place_id,
          hasGeometry: !!place.geometry,
          hasLocation: !!place.geometry?.location,
        });

        if (place.name && place.place_id && place.geometry?.location) {
          // Extract just the main venue name (before any comma) to use as search keyword
          const cleanName = place.name.split(',')[0].trim();
          console.log('🔍 Clean name for search:', cleanName);

          // IMPORTANT: Clear the keyword to show ALL venues (not just search-filtered ones)
          // This ensures the newly added venue is visible immediately
          onKeywordChange('');
          console.log('🔍 Cleared keyword to show all venues');

          const existingCandidate = latestCandidatesRef.current.find((candidate) => candidate.placeId === place.place_id);
          if (existingCandidate) {
            console.log('ℹ️ Venue already present, auto-selecting existing candidate');
            pendingAutoSelectRef.current = null;
            latestOnCandidateClickRef.current(existingCandidate);
            return;
          }

          if (onAddVenueFromAutocomplete) {
            console.log('🎯 Adding venue directly from autocomplete:', {
              place_id: place.place_id,
              name: place.name,
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            });

            // Store place_id BEFORE making the async call
            pendingAutoSelectRef.current = place.place_id || null;
            console.log('📌 Stored place_id for auto-selection:', pendingAutoSelectRef.current);

            onAddVenueFromAutocomplete({
              place_id: place.place_id,
              name: place.name,
              address: place.formatted_address || '',
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              rating: place.rating,
            }).then(() => {
              console.log('✅ Venue added successfully!');
            }).catch((err) => {
              console.error('❌ Failed to add venue:', err);

              if (err.message && err.message.includes('already exists')) {
                console.log('ℹ️ Venue already exists, will still attempt to select it');
              } else {
                pendingAutoSelectRef.current = null;
              }
            });
          } else {
            // Fallback: search by keyword (old behavior)
            pendingAutoSelectRef.current = place.place_id || null;

            setTimeout(() => {
              console.log('🔍 Triggering search with keyword');
              onSearch();
            }, 100);
          }
        } else {
          console.warn('⚠️ Place data missing required fields even after details fetch');
        }
      });
    };

    // Listen for place_changed event
    autocompleteInstance.addListener('place_changed', handlePlaceSelection);

    // WORKAROUND: Google Autocomplete has a known bug where place_changed doesn't fire
    // on the first selection when clicking directly on a suggestion
    // Solution: Listen for mousedown on the PAC container items
    const setupPacContainerListener = () => {
      // Wait for PAC container to be created by Google
      setTimeout(() => {
        const pacContainer = document.querySelector('.pac-container') as HTMLElement;
        if (pacContainer) {
          console.log('✅ Found PAC container, adding click listener');

          const handlePacClick = (e: Event) => {
            const target = e.target as HTMLElement;
            // Check if click was on a PAC item
            if (target.closest('.pac-item')) {
              console.log('🖱️ PAC item clicked, waiting for place to populate...');
              // Give Google time to populate the place object
              setTimeout(() => {
                const place = autocompleteInstance.getPlace();
                if (place && place.place_id) {
                  console.log('✅ Place populated after PAC click, triggering selection');
                  handlePlaceSelection();
                }
              }, 100);
            }
          };

          pacContainer.addEventListener('mousedown', handlePacClick);

          // Store cleanup function
          return () => {
            pacContainer.removeEventListener('mousedown', handlePacClick);
          };
        }
      }, 500);
    };

    setupPacContainerListener();

    return () => {
      if (autocompleteInstance) {
        google.maps.event.clearInstanceListeners(autocompleteInstance);
      }
    };
  }, [isGoogleLoaded, onKeywordChange, onSearch, onAddVenueFromAutocomplete, ensurePlaceHasGeometry]);

  // Auto-scroll to selected candidate when it changes
  useEffect(() => {
    if (selectedCandidate && candidateRefs.current[selectedCandidate.id]) {
      candidateRefs.current[selectedCandidate.id]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedCandidate]);

  // Auto-select venue when candidates update after autocomplete selection
  useEffect(() => {
    console.log('🔍 Auto-select effect triggered:', {
      hasPendingSelect: !!pendingAutoSelectRef.current,
      pendingPlaceId: pendingAutoSelectRef.current,
      candidatesCount: candidates.length,
      isSearching,
      candidatePlaceIds: candidates.map(c => c.placeId)
    });

    if (pendingAutoSelectRef.current && candidates.length > 0 && !isSearching) {
      const targetPlaceId = pendingAutoSelectRef.current;
      console.log('🔍 Looking for candidate with place_id:', targetPlaceId);

      const matchingCandidate = candidates.find(c => c.placeId === targetPlaceId);

      if (matchingCandidate) {
        console.log('🎯 Auto-selecting venue from autocomplete:', matchingCandidate.name);
        onCandidateClick(matchingCandidate);
        pendingAutoSelectRef.current = null; // Clear after selection
      } else {
        console.log('❌ No matching candidate found for place_id:', targetPlaceId);
        console.log('Available candidates:', candidates.map(c => ({ name: c.name, placeId: c.placeId })));
      }
    }
  }, [candidates, isSearching, onCandidateClick]);

  const handleCategoryClick = (category: string) => {
    onKeywordChange(category);
  };

  const handleVoteClick = (candidateId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const hasUserVoted = myVotedCandidateIds.has(candidateId);

    if (hasUserVoted) {
      // User has already voted - toggle it off
      if (onVote) {
        onVote(candidateId);
      }
    } else {
      // User hasn't voted - save and vote
      if (onSaveCandidate) {
        onSaveCandidate(candidateId);
      }
    }
  };

  return (
    <div className="px-4 py-3 space-y-2">
      {/* Search Input - sharp borders */}
      <div className="flex gap-1">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black" />
          <input
            ref={keywordInputRef}
            type="text"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder={isGoogleLoaded ? "Search venues..." : "loading..."}
            disabled={!isGoogleLoaded}
            className="w-full pl-8 pr-2 py-1.5 text-xs text-black border-2 border-black focus:border-black outline-none placeholder:text-gray-400 disabled:cursor-wait"
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

      {/* Results - Ultra compact 2-line cards - Space for 6 results */}
      <div className="space-y-0.5 max-h-[346px] overflow-y-auto">
        {candidates.length === 0 ? (
          <div className="text-center py-6 text-neutral-400">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">No results</p>
          </div>
        ) : (
          candidates.map((candidate) => {
            const hasVoteCount = candidate.voteCount && candidate.voteCount > 0;
            const hasUserVoted = myVotedCandidateIds.has(candidate.id);
            const isSelected = selectedCandidate?.id === candidate.id;

            return (
              <div
                key={candidate.id}
                ref={(el) => { candidateRefs.current[candidate.id] = el; }}
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
                    {hasVoteCount && (
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
                        title={hasUserVoted ? 'Remove vote' : 'Save and Vote'}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            hasUserVoted ? 'fill-black text-black' : 'text-neutral-400'
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
