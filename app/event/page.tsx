'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Toaster, toast } from 'sonner';
import InputPanel from '@/components/InputPanel';
import CandidatesPanel from '@/components/CandidatesPanel';
import VenueSearchBox from '@/components/VenueSearchBox';
import Tabs, { TabItem } from '@/components/Tabs';
import EmptyState from '@/components/EmptyState';
import { Location, Candidate, Circle, SortMode } from '@/types';
import { computeCentroid, computeMinimumEnclosingCircle } from '@/lib/algorithms';
import { api, Event as APIEvent, Participant, Candidate as APICandidate } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import Instructions from '@/components/Instructions';

// Dynamically import MapView to avoid SSR issues with Google Maps
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-200 flex items-center justify-center">Loading map...</div>,
});

export default function EventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sseRef = useRef<EventSource | null>(null);
  const { t } = useTranslation();

  // Event state
  const [eventId, setEventId] = useState<string | null>(null);
  const [event, setEvent] = useState<APIEvent | null>(null);
  const [role, setRole] = useState<'host' | 'participant' | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [joinToken, setJoinToken] = useState<string | null>(null);

  // Map state
  const [apiKey, setApiKey] = useState<string>(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '');
  const [locations, setLocations] = useState<Location[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [centroid, setCentroid] = useState<{ lat: number; lng: number } | null>(null);
  const [customCentroid, setCustomCentroid] = useState<{ lat: number; lng: number } | null>(null);
  const [circle, setCircle] = useState<Circle | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('rating');
  const [keyword, setKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchRadius, setSearchRadius] = useState(500); // Absolute radius in meters: 500m to 4000m
  const [onlyInCircle, setOnlyInCircle] = useState(true); // Filter search results to MEC circle only

  // UI state
  const [isInitializing, setIsInitializing] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [travelMode, setTravelMode] = useState<any>('DRIVING'); // Start with string, will be converted when Google loads
  const [showNicknamePrompt, setShowNicknamePrompt] = useState(false);
  const [nickname, setNickname] = useState('');
  const [pendingLocation, setPendingLocation] = useState<Location | null>(null);
  const [isDraggingCentroid, setIsDraggingCentroid] = useState(false);

  // Initialize event from URL
  useEffect(() => {
    const initializeApp = async () => {
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
      await loadEventData(id);

      // Connect to SSE for real-time updates
      connectSSE(id);

      // Mark initialization as complete
      setIsInitializing(false);
    };

    initializeApp();

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
    if (searchRadius < 500 || searchRadius > 4000) {
      console.warn('Invalid searchRadius detected:', searchRadius, '- resetting to 500m');
      setSearchRadius(500);
    }
  }, []); // Only run once on mount

  // Load event data
  const loadEventData = async (id: string) => {
    try {
      const eventData = await api.getEvent(id);
      setEvent(eventData);
      setKeyword(eventData.category);

      // Load custom centroid if it exists in the event
      if (eventData.custom_center_lat && eventData.custom_center_lng) {
        setCustomCentroid({
          lat: eventData.custom_center_lat,
          lng: eventData.custom_center_lng,
        });
      } else {
        setCustomCentroid(null);
      }

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
          case 'participant_updated':
            console.log('Participant updated - reloading event data');
            loadEventData(id);
            break;
          case 'candidate_added':
            console.log('Candidate added - reloading event data');
            loadEventData(id);
            break;
          case 'candidate_saved':
            console.log('Candidate saved - reloading event data');
            loadEventData(id);
            break;
          case 'candidate_unsaved':
            console.log('Candidate unsaved - reloading event data');
            loadEventData(id);
            break;
          case 'vote_cast':
            console.log('Vote cast - reloading event data');
            loadEventData(id);
            break;
          case 'event_updated':
            console.log('Event updated - reloading event data');
            // Update custom centroid from SSE message if available
            if (message.data?.custom_center_lat !== undefined && message.data?.custom_center_lng !== undefined) {
              if (message.data.custom_center_lat === null || message.data.custom_center_lng === null) {
                setCustomCentroid(null);
              } else {
                setCustomCentroid({
                  lat: message.data.custom_center_lat,
                  lng: message.data.custom_center_lng,
                });
              }
            }
            loadEventData(id);
            break;
          case 'event_published':
            console.log('Event published');
            loadEventData(id);
            toast.success(t.finalDecisionPublished);
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
      addedBy: c.added_by,
    }));
  };

  // Recompute centroid and circle
  useEffect(() => {
    if (locations.length === 0) {
      setCentroid(null);
      setCircle(null);
      return;
    }

    // Use custom centroid if available, otherwise compute automatically
    const effectiveCentroid = customCentroid || computeCentroid(locations);
    setCentroid(effectiveCentroid);

    if (locations.length >= 1) {
      const mec = computeMinimumEnclosingCircle(locations);
      if (mec) {
        // Use custom centroid for circle center if available, otherwise use MEC center
        const circleCenter = customCentroid || mec.center;
        setCircle({
          center: circleCenter,
          radius: searchRadius,
        });
      }
    }
  }, [locations, searchRadius, customCentroid]);

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
      toast.error(err instanceof Error ? err.message : 'Failed to add location');
    }
  }, [eventId]);

  const handleRemoveLocation = useCallback(async (id: string) => {
    if (!eventId || role !== 'host') return;

    try {
      await api.removeParticipant(eventId, id);
      await loadEventData(eventId);
    } catch (err) {
      console.error('Failed to remove participant:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to remove participant');
    }
  }, [eventId, role]);

  const handleRemoveCandidate = useCallback(async (id: string) => {
    if (!eventId || role !== 'host') return;

    try {
      await api.removeCandidate(eventId, id);
      await loadEventData(eventId);
    } catch (err) {
      console.error('Failed to remove candidate:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to remove candidate');
    }
  }, [eventId, role]);

  const handleUpdateLocation = useCallback(async (id: string, updates: Partial<Location>) => {
    if (!eventId) return;

    try {
      await api.updateParticipant(eventId, id, {
        lat: updates.lat,
        lng: updates.lng,
        name: updates.name,
      });
      await loadEventData(eventId);
      toast.success('Location updated successfully');
    } catch (err) {
      console.error('Failed to update location:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update location');
    }
  }, [eventId]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    // Ignore map clicks right after dragging centroid
    if (isDraggingCentroid) {
      setIsDraggingCentroid(false);
      return;
    }

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
  }, [participantId, role, isDraggingCentroid]);

  // Search candidates via API
  const searchPlaces = useCallback(async () => {
    if (!eventId || !keyword.trim()) {
      toast.info(t.pleaseEnterKeyword);
      return;
    }

    setIsSearching(true);
    setCandidates([]);
    setSelectedCandidate(null);

    try {
      // Search within the MEC only (not the slider radius)
      // The backend will compute the MEC and search within it
      // Use multiplier of 1.0 to search exactly within the MEC
      const radiusMultiplier = 1.0;

      // Include custom centroid if user has dragged the center point
      const searchParams: any = {
        keyword: keyword,
        radius_multiplier: radiusMultiplier,
        only_in_circle: onlyInCircle,
      };

      if (customCentroid) {
        searchParams.custom_center_lat = customCentroid.lat;
        searchParams.custom_center_lng = customCentroid.lng;
        console.log('🎯 Searching with custom center:', customCentroid, 'multiplier:', radiusMultiplier, 'only_in_circle:', onlyInCircle);
      } else {
        console.log('📍 Searching with computed MEC center, multiplier:', radiusMultiplier, 'only_in_circle:', onlyInCircle);
      }

      const results = await api.searchCandidates(eventId, searchParams);

      setCandidates(convertAPICandidates(results));

      if (results.length === 0) {
        toast.warning(`${t.noResultsFound} "${keyword}". ${t.tryDifferentSearch}`);
      }
    } catch (err) {
      console.error('Search failed:', err);
      toast.error(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }, [eventId, keyword, customCentroid, onlyInCircle, t]);

  // Sort candidates
  const sortedCandidates = useCallback(() => {
    const sorted = [...candidates];
    if (sortMode === 'rating') {
      sorted.sort((a, b) => {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return ratingB - ratingA;
      });
    } else if (sortMode === 'vote') {
      sorted.sort((a, b) => {
        const voteA = a.voteCount || 0;
        const voteB = b.voteCount || 0;
        return voteB - voteA; // Highest votes first
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
      toast.error(err instanceof Error ? err.message : 'Failed to vote');
    }
  }, [eventId, participantId, event]);

  // Publish final decision (host only)
  const handlePublish = useCallback(async () => {
    if (!eventId || role !== 'host' || !selectedCandidate) {
      toast.info(t.pleaseSelectVenue);
      return;
    }

    if (!confirm('Publish this as the final decision? This will notify all participants.')) {
      return;
    }

    try {
      await api.publishEvent(eventId, selectedCandidate.name);
      await loadEventData(eventId);
      toast.success(t.finalDecisionPublished);
    } catch (err) {
      console.error('Failed to publish:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to publish');
    }
  }, [eventId, role, selectedCandidate, t]);

  // Add venue manually (for both host and participants)
  const handleAddVenueManually = useCallback(async (place: {
    place_id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    rating?: number;
  }) => {
    if (!eventId) return;

    try {
      await api.addCandidateManually(eventId, place);
      await loadEventData(eventId);
    } catch (err) {
      console.error('Failed to add venue:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to add venue');
    }
  }, [eventId]);

  // Save search result to added list
  const handleSaveCandidate = useCallback(async (candidateId: string) => {
    if (!eventId) return;

    try {
      await api.saveCandidate(eventId, candidateId);
      await loadEventData(eventId);
      toast.success('Venue saved to added list');
    } catch (err) {
      console.error('Failed to save venue:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save venue');
    }
  }, [eventId]);

  // Remove from added list (but keep in database as search result)
  const handleUnsaveCandidate = useCallback(async (candidateId: string) => {
    if (!eventId) return;

    try {
      await api.unsaveCandidate(eventId, candidateId);
      await loadEventData(eventId);
      toast.success('Venue removed from added list');
    } catch (err) {
      console.error('Failed to unsave venue:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to unsave venue');
    }
  }, [eventId]);

  // Handle nickname confirmation
  const handleConfirmNickname = useCallback(() => {
    if (!nickname.trim()) {
      toast.info(t.pleaseEnterNickname);
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
  }, [nickname, pendingLocation, handleAddLocation, t]);

  const handleCancelNickname = useCallback(() => {
    setShowNicknamePrompt(false);
    setPendingLocation(null);
    setNickname('');
  }, []);

  // Handle centroid drag (host only)
  const handleCentroidDrag = useCallback(async (lat: number, lng: number) => {
    if (!eventId) return;

    setIsDraggingCentroid(true);
    setCustomCentroid({ lat, lng });

    // Save to backend
    try {
      await api.updateEvent(eventId, {
        custom_center_lat: lat,
        custom_center_lng: lng,
      });
      toast.success(t.centerPointAdjusted || 'Center point adjusted');
    } catch (err) {
      console.error('Failed to save custom center:', err);
      toast.error('Failed to save center point');
    }
  }, [eventId, t]);

  // Reset to auto-calculated centroid
  const handleResetCentroid = useCallback(async () => {
    if (!eventId) return;

    setCustomCentroid(null);

    // Save null to backend
    try {
      await api.updateEvent(eventId, {
        custom_center_lat: null as any,
        custom_center_lng: null as any,
      });
      toast.success(t.centerPointReset || 'Center point reset to auto-calculated position');
    } catch (err) {
      console.error('Failed to reset custom center:', err);
      toast.error('Failed to reset center point');
    }
  }, [eventId, t]);

  // Copy join link
  const copyJoinLink = () => {
    if (!eventId || !joinToken) return;

    const link = `${window.location.origin}/event?id=${eventId}&token=${joinToken}`;
    navigator.clipboard.writeText(link);
    toast.success(t.joinLinkCopied);
  };

  // Show enhanced loading screen during initialization
  if (isInitializing || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          {/* Animated logo/icon */}
          <div className="mb-6 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-blue-500/20 rounded-full animate-ping"></div>
            </div>
            <div className="relative flex items-center justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-4xl">📍</span>
              </div>
            </div>
          </div>

          {/* Loading text */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Where2Meet</h2>
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-gray-600 font-medium">{t.loadingEvent}</p>
        </div>
      </div>
    );
  }

  // Check for missing API key AFTER initialization
  if (!apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">{t.apiKeyMissing}</h1>
          <p className="text-gray-700 mb-4">
            {t.apiKeyMissingMessage} <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> file:
          </p>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
          </pre>
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
          onCentroidDrag={handleCentroidDrag}
          isHost={role === 'host'}
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
              {t.home}
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
              <p className="text-sm font-medium text-gray-700">
                {role === 'host' ? t.host : t.participant} • {participants.length} {t.participants}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {circle && (
              <div className="hidden md:flex items-center gap-6 text-sm">
                <div>
                  <p className="text-gray-700 font-medium">{t.radius}</p>
                  <p className="font-bold text-gray-900">{(circle.radius / 1000).toFixed(2)} km</p>
                </div>
                <div>
                  <p className="text-gray-700 font-medium">{t.venues}</p>
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
                  {t.shareLink}
                </button>
                {selectedCandidate && !event.final_decision && (
                  <button
                    onClick={handlePublish}
                    className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                  >
                    {t.publishDecision}
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
          <p className="font-bold text-lg">{t.finalDecision}: {event.final_decision}</p>
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
                myParticipantId={participantId || undefined}
                isHost={role === 'host'}
              />
            </div>
          </div>
        )}

        {/* Host Controls */}
        {role === 'host' && (
          <>
            {/* Circle Display Radius Control */}
            {locations.length > 0 && (
              <div className="bg-white/70 backdrop-blur-md rounded-lg shadow-2xl p-3">
                <div className="flex items-center gap-1 mb-2">
                  <h3 className="text-sm font-bold text-gray-900">{t.circleDisplayRadius}</h3>
                  <div className="relative group">
                    <button className="w-4 h-4 rounded-full bg-gray-300 text-white text-xs flex items-center justify-center hover:bg-gray-400 transition-colors">
                      ?
                    </button>
                    <div className="absolute left-0 top-6 w-64 bg-gray-900 text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                      {t.circleTooltip}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">500m</span>
                  <span className="text-xs font-bold text-blue-700">
                    {searchRadius >= 1000
                      ? `${(searchRadius / 1000).toFixed(1)} km`
                      : `${searchRadius} m`}
                  </span>
                  <span className="text-xs font-medium text-gray-700">4 km</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={4000}
                  step={100}
                  value={searchRadius}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setSearchRadius(Math.min(4000, Math.max(500, value)));
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-xs text-gray-600 mt-1">
                  {t.visualizationOnly}
                </p>

                {/* Reset Center Point Button - Only show when customCentroid exists */}
                {customCentroid && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <button
                      onClick={handleResetCentroid}
                      className="w-full px-3 py-2 bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg hover:bg-purple-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <span>↺</span>
                      <span>Reset Center Point</span>
                    </button>
                    <p className="text-xs text-gray-600 mt-1 text-center">
                      Restore auto-calculated center
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Participants Management */}
            {participants.length > 0 && (
              <div className="bg-white/70 backdrop-blur-md rounded-lg shadow-2xl p-3">
                <h3 className="text-sm font-bold text-gray-900 mb-2">
                  {t.participantsCount} ({participants.length})
                </h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-xs bg-white border border-gray-200 rounded px-2 py-1">
                      <span className="truncate font-semibold text-gray-900">{p.name || `Participant ${p.id.slice(0, 8)}`}</span>
                      <button
                        onClick={() => handleRemoveLocation(p.id)}
                        className="ml-2 text-red-600 hover:text-red-800 font-bold text-base"
                        title={t.removeParticipant}
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

      {/* Floating Right Panel - Tabbed Interface */}
      {locations.length > 0 && (
        <div className="absolute right-4 top-24 w-80 max-w-[calc(50vw-2rem)] bottom-4 z-10">
          <div className="bg-white/70 backdrop-blur-md rounded-lg shadow-2xl overflow-hidden h-full">
            <Tabs
              tabs={[
                {
                  id: 'search',
                  label: t.search,
                  icon: '🔍',
                  badge: sortedCandidates().filter(c => c.addedBy !== 'organizer').length,
                  content: (
                    <div className="h-full p-3">
                      <CandidatesPanel
                        candidates={sortedCandidates().filter(c => c.addedBy !== 'organizer')}
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
                        onSaveCandidate={handleSaveCandidate}
                        isHost={role === 'host'}
                        onlyInCircle={onlyInCircle}
                        onOnlyInCircleChange={setOnlyInCircle}
                      />
                    </div>
                  ),
                },
                {
                  id: 'custom-add',
                  label: t.customAdd,
                  icon: '➕',
                  content: (
                    <div className="p-3 h-full flex flex-col">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">{t.addSpecificVenue}</h3>
                      <VenueSearchBox
                        apiKey={apiKey}
                        onPlaceSelected={handleAddVenueManually}
                        disabled={!!event?.final_decision}
                      />
                      <p className="text-xs text-gray-700 mt-2 font-medium">
                        {t.searchAndAddVenue}
                      </p>
                    </div>
                  ),
                },
                {
                  id: 'added',
                  label: t.added,
                  icon: '💜',
                  badge: sortedCandidates().filter(c => c.addedBy === 'organizer').length,
                  content: (
                    <div className="p-3 h-full overflow-y-auto">
                      {sortedCandidates().filter(c => c.addedBy === 'organizer').length === 0 ? (
                        <EmptyState
                          icon="💜"
                          title={t.noUserAddedVenues}
                          message={t.noUserAddedMessage}
                        />
                      ) : (
                        <div className="space-y-2">
                          {sortedCandidates()
                            .filter(c => c.addedBy === 'organizer')
                            .map((candidate) => (
                              <div
                                key={candidate.id}
                                onClick={() => setSelectedCandidate(candidate)}
                                className={`p-2 rounded-md cursor-pointer transition-all ${
                                  selectedCandidate?.id === candidate.id
                                    ? 'bg-purple-200 border-2 border-purple-600'
                                    : 'bg-white hover:bg-purple-100 border-2 border-purple-200'
                                }`}
                              >
                                <h4 className="font-semibold text-gray-900 text-sm">{candidate.name}</h4>
                                {candidate.vicinity && (
                                  <p className="text-xs text-gray-700 mt-1">{candidate.vicinity}</p>
                                )}
                                <div className="flex items-center gap-2 mt-1 text-xs flex-wrap">
                                  {candidate.rating && (
                                    <span className="flex items-center gap-1">
                                      <span className="text-yellow-500">★</span>
                                      <span className="font-medium">{candidate.rating.toFixed(1)}</span>
                                    </span>
                                  )}
                                  {event?.allow_vote && candidate.voteCount !== undefined && (
                                    <span className="flex items-center gap-1 font-medium text-purple-600">
                                      🗳️ {candidate.voteCount}
                                    </span>
                                  )}
                                </div>
                                <div className="mt-2 flex gap-1 flex-wrap">
                                  {event?.allow_vote && participantId && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleVote(candidate.id);
                                      }}
                                      className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                                    >
                                      {t.vote}
                                    </button>
                                  )}
                                  {role === 'host' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUnsaveCandidate(candidate.id);
                                      }}
                                      className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                                    >
                                      {t.remove}
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">{t.shareEventLink}</h3>
            <p className="text-sm text-gray-700 mb-4">
              {t.shareDescription}
            </p>
            <div className="bg-gray-100 p-3 rounded-lg mb-4 break-all text-sm text-gray-900">
              {window.location.origin}/event?id={eventId}&token={joinToken}
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyJoinLink}
                className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t.copyLink}
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nickname Prompt Modal (for map clicks) */}
      {showNicknamePrompt && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50" onClick={handleCancelNickname}>
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-3">{t.enterNickname}</h3>
            <p className="text-sm text-gray-700 mb-4">
              {t.nicknameVisible}
            </p>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmNickname()}
              placeholder={t.nicknamePlaceholder}
              autoFocus
              className="w-full px-4 py-3 text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleConfirmNickname}
                disabled={!nickname.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {t.confirm}
              </button>
              <button
                onClick={handleCancelNickname}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <Toaster position="top-center" richColors closeButton />

      {/* Instructions & Help */}
      <Instructions
        role={role}
        hasLocations={locations.length > 0}
        hasCandidates={candidates.length > 0}
      />
    </main>
  );
}
