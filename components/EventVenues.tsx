'use client';

import { useState } from 'react';
import { Candidate } from '@/types';
import AddVenueModal from './AddVenueModal';
import VenuesMapView from './VenuesMapView';

interface EventVenuesProps {
  candidates: Candidate[];
  selectedCandidate: Candidate | null;
  onCandidateClick: (candidate: Candidate) => void;
  onVote?: (candidateId: string, currentlyVoted: boolean) => void;
  onAddVenue?: (venueData: {
    place_id: string;
    name: string;
    address?: string;
    lat: number;
    lng: number;
    rating?: number;
  }) => Promise<void>;
  participantId?: string;
  allowVote?: boolean;
  isParticipant?: boolean;
}

type VenueTab = 'all' | 'map';

export default function EventVenues({
  candidates,
  selectedCandidate,
  onCandidateClick,
  onVote,
  onAddVenue,
  participantId,
  allowVote,
  isParticipant,
}: EventVenuesProps) {
  const [activeTab, setActiveTab] = useState<VenueTab>('all');
  const [showAddVenueModal, setShowAddVenueModal] = useState(false);

  const displayCandidates = candidates;

  return (
    <div className="bg-white border-b border-gray-300">
      {/* Header */}
      <div className="px-8 py-4 border-b border-gray-300 flex items-center justify-between">
        <h2 className="text-xl font-bold text-black">
          📍 Suggested Venues ({candidates.length})
        </h2>
        {isParticipant && onAddVenue && (
          <button
            onClick={() => setShowAddVenueModal(true)}
            className="px-4 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
          >
            + Add Venue
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-300">
        <div className="flex px-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'all'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            All Venues
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'map'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            Map View
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {activeTab === 'map' ? (
          // Map view
          candidates.length === 0 ? (
            <div className="bg-gray-100 rounded-lg h-[500px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 text-lg font-medium mb-2">🗺️ No Venues Yet</p>
                <p className="text-gray-400 text-sm">Add venues to see them on the map</p>
              </div>
            </div>
          ) : (
            <VenuesMapView
              venues={candidates}
              selectedVenue={selectedCandidate}
              onVenueClick={onCandidateClick}
              onVote={onVote}
              allowVote={allowVote}
              participantId={participantId}
            />
          )
        ) : (
          // List view
          <div className="space-y-4">
            {displayCandidates.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No venues suggested yet</p>
              </div>
            ) : (
              displayCandidates.map((candidate) => (
                <div
                  key={candidate.id}
                  onClick={() => onCandidateClick(candidate)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedCandidate?.id === candidate.id
                      ? 'border-black bg-gray-50'
                      : 'border-gray-300 hover:border-black'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg text-black">{candidate.name}</h3>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        {candidate.rating && (
                          <span className="flex items-center gap-1">
                            ⭐ {candidate.rating.toFixed(1)}
                            {candidate.userRatingsTotal && (
                              <span className="text-gray-400">({candidate.userRatingsTotal})</span>
                            )}
                          </span>
                        )}
                        {candidate.distanceFromCenter && (
                          <span>📍 {candidate.distanceFromCenter.toFixed(1)} km</span>
                        )}
                      </div>

                      {candidate.vicinity && (
                        <p className="text-sm text-gray-500 mb-3">{candidate.vicinity}</p>
                      )}

                      <div className="flex items-center gap-2">
                        {allowVote && onVote ? (
                          participantId ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onVote(candidate.id, candidate.userVoted || false);
                              }}
                              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                                candidate.userVoted
                                  ? 'bg-red-600 text-white hover:bg-red-700'
                                  : 'bg-black text-white hover:bg-gray-800'
                              }`}
                            >
                              {candidate.userVoted ? '💔 Unvote' : '🤍 Vote'}
                            </button>
                          ) : (
                            <button
                              disabled
                              className="px-4 py-2 bg-gray-300 text-gray-500 text-sm font-medium rounded cursor-not-allowed"
                              title="Join the event to vote"
                            >
                              🤍 Vote (Join to vote)
                            </button>
                          )
                        ) : null}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // View details functionality
                          }}
                          className="px-4 py-2 border border-gray-300 text-black text-sm font-medium rounded hover:border-black transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>

                    {/* Vote count badge */}
                    {candidate.voteCount !== undefined && candidate.voteCount > 0 && (
                      <div className="ml-4 flex flex-col items-center">
                        <div className="text-2xl">❤️</div>
                        <div className="text-lg font-bold text-black">{candidate.voteCount}</div>
                        <div className="text-xs text-gray-500">votes</div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add Venue Modal */}
      <AddVenueModal
        isOpen={showAddVenueModal}
        onClose={() => setShowAddVenueModal(false)}
        onSubmit={async (venueData) => {
          if (onAddVenue) {
            await onAddVenue(venueData);
            setShowAddVenueModal(false);
          }
        }}
      />
    </div>
  );
}
