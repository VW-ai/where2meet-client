'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
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
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Logo from '@/components/Logo';
import EventStatusBadge from '@/components/EventStatusBadge';

// Dynamically import MapView to avoid SSR issues with Google Maps
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-200 flex items-center justify-center">Loading map...</div>,
});

function EventPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sseRef = useRef<EventSource | null>(null);
  const { t, language } = useTranslation();

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
  const [authoritativeCircle, setAuthoritativeCircle] = useState<Circle | null>(null); // Backend-provided circle after search
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('rating');
  const [keyword, setKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchRadius, setSearchRadius] = useState(2000); // DEPRECATED: Visual radius - kept for backward compat before search
  const [radiusMultiplier, setRadiusMultiplier] = useState(1.0); // Multiplier for MEC radius: 1.0 to 2.0 (default: 1.0x)
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
  const [routeFromParticipantId, setRouteFromParticipantId] = useState<string | null>(null); // For hosts to view routes from any participant

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
      console.warn('Invalid searchRadius detected:', searchRadius, '- resetting to 2km');
      setSearchRadius(2000);
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
        address: p.name || 'Unnamed',
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

    console.log('🔌 Connecting to SSE for event:', id);

    const eventSource = api.connectSSE(
      id,
      (message) => {
        console.log('📡 SSE message received:', message.event, message);

        switch (message.event) {
          case 'participant_joined':
            console.log('👤 Participant joined - reloading event data');
            loadEventData(id); // Reload all data to show new participant
            const joinedName = message.data?.name || 'Someone';
            toast.success(`${joinedName} ${t.joinedTheEvent || 'joined the event'}!`, { duration: 3000 });
            break;
          case 'participant_updated':
            console.log('✏️ Participant updated - reloading event data');
            loadEventData(id);
            break;
          case 'candidate_added':
            console.log('📍 Candidate added - reloading event data');
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
        console.error('❌ SSE error:', error);
        console.log('🔄 Will reconnect in 5 seconds...');
        // Try to reconnect after 5 seconds
        setTimeout(() => connectSSE(id), 5000);
      }
    );

    sseRef.current = eventSource;
    console.log('✅ SSE connection established');
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
      console.log('🔵 Circle effect: No locations, clearing circle');
      setCentroid(null);
      setCircle(null);
      return;
    }

    // Use custom centroid if available, otherwise compute automatically
    const effectiveCentroid = customCentroid || computeCentroid(locations);
    setCentroid(effectiveCentroid);
    console.log('🔵 Circle effect: Centroid set to', effectiveCentroid);

    // Compute MEC to get the baseline radius
    const mec = computeMinimumEnclosingCircle(locations);
    if (!mec) {
      console.log('🔵 Circle effect: MEC computation failed, clearing circle');
      setCircle(null);
      return;
    }

    console.log('🔵 Circle effect: MEC computed -', { center: mec.center, radius: mec.radius });

    // Use custom centroid for circle center if available, otherwise use MEC center
    const circleCenter = customCentroid || mec.center;

    // Use authoritative circle from backend if available (after search)
    // Otherwise show preview with radiusMultiplier applied
    if (authoritativeCircle) {
      console.log('🔵 Circle effect: Using authoritative circle from backend', authoritativeCircle);
      setCircle(authoritativeCircle);
    } else {
      // Apply radiusMultiplier to MEC radius for preview
      // This shows users what the search area will be BEFORE they click search
      // Use a minimum BASE radius of 1km (1000m) for visibility when MEC is too small
      const MIN_BASE_RADIUS = 1000; // 1km minimum base
      const effectiveMecRadius = Math.max(mec.radius, MIN_BASE_RADIUS);
      const previewRadius = effectiveMecRadius * radiusMultiplier;

      const newCircle = {
        center: circleCenter,
        radius: previewRadius,
      };
      console.log('🔵 Circle effect: Setting preview circle', newCircle, `(MEC: ${(mec.radius/1000).toFixed(2)}km, Base: ${(effectiveMecRadius/1000).toFixed(2)}km, Multiplier: ${radiusMultiplier.toFixed(1)}x, Preview: ${(previewRadius/1000).toFixed(2)}km)`);
      setCircle(newCircle);
    }
  }, [locations, customCentroid, authoritativeCircle, radiusMultiplier]);

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
      // Search using the MEC with user-controlled multiplier
      // The backend will compute the MEC and multiply by radiusMultiplier (1.0-2.0)
      // Include custom centroid if user has dragged the center point
      const searchParams: any = {
        keyword: keyword,
        radius_multiplier: radiusMultiplier,
        only_in_circle: onlyInCircle,
      };

      if (customCentroid) {
        searchParams.custom_center_lat = customCentroid.lat;
        searchParams.custom_center_lng = customCentroid.lng;
        console.log('🎯 Searching with custom center:', customCentroid, 'multiplier:', radiusMultiplier.toFixed(1) + 'x', 'only_in_circle:', onlyInCircle);
      } else {
        console.log('📍 Searching with computed MEC center, multiplier:', radiusMultiplier.toFixed(1) + 'x', 'only_in_circle:', onlyInCircle);
      }

      const response = await api.searchCandidates(eventId, searchParams);

      // Extract candidates and search_area from response
      setCandidates(convertAPICandidates(response.candidates));

      // Update authoritative circle with backend-provided search area
      setAuthoritativeCircle({
        center: {
          lat: response.search_area.center_lat,
          lng: response.search_area.center_lng,
        },
        radius: response.search_area.radius_km * 1000, // Convert km to meters
      });

      // Show toast if center was snapped to land
      if (response.search_area.was_snapped) {
        toast.info('Search center adjusted to nearby land for better results', { duration: 4000 });
      }

      if (response.candidates.length === 0) {
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
    setAuthoritativeCircle(null); // Clear authoritative circle to show preview

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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          {/* Animated logo */}
          <div className="mb-6 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-[#08c605]/10 rounded-full animate-ping"></div>
            </div>
            <div className="relative flex items-center justify-center scale-150 animate-pulse">
              <Logo size="lg" showText={false} />
            </div>
          </div>

          {/* Loading text */}
          <Logo size="lg" showText={true} className="mb-4 justify-center" />
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 bg-[#08c605] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-[#08c605] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-gray-500 font-medium">{t.loadingEvent}</p>
        </div>
      </div>
    );
  }

  // Check for missing API key AFTER initialization
  if (!apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-black/10 max-w-md">
          <h1 className="text-2xl font-bold text-black mb-4">{t.apiKeyMissing}</h1>
          <p className="text-gray-500 mb-4">
            {t.apiKeyMissingMessage} <code className="bg-gray-100 px-2 py-1 rounded text-[#08c605] font-mono">.env.local</code> file:
          </p>
          <pre className="bg-black p-4 rounded text-sm overflow-x-auto text-[#08c605] font-mono border border-[#08c605]/30">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
          </pre>
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen w-screen overflow-hidden relative bg-white">
      {/* Full-Screen Map */}
      <div className="absolute inset-0">
        <MapView
          key={`map-${language}`}
          apiKey={apiKey}
          locations={locations}
          centroid={centroid}
          circle={circle}
          candidates={sortedCandidates()}
          selectedCandidate={selectedCandidate}
          onMapClick={handleMapClick}
          onCandidateClick={setSelectedCandidate}
          myParticipantId={participantId || undefined}
          routeFromParticipantId={routeFromParticipantId}
          travelMode={travelMode}
          onTravelModeChange={setTravelMode}
          onCentroidDrag={handleCentroidDrag}
          isHost={role === 'host'}
          language={language}
        />
      </div>

      {/* Minimalist Header */}
      <header className="absolute top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-black/10 z-10">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="text-black hover:text-[#08c605] transition-colors"
              title="Go back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="h-8 w-px bg-black/10" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-black">{event.title}</h1>
                <EventStatusBadge
                  hasLocations={locations.length > 0}
                  hasCandidates={candidates.length > 0}
                  isFinal={!!event.final_decision}
                />
              </div>
              <p className="text-xs text-gray-500">
                {participants.length} {participants.length === 1 ? 'participant' : 'participants'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {role === 'host' && (
              <button
                onClick={() => setShowShareModal(true)}
                className="px-4 py-2 bg-[#08c605] text-white font-medium text-sm rounded hover:bg-[#06a004] transition-colors"
              >
                Share
              </button>
            )}
            {selectedCandidate && !event.final_decision && role === 'host' && (
              <button
                onClick={handlePublish}
                className="px-4 py-2 bg-black text-white font-medium text-sm rounded hover:bg-gray-800 transition-colors"
              >
                Publish
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Final Decision Banner */}
      {event.final_decision && (
        <div className="absolute top-[57px] left-0 right-0 bg-[#08c605] text-white text-center py-2 px-4 z-10">
          <p className="font-medium text-sm">Final: {event.final_decision}</p>
        </div>
      )}

      {/* Minimalist Left Panel */}
      <div className="absolute left-4 top-20 w-80 max-w-[calc(50vw-2rem)] flex flex-col gap-3 z-10">
        {(!participantId || role === 'host') && (
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-sm border border-black/10 overflow-hidden">
            <div className="p-4">
              <InputPanel
                locations={locations}
                onAddLocation={handleAddLocation}
                onRemoveLocation={handleRemoveLocation}
                onUpdateLocation={handleUpdateLocation}
                myParticipantId={participantId || undefined}
                isHost={role === 'host'}
                selectedCandidate={selectedCandidate}
                routeFromParticipantId={routeFromParticipantId}
                onRouteFromChange={setRouteFromParticipantId}
              />
            </div>
          </div>
        )}

        {/* Search Controls for Host */}
        {role === 'host' && locations.length > 0 && (
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-sm border border-black/10 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-[#08c605]">{radiusMultiplier.toFixed(1)}x</span>
              {customCentroid && (
                <button
                  onClick={handleResetCentroid}
                  className="text-xs text-gray-400 hover:text-[#08c605]"
                >
                  Reset
                </button>
              )}
            </div>
            <input
              type="range"
              min={1.0}
              max={2.0}
              step={0.1}
              value={radiusMultiplier}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                const newMultiplier = Math.min(2.0, Math.max(1.0, value));
                console.log('🎚️ Slider changed: radiusMultiplier', radiusMultiplier, '→', newMultiplier);
                setRadiusMultiplier(newMultiplier);
                setAuthoritativeCircle(null);
                console.log('🎚️ Cleared authoritativeCircle to show preview with new multiplier');
              }}
              className="w-full h-1 bg-black/10 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: '#08c605' }}
            />
          </div>
        )}
      </div>

      {/* Floating Right Panel - Tabbed Interface - Only show if there are candidates */}
      {locations.length > 0 && sortedCandidates().length > 0 && (
        <div className="absolute right-4 top-24 w-80 max-w-[calc(50vw-2rem)] bottom-4 z-10">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-sm overflow-hidden h-full border border-black/10">
            <Tabs
              tabs={[
                {
                  id: 'search',
                  label: 'Search',
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
                  label: 'Add',
                  icon: '➕',
                  content: (
                    <div className="p-4 h-full flex flex-col">
                      <VenueSearchBox
                        apiKey={apiKey}
                        onPlaceSelected={handleAddVenueManually}
                        disabled={!!event?.final_decision}
                      />
                    </div>
                  ),
                },
                {
                  id: 'added',
                  label: 'Saved',
                  icon: '⭐',
                  badge: sortedCandidates().filter(c => c.addedBy === 'organizer').length,
                  content: (
                    <div className="p-3 h-full overflow-y-auto">
                      {sortedCandidates().filter(c => c.addedBy === 'organizer').length === 0 ? (
                        <EmptyState
                          icon="⭐"
                          title="No saved venues"
                          message="Save venues from search results"
                        />
                      ) : (
                        <div className="space-y-2">
                          {sortedCandidates()
                            .filter(c => c.addedBy === 'organizer')
                            .sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))
                            .map((candidate) => (
                              <div
                                key={candidate.id}
                                onClick={() => setSelectedCandidate(candidate)}
                                className={`p-3 rounded-lg cursor-pointer transition-all ${
                                  selectedCandidate?.id === candidate.id
                                    ? 'bg-[#08c605]/10 border-2 border-[#08c605]'
                                    : 'bg-white hover:bg-gray-50 border border-black/10'
                                }`}
                              >
                                <h4 className="font-semibold text-black text-sm">{candidate.name}</h4>
                                <div className="flex items-center gap-3 mt-1.5 text-xs flex-wrap">
                                  {candidate.rating && (
                                    <span className="flex items-center gap-0.5 text-[#08c605] font-medium">
                                      ★ {candidate.rating.toFixed(1)}
                                    </span>
                                  )}
                                  {event?.allow_vote && candidate.voteCount !== undefined && candidate.voteCount > 0 && (
                                    <span className="text-[#08c605] font-medium">
                                      🗳️ {candidate.voteCount}
                                    </span>
                                  )}
                                </div>
                                <div className="mt-2 flex gap-1.5 flex-wrap">
                                  {event?.allow_vote && participantId && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleVote(candidate.id);
                                      }}
                                      className="px-2.5 py-1 bg-[#08c605] text-white text-xs font-medium rounded hover:bg-[#06a004] transition-colors"
                                    >
                                      Vote
                                    </button>
                                  )}
                                  {role === 'host' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUnsaveCandidate(candidate.id);
                                      }}
                                      className="px-2.5 py-1 bg-black text-white text-xs font-medium rounded hover:bg-gray-800 transition-colors"
                                    >
                                      ✕
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
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 border-2 border-[#08c605]" onClick={(e) => e.stopPropagation()}>
            {/* Welcoming Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[#08c605]/10 rounded-full flex items-center justify-center">
                <span className="text-4xl">🤝</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-black mb-2 text-center">{t.shareEventLink}</h3>
            <p className="text-sm text-gray-500 mb-4 text-center">
              Invite participants to join
            </p>
            <div className="bg-black p-3 rounded-lg mb-4 break-all text-sm text-[#08c605] font-mono border border-[#08c605]/30">
              {window.location.origin}/event?id={eventId}&token={joinToken}
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyJoinLink}
                className="flex-1 px-4 py-2 bg-[#08c605] text-black font-bold rounded-lg hover:bg-[#06a004] transition-colors"
              >
                {t.copyLink}
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 px-4 py-2 bg-black text-white font-bold rounded-lg hover:bg-gray-900 transition-colors border border-[#08c605]/30"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nickname Prompt Modal (for map clicks) */}
      {showNicknamePrompt && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50" onClick={handleCancelNickname}>
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl border-2 border-[#08c605]" onClick={(e) => e.stopPropagation()}>
            {/* Welcoming Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[#08c605]/10 rounded-full flex items-center justify-center">
                <span className="text-4xl">👋</span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-black mb-2 text-center">{t.enterNickname}</h3>
            <p className="text-sm text-gray-500 mb-4 text-center">
              {role === 'host'
                ? 'Visible to all participants'
                : 'Your location will appear on the map'}
            </p>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmNickname()}
              placeholder={t.nicknamePlaceholder}
              autoFocus
              className="w-full px-4 py-3 text-black border-2 border-[#08c605]/30 rounded-lg focus:ring-2 focus:ring-[#08c605] focus:border-[#08c605] mb-4 bg-white"
            />
            <div className="flex gap-2">
              <button
                onClick={handleConfirmNickname}
                disabled={!nickname.trim()}
                className="flex-1 px-4 py-2 bg-[#08c605] text-black font-bold rounded-lg hover:bg-[#06a004] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {t.confirm}
              </button>
              <button
                onClick={handleCancelNickname}
                className="flex-1 px-4 py-2 bg-black text-white font-bold rounded-lg hover:bg-gray-900 transition-colors border border-[#08c605]/30"
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

// Loading component for Suspense fallback
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="mb-6 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-[#08c605]/10 rounded-full animate-ping"></div>
          </div>
          <div className="relative flex items-center justify-center scale-150 animate-pulse">
            <Logo size="lg" showText={false} />
          </div>
        </div>
        <Logo size="lg" showText={true} className="mb-4 justify-center" />
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-2 h-2 bg-[#08c605] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-[#08c605] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <p className="text-gray-500 font-medium">Loading...</p>
      </div>
    </div>
  );
}

// Main export with Suspense boundary
export default function EventPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EventPageContent />
    </Suspense>
  );
}
