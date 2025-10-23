'use client';

import { useState } from 'react';
import { Candidate } from '@/types';

interface EventVenuesProps {
  candidates: Candidate[];
  selectedCandidate: Candidate | null;
  onCandidateClick: (candidate: Candidate) => void;
  onVote?: (candidateId: string) => void;
  participantId?: string;
  allowVote?: boolean;
}

type VenueTab = 'all' | 'top-voted' | 'map';

export default function EventVenues({
  candidates,
  selectedCandidate,
  onCandidateClick,
  onVote,
  participantId,
  allowVote,
}: EventVenuesProps) {
  const [activeTab, setActiveTab] = useState<VenueTab>('all');

  // Sort candidates by votes for top-voted tab
  const sortedByVotes = [...candidates].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));

  const displayCandidates = activeTab === 'top-voted' ? sortedByVotes : candidates;

  return (
    <div className="bg-white border-b border-gray-300">
      {/* Header */}
      <div className="px-8 py-4 border-b border-gray-300 flex items-center justify-between">
        <h2 className="text-xl font-bold text-black">
          📍 Suggested Venues ({candidates.length})
        </h2>
        <button className="px-4 py-2 bg-black text-white font-medium rounded hover:bg-gray-800 transition-colors">
          + Add Venue
        </button>
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
            onClick={() => setActiveTab('top-voted')}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'top-voted'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            Top Voted
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
          // Map view placeholder
          <div className="bg-gray-100 rounded-lg h-[500px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 text-lg font-medium mb-2">🗺️ Map View</p>
              <p className="text-gray-400 text-sm">Coming soon - Interactive map with venue markers</p>
            </div>
          </div>
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
                        {candidate.voteCount && candidate.voteCount > 0 && activeTab === 'top-voted' && candidate === sortedByVotes[0] && (
                          <span className="text-xl">🏆</span>
                        )}
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
                        {allowVote && participantId && onVote && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onVote(candidate.id);
                            }}
                            className="px-4 py-2 bg-black text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors"
                          >
                            🤍 Vote
                          </button>
                        )}
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
    </div>
  );
}
