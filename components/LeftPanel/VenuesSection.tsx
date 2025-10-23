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
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  onlyInCircle: boolean;
  onOnlyInCircleChange: (value: boolean) => void;
  candidates: Candidate[];
  selectedCandidate: Candidate | null;
  onCandidateClick: (candidate: Candidate) => void;
  onVote?: (candidateId: string) => void;
  onDownvote?: (candidateId: string) => void;
  participantId?: string;
  myVotedCandidateIds: Set<string>;
  onSaveCandidate?: (candidateId: string) => void;
  onRemoveCandidate?: (candidateId: string) => void;
  isHost: boolean;
  hasAutoSearched: boolean;
  candidateColors?: Map<string, string>;
}

export default function VenuesSection({
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
  onDownvote,
  participantId,
  myVotedCandidateIds,
  onSaveCandidate,
  onRemoveCandidate,
  isHost,
  hasAutoSearched,
  candidateColors,
}: VenuesSectionProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'list'>('search');

  // Split candidates into search results and saved venues (saved = has votes)
  const savedVenues = candidates.filter(c => (c.voteCount ?? 0) > 0);
  const searchResults = candidates.filter(c => (c.voteCount ?? 0) === 0);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Tab Headers - High contrast black/white */}
      <div className="flex border-b-2 border-black">
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 px-3 py-2 font-bold text-xs transition-all flex items-center justify-center gap-1.5 border-r border-black ${
            activeTab === 'search'
              ? 'bg-black text-white'
              : 'bg-white text-black hover:bg-gray-100'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          SEARCH
          {searchResults.length > 0 && (
            <span className="px-1.5 py-0.5 bg-white text-black text-xs font-bold border border-black">
              {searchResults.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 px-3 py-2 font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'list'
              ? 'bg-black text-white'
              : 'bg-white text-black hover:bg-gray-100'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          SAVED
          {savedVenues.length > 0 && (
            <span className="px-1.5 py-0.5 bg-white text-black text-xs font-bold border border-black">
              {savedVenues.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === 'search' ? (
          <SearchSubView
            keyword={keyword}
            onKeywordChange={onKeywordChange}
            onSearch={onSearch}
            isSearching={isSearching}
            sortMode={sortMode}
            onSortChange={onSortChange}
            onlyInCircle={onlyInCircle}
            onOnlyInCircleChange={onOnlyInCircleChange}
            candidates={searchResults}
            selectedCandidate={selectedCandidate}
            onCandidateClick={onCandidateClick}
            onVote={onVote}
            participantId={participantId}
            myVotedCandidateIds={myVotedCandidateIds}
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
            onDownvote={onDownvote}
            participantId={participantId}
            myVotedCandidateIds={myVotedCandidateIds}
            onRemoveCandidate={onRemoveCandidate}
            isHost={isHost}
            candidateColors={candidateColors}
          />
        )}
      </div>
    </div>
  );
}
