'use client';

import { useState } from 'react';
import { Search, List, Heart } from 'lucide-react';
import { Candidate, SortMode } from '@/types';
import SearchSubView from './SearchSubView';
import VenueListSubView from './VenueListSubView';

interface VenuesSectionProps {
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
  onRemoveCandidate?: (candidateId: string) => void;
  isHost: boolean;
  hasAutoSearched: boolean;
}

export default function VenuesSection({
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
  onRemoveCandidate,
  isHost,
  hasAutoSearched,
}: VenuesSectionProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'list'>('search');

  // Split candidates into search results and saved venues
  const searchResults = candidates.filter(c => c.addedBy !== 'organizer');
  const savedVenues = candidates.filter(c => c.addedBy === 'organizer');

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-lg overflow-hidden flex flex-col" style={{ maxHeight: '60vh' }}>
      {/* Tab Headers */}
      <div className="flex border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 px-4 py-3 font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'search'
              ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600'
              : 'bg-white text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          <Search className="w-4 h-4" />
          Search
          {searchResults.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-emerald-600 text-white text-xs rounded-full">
              {searchResults.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 px-4 py-3 font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'list'
              ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600'
              : 'bg-white text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          <Heart className="w-4 h-4" />
          Venue List
          {savedVenues.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-emerald-600 text-white text-xs rounded-full">
              {savedVenues.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'search' ? (
          <SearchSubView
            keyword={keyword}
            onKeywordChange={onKeywordChange}
            onSearch={onSearch}
            isSearching={isSearching}
            searchType={searchType}
            onSearchTypeChange={onSearchTypeChange}
            sortMode={sortMode}
            onSortChange={onSortChange}
            onlyInCircle={onlyInCircle}
            onOnlyInCircleChange={onOnlyInCircleChange}
            candidates={searchResults}
            selectedCandidate={selectedCandidate}
            onCandidateClick={onCandidateClick}
            onVote={onVote}
            participantId={participantId}
            onSaveCandidate={onSaveCandidate}
            isHost={isHost}
            hasAutoSearched={hasAutoSearched}
          />
        ) : (
          <VenueListSubView
            candidates={savedVenues}
            selectedCandidate={selectedCandidate}
            onCandidateClick={onCandidateClick}
            onVote={onVote}
            participantId={participantId}
            onRemoveCandidate={onRemoveCandidate}
            isHost={isHost}
          />
        )}
      </div>
    </div>
  );
}
