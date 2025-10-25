'use client';

import { useState } from 'react';
import { Participant } from '@/lib/api';
import { Candidate, SortMode } from '@/types';
import TopView from './TopView';
import InputSection from './InputSection';
import VenuesSection from './VenuesSection';
import ParticipationSection from './ParticipationSection';

interface LeftPanelProps {
  // TopView Props
  eventTitle?: string;
  eventId?: string;
  token?: string;
  finalDecision?: string | null;
  onPublishDecision?: () => void;
  onUnpublishDecision?: () => void;

  // Input Section Props
  isJoined: boolean;
  onJoinEvent: (data: { name: string; lat: number; lng: number; blur: boolean }) => Promise<void>;
  onEditLocation: (data: { name?: string; lat?: number; lng?: number; blur?: boolean }) => Promise<void>;
  onRemoveOwnLocation: () => Promise<void>;
  currentParticipant?: Participant;
  isHost: boolean;

  // Venues Section Props
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
  hasAutoSearched: boolean;
  candidateColors?: Map<string, string>;

  // Participation Section Props
  participants: Participant[];
  myParticipantId?: string;
  selectedParticipantId?: string | null;
  onParticipantClick: (participantId: string) => void;
  onRemoveParticipant?: (participantId: string) => void;
  showParticipantNames?: boolean;
  onToggleShowNames?: (show: boolean) => void;
}

export default function LeftPanel({
  // TopView
  eventTitle,
  eventId,
  token,
  finalDecision,
  onPublishDecision,
  onUnpublishDecision,

  // Input
  isJoined,
  onJoinEvent,
  onEditLocation,
  onRemoveOwnLocation,
  currentParticipant,
  isHost,

  // Venues
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
  hasAutoSearched,
  candidateColors,

  // Participation
  participants,
  myParticipantId,
  selectedParticipantId,
  onParticipantClick,
  onRemoveParticipant,
  showParticipantNames,
  onToggleShowNames,
}: LeftPanelProps) {

  return (
    <div className="w-96 max-w-[calc(50vw-2rem)] bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col">
      {/* TopView - Always visible */}
      <TopView
        eventTitle={eventTitle}
        eventId={eventId}
        token={token}
        isHost={isHost}
        selectedCandidate={selectedCandidate}
        finalDecision={finalDecision}
        onPublishDecision={onPublishDecision}
        onUnpublishDecision={onUnpublishDecision}
      />


      {/* Section 1: Input View - Always show, let InputSection handle expand/collapse */}
      <div data-tutorial-section="input">
        <InputSection
          isJoined={isJoined}
          onJoinEvent={onJoinEvent}
          onEditLocation={onEditLocation}
          onRemoveOwnLocation={onRemoveOwnLocation}
          currentParticipant={currentParticipant}
          isHost={isHost}
        />
        {isJoined && <div className="h-0.5 bg-black" />}
      </div>

      {/* Section 2: Venues View - Scrollable with max height */}
      {isJoined && (
        <div data-tutorial-section="venues" className="flex-1 overflow-hidden flex flex-col">
          <VenuesSection
            keyword={keyword}
            onKeywordChange={onKeywordChange}
            onSearch={onSearch}
            isSearching={isSearching}
            sortMode={sortMode}
            onSortChange={onSortChange}
            onlyInCircle={onlyInCircle}
            onOnlyInCircleChange={onOnlyInCircleChange}
            candidates={candidates}
            selectedCandidate={selectedCandidate}
            onCandidateClick={onCandidateClick}
            onVote={onVote}
            onDownvote={onDownvote}
            participantId={participantId}
            myVotedCandidateIds={myVotedCandidateIds}
            onSaveCandidate={onSaveCandidate}
            onRemoveCandidate={onRemoveCandidate}
            isHost={isHost}
            hasAutoSearched={hasAutoSearched}
            candidateColors={candidateColors}
          />
          {participants.length > 0 && <div className="h-0.5 bg-black" />}
        </div>
      )}

      {/* Section 3: Participation View */}
      {isJoined && participants.length > 0 && (
        <div data-tutorial-section="participants">
          <ParticipationSection
            participants={participants}
            myParticipantId={myParticipantId}
            selectedParticipantId={selectedParticipantId}
            onParticipantClick={onParticipantClick}
            onRemoveParticipant={onRemoveParticipant}
            isHost={isHost}
            showParticipantNames={showParticipantNames}
            onToggleShowNames={onToggleShowNames}
          />
        </div>
      )}
    </div>
  );
}
