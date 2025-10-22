'use client';

import { useState } from 'react';
import { Participant } from '@/lib/api';
import { Candidate, SortMode } from '@/types';
import InputSection from './InputSection';
import VenuesSection from './VenuesSection';
import ParticipationSection from './ParticipationSection';

interface LeftPanelProps {
  // Input Section Props
  isJoined: boolean;
  onJoinEvent: (data: { name: string; lat: number; lng: number; blur: boolean }) => Promise<void>;
  onEditLocation: (data: { name?: string; lat?: number; lng?: number }) => Promise<void>;
  onRemoveOwnLocation: () => Promise<void>;
  currentUserName?: string;
  currentUserLocation?: string;
  isHost: boolean;

  // Venues Section Props
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
  hasAutoSearched: boolean;

  // Participation Section Props
  participants: Participant[];
  myParticipantId?: string;
  onParticipantClick: (participantId: string) => void;
  onRemoveParticipant?: (participantId: string) => void;
}

export default function LeftPanel({
  // Input
  isJoined,
  onJoinEvent,
  onEditLocation,
  onRemoveOwnLocation,
  currentUserName,
  currentUserLocation,
  isHost,

  // Venues
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
  hasAutoSearched,

  // Participation
  participants,
  myParticipantId,
  onParticipantClick,
  onRemoveParticipant,
}: LeftPanelProps) {

  return (
    <div className="w-96 max-w-[calc(50vw-2rem)] flex flex-col gap-3">
      {/* Section 1: Input View */}
      {(!isJoined || isHost) && (
        <InputSection
          isJoined={isJoined}
          onJoinEvent={onJoinEvent}
          onEditLocation={onEditLocation}
          onRemoveOwnLocation={onRemoveOwnLocation}
          currentUserName={currentUserName}
          currentUserLocation={currentUserLocation}
          isHost={isHost}
        />
      )}

      {/* Section 2: Venues View */}
      {isJoined && (
        <VenuesSection
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
          candidates={candidates}
          selectedCandidate={selectedCandidate}
          onCandidateClick={onCandidateClick}
          onVote={onVote}
          participantId={participantId}
          onSaveCandidate={onSaveCandidate}
          onRemoveCandidate={onRemoveCandidate}
          isHost={isHost}
          hasAutoSearched={hasAutoSearched}
        />
      )}

      {/* Section 3: Participation View */}
      {isJoined && participants.length > 0 && (
        <ParticipationSection
          participants={participants}
          myParticipantId={myParticipantId}
          onParticipantClick={onParticipantClick}
          onRemoveParticipant={onRemoveParticipant}
          isHost={isHost}
        />
      )}
    </div>
  );
}
