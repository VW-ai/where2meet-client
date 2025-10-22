'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Toaster, toast } from 'sonner';
import LeftPanel from '@/components/LeftPanel';
import Tabs from '@/components/Tabs';
import EmptyState from '@/components/EmptyState';
import VenueSearchBox from '@/components/VenueSearchBox';
import CandidatesPanel from '@/components/CandidatesPanel';
import Instructions from '@/components/Instructions';
import { Location, Candidate, Circle, SortMode } from '@/types';
import { computeCentroid, computeMinimumEnclosingCircle } from '@/lib/algorithms';
import { api, Event as APIEvent, Participant, Candidate as APICandidate } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Logo from '@/components/Logo';
import { generateUniqueName, extractExistingNames } from '@/lib/nameGenerator';

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
  const [hasAutoSearched, setHasAutoSearched] = useState(false); // Track if auto-search has run
  const [searchType, setSearchType] = useState<'type' | 'name'>('type'); // Search by type or name

  // UI state
  const [isInitializing, setIsInitializing] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [travelMode, setTravelMode] = useState<any>('DRIVING'); // Start with string, will be converted when Google loads
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
      // Generate unique anonymous name
      const existingNames = extractExistingNames(participants);
      const anonymousName = generateUniqueName(existingNames);

      const participant = await api.addParticipant(eventId, {
        lat: location.lat,
        lng: location.lng,
        name: anonymousName,
      });

      // Store participant ID
      sessionStorage.setItem('participantId', participant.id);
      setParticipantId(participant.id);

      // Show success toast with generated name
      toast.success(`Added as ${anonymousName}`);

      // Reload event data to get updated list
      await loadEventData(eventId);
    } catch (err) {
      console.error('Failed to add location:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to add location');
    }
  }, [eventId, participants]);

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

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    // Ignore map clicks right after dragging centroid
    if (isDraggingCentroid) {
      setIsDraggingCentroid(false);
      return;
    }

    // If user already has a participant ID and is not a host, they can't add another location
    if (participantId && role !== 'host') return;

    if (!eventId) return;

    // Show confirmation dialog
    const confirmed = confirm(
      `Add your location at:\n${lat.toFixed(6)}, ${lng.toFixed(6)}?\n\nClick OK to confirm.`
    );

    if (!confirmed) return;

    try {
      // Generate unique anonymous name
      const existingNames = extractExistingNames(participants);
      const anonymousName = generateUniqueName(existingNames);

      // Add participant with anonymous name
      const participant = await api.addParticipant(eventId, {
        lat,
        lng,
        name: anonymousName,
      });

      // Store participant ID
      sessionStorage.setItem('participantId', participant.id);
      setParticipantId(participant.id);

      // Show success toast with generated name
      toast.success(`Added as ${anonymousName}`);

      // Reload event data to get updated list
      await loadEventData(eventId);
    } catch (err) {
      console.error('Failed to add location:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to add location');
    }
  }, [participantId, role, isDraggingCentroid, eventId, participants]);

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

  // Auto-search when 2+ participants and keyword exists
  useEffect(() => {
    if (
      !hasAutoSearched &&
      locations.length >= 2 &&
      keyword.trim() &&
      !isSearching &&
      !isInitializing
    ) {
      console.log('🚀 Auto-search triggered: 2+ participants, keyword exists');
      searchPlaces();
      setHasAutoSearched(true);
    }
  }, [locations.length, keyword, hasAutoSearched, isSearching, isInitializing, searchPlaces]);

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

  // Handler functions for new LeftPanel component
  const handleJoinEvent = useCallback(async (data: { name: string; lat: number; lng: number; blur: boolean }) => {
    if (!eventId) return;

    try {
      const participant = await api.addParticipant(eventId, {
        lat: data.lat,
        lng: data.lng,
        name: data.name,
      });

      // Store participant ID
      sessionStorage.setItem('participantId', participant.id);
      setParticipantId(participant.id);

      toast.success(`Joined as ${data.name}`);

      // Reload event data
      await loadEventData(eventId);
    } catch (err) {
      console.error('Failed to join event:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to join event');
      throw err;
    }
  }, [eventId]);

  const handleEditOwnLocation = useCallback(async (data: { name?: string; lat?: number; lng?: number }) => {
    if (!eventId || !participantId) return;

    try {
      await api.updateParticipant(eventId, participantId, data);
      await loadEventData(eventId);
      toast.success('Location updated');
    } catch (err) {
      console.error('Failed to update location:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update location');
      throw err;
    }
  }, [eventId, participantId]);

  const handleRemoveOwnLocation = useCallback(async () => {
    if (!eventId || !participantId) return;

    try {
      await api.removeParticipant(eventId, participantId);
      sessionStorage.removeItem('participantId');
      setParticipantId(null);
      await loadEventData(eventId);
      toast.success('Location removed');
    } catch (err) {
      console.error('Failed to remove location:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to remove location');
    }
  }, [eventId, participantId]);

  const handleParticipantClick = useCallback((participantId: string) => {
    // Find the participant
    const participant = participants.find(p => p.id === participantId);
    if (!participant) return;

    // Pan map to their location (will be implemented in MapView)
    console.log('Focus on participant:', participantId, participant);
    // TODO: Add map pan functionality
  }, [participants]);

  // Show enhanced loading screen during initialization
  if (isInitializing || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          {/* Animated logo */}
          <div className="mb-6 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-blue-500/10 rounded-full animate-ping"></div>
            </div>
            <div className="relative flex items-center justify-center scale-150 animate-pulse">
              <Logo size="lg" showText={false} />
            </div>
          </div>

          {/* Loading text */}
          <Logo size="lg" showText={true} className="mb-4 justify-center" />
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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

      {/* Floating Header */}
      <header className="absolute top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-lg z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="hover:opacity-80 transition-opacity"
              title="Go back to main page"
            >
              <Logo size="md" showText={false} />
            </button>
            <LanguageSwitcher />
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
              <div className="flex items-center gap-4 relative">
                {/* Animated Arrow & Instruction - Left of Share Button */}
                {participants.length <= 1 && (
                  <div className="flex items-center gap-2 animate-pulse">
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-bold whitespace-nowrap">
                      Invite people with a link!
                    </div>
                    <svg className="w-8 h-8 text-blue-600 transform -translate-x-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 relative group"
                  title="Share this link to invite people to join your event"
                >
                  <span className="flex items-center gap-2">
                    🔗 {t.shareLink}
                  </span>
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 right-0 bg-gray-900 text-white text-xs px-3 py-2 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20">
                    Share link to invite participants
                  </div>
                </button>
                {selectedCandidate && !event.final_decision && (
                  <button
                    onClick={handlePublish}
                    className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                  >
                    {t.publishDecision}
                  </button>
                )}
              </div>
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

      {/* New Unified Left Panel */}
      <div className="absolute left-4 top-24 z-10">
        <LeftPanel
          // Input Section
          isJoined={!!participantId}
          onJoinEvent={handleJoinEvent}
          onEditLocation={handleEditOwnLocation}
          onRemoveOwnLocation={handleRemoveOwnLocation}
          currentUserName={participants.find(p => p.id === participantId)?.name}
          currentUserLocation={participants.find(p => p.id === participantId) ?
            `${participants.find(p => p.id === participantId)?.lat.toFixed(4)}, ${participants.find(p => p.id === participantId)?.lng.toFixed(4)}` :
            undefined
          }
          isHost={role === 'host'}

          // Venues Section
          keyword={keyword}
          onKeywordChange={setKeyword}
          onSearch={searchPlaces}
          isSearching={isSearching}
          searchType={searchType}
          onSearchTypeChange={setSearchType}
          sortMode={sortMode}
          onSortChange={setSortMode}
          onlyInCircle={onlyInCircle}
          onOnlyInCircleChange={setOnlyInCircle}
          candidates={candidates}
          selectedCandidate={selectedCandidate}
          onCandidateClick={setSelectedCandidate}
          onVote={handleVote}
          participantId={participantId || undefined}
          onSaveCandidate={handleSaveCandidate}
          onRemoveCandidate={handleRemoveCandidate}
          hasAutoSearched={hasAutoSearched}

          // Participation Section
          participants={participants}
          myParticipantId={participantId || undefined}
          onParticipantClick={handleParticipantClick}
          onRemoveParticipant={role === 'host' ? handleRemoveLocation : undefined}
        />
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
                            .sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center">
        <div className="mb-6 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-blue-500/10 rounded-full animate-ping"></div>
          </div>
          <div className="relative flex items-center justify-center scale-150 animate-pulse">
            <Logo size="lg" showText={false} />
          </div>
        </div>
        <Logo size="lg" showText={true} className="mb-4 justify-center" />
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <p className="text-gray-600 font-medium">Loading...</p>
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
