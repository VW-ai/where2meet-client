'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import InputPanel from '@/components/InputPanel';
import CandidatesPanel from '@/components/CandidatesPanel';
import { Location, Candidate, Circle, SortMode } from '@/types';
import { computeCentroid, computeMinimumEnclosingCircle } from '@/lib/algorithms';
import { api, Event as APIEvent, Participant, Candidate as APICandidate } from '@/lib/api';

// Dynamically import MapView to avoid SSR issues with Google Maps
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-200 flex items-center justify-center">Loading map...</div>,
});

export default function EventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sseRef = useRef<EventSource | null>(null);

  // Event state
  const [eventId, setEventId] = useState<string | null>(null);
  const [event, setEvent] = useState<APIEvent | null>(null);
  const [role, setRole] = useState<'host' | 'participant' | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [joinToken, setJoinToken] = useState<string | null>(null);

  // Map state
  const [apiKey, setApiKey] = useState<string>('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [centroid, setCentroid] = useState<{ lat: number; lng: number } | null>(null);
  const [circle, setCircle] = useState<Circle | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('rating');
  const [keyword, setKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchRadius, setSearchRadius] = useState(1.1); // Multiplier: 1.0 to 2.0

  // UI state
  const [showShareModal, setShowShareModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [travelMode, setTravelMode] = useState<any>('DRIVING'); // Start with string, will be converted when Google loads
  const [showNicknamePrompt, setShowNicknamePrompt] = useState(false);
  const [nickname, setNickname] = useState('');
  const [pendingLocation, setPendingLocation] = useState<Location | null>(null);

  // Initialize event from URL
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    setApiKey(key);

    const id = searchParams.get('id');
    const token = searchParams.get('token');

    if (!id) {
      router.push('/');
      return;
    }

    setEventId(id);

    // Check if user is host or participant
    const storedRole = sessionStorage.getItem('role');
    const storedToken = sessionStorage.getItem('joinToken') || token;
    const storedParticipantId = sessionStorage.getItem('participantId');

    setRole(storedRole as 'host' | 'participant');
    setJoinToken(storedToken);
    if (storedParticipantId) {
      setParticipantId(storedParticipantId);
    }

    // Load event data
    loadEventData(id);

    // Connect to SSE for real-time updates
    connectSSE(id);

    return () => {
      if (sseRef.current) {
        sseRef.current.close();
      }
    };
  }, [searchParams, router]);

  // Update travel mode when Google Maps loads
  useEffect(() => {
    const checkAndSetTravelMode = () => {
      if (typeof window !== 'undefined' && window.google?.maps?.TravelMode) {
        if (typeof travelMode === 'string' && travelMode === 'DRIVING') {
          setTravelMode(google.maps.TravelMode.DRIVING);
        }
      } else {
        setTimeout(checkAndSetTravelMode, 100);
      }
    };
    checkAndSetTravelMode();
  }, []);

  // Ensure searchRadius is valid on mount (fix for old cached values)
  useEffect(() => {
    if (searchRadius < 1.0 || searchRadius > 2.0) {
      console.warn('Invalid searchRadius detected:', searchRadius, '- resetting to 1.1');
      setSearchRadius(1.1);
    }
  }, []); // Only run once on mount

  // Load event data
  const loadEventData = async (id: string) => {
    try {
      const eventData = await api.getEvent(id);
      setEvent(eventData);
      setKeyword(eventData.category);

      // Load participants
      const participantData = await api.getParticipants(id);
      setParticipants(participantData);

      // Convert participants to locations for map display
      const locs: Location[] = participantData.map((p) => ({
        id: p.id,
        lat: p.fuzzy_lat || p.lat,
        lng: p.fuzzy_lng || p.lng,
        address: p.name || `Participant ${p.id.slice(0, 8)}`,
        name: p.name,
      }));
      setLocations(locs);

      // Load candidates if any
      const candidateData = await api.getCandidates(id);
      setCandidates(convertAPICandidates(candidateData));
    } catch (err) {
      console.error('Failed to load event:', err);
      setError(err instanceof Error ? err.message : 'Failed to load event');
    }
  };

  // Connect to SSE
  const connectSSE = (id: string) => {
    if (sseRef.current) {
      sseRef.current.close();
    }

    const eventSource = api.connectSSE(
      id,
      (message) => {
        console.log('SSE message received:', message);

        switch (message.event) {
          case 'participant_joined':
            console.log('Participant joined - reloading event data');
            loadEventData(id); // Reload all data to show new participant
            break;
          case 'candidate_added':
            console.log('Candidate added - reloading event data');
            loadEventData(id);
            break;
          case 'vote_cast':
            console.log('Vote cast - reloading event data');
            loadEventData(id);
            break;
          case 'event_updated':
            console.log('Event updated - reloading event data');
            loadEventData(id);
            break;
          case 'event_published':
            console.log('Event published');
            loadEventData(id);
            alert('Final decision has been published!');
            break;
        }
      },
      (error) => {
        console.error('SSE error:', error);
        // Try to reconnect after 5 seconds
        setTimeout(() => connectSSE(id), 5000);
      }
    );

    sseRef.current = eventSource;
  };

  // Convert API candidates to frontend format
  const convertAPICandidates = (apiCandidates: APICandidate[]): Candidate[] => {
    return apiCandidates.map((c) => ({
      id: c.id,
      placeId: c.place_id,
      name: c.name,
      lat: c.lat,
      lng: c.lng,
      rating: c.rating,
      userRatingsTotal: c.user_ratings_total,
      distanceFromCenter: c.distance_from_center,
      inCircle: c.in_circle,
      vicinity: c.address,
      voteCount: c.vote_count || 0,
    }));
  };

  // Recompute centroid and circle
  useEffect(() => {
    if (locations.length === 0) {
      setCentroid(null);
      setCircle(null);
      return;
    }

    const newCentroid = computeCentroid(locations);
    setCentroid(newCentroid);

    if (locations.length >= 1) {
      const mec = computeMinimumEnclosingCircle(locations);
      if (mec) {
        // The MEC radius is in meters, multiply by searchRadius multiplier
        setCircle({
          center: mec.center,
          radius: mec.radius * searchRadius, // Apply multiplier to base MEC radius
        });
      }
    }
  }, [locations, searchRadius]);

  // Add location (for participants)
  const handleAddLocation = useCallback(async (location: Location) => {
    if (!eventId) return;

    try {
      const participant = await api.addParticipant(eventId, {
        lat: location.lat,
        lng: location.lng,
        name: location.name || location.address,
      });

      // Store participant ID
      sessionStorage.setItem('participantId', participant.id);
      setParticipantId(participant.id);

      // Reload event data to get updated list
      await loadEventData(eventId);
    } catch (err) {
      console.error('Failed to add location:', err);
      alert(err instanceof Error ? err.message : 'Failed to add location');
    }
  }, [eventId]);

  const handleRemoveLocation = useCallback(async (id: string) => {
    if (!eventId || role !== 'host') return;

    try {
      await api.removeParticipant(eventId, id);
      await loadEventData(eventId);
    } catch (err) {
      console.error('Failed to remove participant:', err);
      alert(err instanceof Error ? err.message : 'Failed to remove participant');
    }
  }, [eventId, role]);

  const handleRemoveCandidate = useCallback(async (id: string) => {
    if (!eventId || role !== 'host') return;

    try {
      await api.removeCandidate(eventId, id);
      await loadEventData(eventId);
    } catch (err) {
      console.error('Failed to remove candidate:', err);
      alert(err instanceof Error ? err.message : 'Failed to remove candidate');
    }
  }, [eventId, role]);

  const handleUpdateLocation = useCallback((id: string, updates: Partial<Location>) => {
    // Not supported yet - would need backend endpoint
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    // If user already has a participant ID and is not a host, they can't add another location
    if (participantId && role !== 'host') return;

    const newLocation: Location = {
      id: Date.now().toString(),
      lat,
      lng,
      address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    };

    // Show confirmation dialog first, then prompt for nickname
    const confirmed = confirm(
      `Add location at:\n${lat.toFixed(6)}, ${lng.toFixed(6)}?\n\nClick OK to confirm this location.`
    );

    if (confirmed) {
      setPendingLocation(newLocation);
      setShowNicknamePrompt(true);
    }
  }, [participantId, role]);

  // Search candidates via API
  const searchPlaces = useCallback(async () => {
    if (!eventId || !keyword.trim()) {
      alert('Please enter a search keyword');
      return;
    }

    setIsSearching(true);
    setCandidates([]);
    setSelectedCandidate(null);

    try {
      // Ensure radius_multiplier is within valid range (1.0 to 2.0)
      const radiusMultiplier = Math.min(2.0, Math.max(1.0, searchRadius));
      console.log('Searching with radius multiplier:', radiusMultiplier);

      const results = await api.searchCandidates(eventId, {
        keyword: keyword,
        radius_multiplier: radiusMultiplier,
      });

      setCandidates(convertAPICandidates(results));

      if (results.length === 0) {
        alert(`No results found for "${keyword}". Try a different search term.`);
      }
    } catch (err) {
      console.error('Search failed:', err);
      alert(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }, [eventId, keyword, searchRadius]);

  // Sort candidates
  const sortedCandidates = useCallback(() => {
    const sorted = [...candidates];
    if (sortMode === 'rating') {
      sorted.sort((a, b) => {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return ratingB - ratingA;
      });
    } else {
      sorted.sort((a, b) => {
        const distA = a.distanceFromCenter || Infinity;
        const distB = b.distanceFromCenter || Infinity;
        return distA - distB;
      });
    }
    return sorted;
  }, [candidates, sortMode]);

  // Vote on candidate
  const handleVote = useCallback(async (candidateId: string) => {
    if (!eventId || !participantId || !event?.allow_vote) return;

    try {
      await api.castVote(eventId, participantId, candidateId);
      await loadEventData(eventId);
    } catch (err) {
      console.error('Failed to vote:', err);
      alert(err instanceof Error ? err.message : 'Failed to vote');
    }
  }, [eventId, participantId, event]);

  // Publish final decision (host only)
  const handlePublish = useCallback(async () => {
    if (!eventId || role !== 'host' || !selectedCandidate) {
      alert('Please select a venue first');
      return;
    }

    if (!confirm('Publish this as the final decision? This will notify all participants.')) {
      return;
    }

    try {
      await api.publishEvent(eventId, selectedCandidate.name);
      await loadEventData(eventId);
      alert('Final decision published!');
    } catch (err) {
      console.error('Failed to publish:', err);
      alert(err instanceof Error ? err.message : 'Failed to publish');
    }
  }, [eventId, role, selectedCandidate]);

  // Handle nickname confirmation
  const handleConfirmNickname = useCallback(() => {
    if (!nickname.trim()) {
      alert('Please enter a nickname');
      return;
    }

    if (pendingLocation) {
      handleAddLocation({
        ...pendingLocation,
        name: nickname.trim(),
      });
      setShowNicknamePrompt(false);
      setPendingLocation(null);
      setNickname('');
    }
  }, [nickname, pendingLocation, handleAddLocation]);

  const handleCancelNickname = useCallback(() => {
    setShowNicknamePrompt(false);
    setPendingLocation(null);
    setNickname('');
  }, []);

  // Copy join link
  const copyJoinLink = () => {
    if (!eventId || !joinToken) return;

    const link = `${window.location.origin}/event?id=${eventId}&token=${joinToken}`;
    navigator.clipboard.writeText(link);
    alert('Join link copied to clipboard!');
  };

  if (!apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">API Key Missing</h1>
          <p className="text-gray-700 mb-4">
            Please set your Google Maps API key in the <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> file:
          </p>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
          </pre>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen w-screen overflow-hidden relative">
      {/* Full-Screen Map */}
      <div className="absolute inset-0">
        <MapView
          apiKey={apiKey}
          locations={locations}
          centroid={centroid}
          circle={circle}
          candidates={sortedCandidates()}
          selectedCandidate={selectedCandidate}
          onMapClick={handleMapClick}
          onCandidateClick={setSelectedCandidate}
          myParticipantId={participantId || undefined}
          travelMode={travelMode}
          onTravelModeChange={setTravelMode}
        />
      </div>

      {/* Floating Header */}
      <header className="absolute top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-lg z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
              title="Go back to main page"
            >
              ← Home
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
              <p className="text-sm font-medium text-gray-700">
                {role === 'host' ? '👑 Host' : '👤 Participant'} • {participants.length} participant{participants.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {circle && (
              <div className="hidden md:flex items-center gap-6 text-sm">
                <div>
                  <p className="text-gray-700 font-medium">Radius</p>
                  <p className="font-bold text-gray-900">{(circle.radius / 1000).toFixed(2)} km</p>
                </div>
                <div>
                  <p className="text-gray-700 font-medium">Venues</p>
                  <p className="font-bold text-gray-900">{candidates.length}</p>
                </div>
              </div>
            )}
            {role === 'host' && (
              <>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Share Link
                </button>
                {selectedCandidate && !event.final_decision && (
                  <button
                    onClick={handlePublish}
                    className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                  >
                    Publish Decision
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Final Decision Banner */}
      {event.final_decision && (
        <div className="absolute top-20 left-0 right-0 bg-green-500 text-white text-center py-3 px-4 shadow-lg z-10">
          <p className="font-bold text-lg">🎉 Final Decision: {event.final_decision}</p>
        </div>
      )}

      {/* Floating Left Panel - Input & Controls */}
      <div className="absolute left-4 top-24 w-72 max-w-[calc(50vw-2rem)] flex flex-col gap-2 z-10 transition-all duration-300">
        {/* Input Panel - Show for non-participants OR for host (host can always add location) */}
        {(!participantId || role === 'host') && (
          <div className="bg-white/70 backdrop-blur-md rounded-lg shadow-2xl overflow-hidden">
            <div className="p-3">
              <InputPanel
                locations={locations}
                onAddLocation={handleAddLocation}
                onRemoveLocation={handleRemoveLocation}
                onUpdateLocation={handleUpdateLocation}
              />
            </div>
          </div>
        )}

        {/* Host Controls */}
        {role === 'host' && (
          <>
            {/* Radius Control */}
            {locations.length > 0 && (
              <div className="bg-white/70 backdrop-blur-md rounded-lg shadow-2xl p-3">
                <h3 className="text-sm font-bold text-gray-900 mb-2">Search Radius Multiplier</h3>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">1.0×</span>
                  <span className="text-xs font-bold text-blue-700">{searchRadius.toFixed(1)}×</span>
                  <span className="text-xs font-medium text-gray-700">2.0×</span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={2.0}
                  step={0.1}
                  value={searchRadius}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    // Clamp between 1.0 and 2.0 to be safe
                    setSearchRadius(Math.min(2.0, Math.max(1.0, value)));
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Multiplies the base radius by this factor
                </p>
              </div>
            )}

            {/* Participants Management */}
            {participants.length > 0 && (
              <div className="bg-white/70 backdrop-blur-md rounded-lg shadow-2xl p-3">
                <h3 className="text-sm font-bold text-gray-900 mb-2">
                  Participants ({participants.length})
                </h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-xs bg-white border border-gray-200 rounded px-2 py-1">
                      <span className="truncate font-semibold text-gray-900">{p.name || `Participant ${p.id.slice(0, 8)}`}</span>
                      <button
                        onClick={() => handleRemoveLocation(p.id)}
                        className="ml-2 text-red-600 hover:text-red-800 font-bold text-base"
                        title="Remove participant"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Right Panel - Candidates/Search */}
      {locations.length > 0 && (
        <div className={`absolute right-4 top-24 w-80 max-w-[calc(50vw-2rem)] z-10 transition-all duration-300 ${
          candidates.length > 0 ? 'bottom-4' : ''
        }`}>
          <div className="bg-white/70 backdrop-blur-md rounded-lg shadow-2xl overflow-hidden h-full">
            <div className="h-full p-3">
              <CandidatesPanel
                candidates={sortedCandidates()}
                selectedCandidate={selectedCandidate}
                sortMode={sortMode}
                onSortChange={setSortMode}
                onCandidateClick={setSelectedCandidate}
                keyword={keyword}
                onKeywordChange={setKeyword}
                onSearch={searchPlaces}
                isSearching={isSearching}
                onVote={event?.allow_vote ? handleVote : undefined}
                participantId={participantId || undefined}
                onRemoveCandidate={role === 'host' ? handleRemoveCandidate : undefined}
                isHost={role === 'host'}
              />
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Share Event Link</h3>
            <p className="text-sm text-gray-700 mb-4">
              Share this link with participants so they can add their locations:
            </p>
            <div className="bg-gray-100 p-3 rounded-lg mb-4 break-all text-sm text-gray-900">
              {window.location.origin}/event?id={eventId}&token={joinToken}
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyJoinLink}
                className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Copy Link
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nickname Prompt Modal (for map clicks) */}
      {showNicknamePrompt && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50" onClick={handleCancelNickname}>
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Enter Your Nickname</h3>
            <p className="text-sm text-gray-700 mb-4">
              This will be visible to the event organizer and displayed on the map.
            </p>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmNickname()}
              placeholder="e.g., Alice, Bob, John"
              autoFocus
              className="w-full px-4 py-3 text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleConfirmNickname}
                disabled={!nickname.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Confirm
              </button>
              <button
                onClick={handleCancelNickname}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
