'use client';

import { useState, useEffect, useCallback, useRef, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Toaster, toast } from 'sonner';
import LeftPanel from '@/components/LeftPanel';
import Instructions from '@/components/Instructions';
import { Location, Candidate, Circle, SortMode } from '@/types';
import { computeCentroid, computeMinimumEnclosingCircle } from '@/lib/algorithms';
import { api, Event as APIEvent, Participant, Candidate as APICandidate } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import Logo from '@/components/Logo';
import { generateUniqueName, extractExistingNames } from '@/lib/nameGenerator';
import TravelChart from '@/components/TravelChart';
import { ChevronUp, ChevronDown, Heart } from 'lucide-react';

// Dynamically import MapView to avoid SSR issues with Google Maps
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-200 flex items-center justify-center">Loading map...</div>,
});

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Participant color palette (blue/green shades - matches ParticipationSection)
const PARTICIPANT_COLORS = [
  '#10b981', // emerald
  '#0d9488', // teal
  '#f59e0b', // amber
  '#9333ea', // purple
  '#ec4899', // pink
  '#3b82f6', // blue
];

// Candidate/Location color palette (red shades - distinguishable from participants)
const CANDIDATE_COLORS = [
  '#ef4444', // red-500
  '#dc2626', // red-600
  '#f97316', // orange-500
  '#ea580c', // orange-600
  '#fb923c', // orange-400
  '#f87171', // red-400
];

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
  const [circleRadiusKm, setCircleRadiusKm] = useState(1); // Direct circle radius control in km (0.5-2km)
  const [onlyInCircle, setOnlyInCircle] = useState(true); // Filter search results to MEC circle only
  const [hasAutoSearched, setHasAutoSearched] = useState(false); // Track if auto-search has run
  const [myVotedCandidateIds, setMyVotedCandidateIds] = useState<Set<string>>(new Set()); // Track which candidates current user voted for
  const [myVotes, setMyVotes] = useState<Map<string, string>>(new Map()); // Map: candidateId -> voteId

  // UI state
  const [isInitializing, setIsInitializing] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [travelMode, setTravelMode] = useState<any>('DRIVING'); // Start with string, will be converted when Google loads
  const [isDraggingCentroid, setIsDraggingCentroid] = useState(false);
  const [routeFromParticipantId, setRouteFromParticipantId] = useState<string | null>(null); // For hosts to view routes from any participant
  const [showParticipantNames, setShowParticipantNames] = useState(true); // Toggle for showing participant names on map
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null); // For two-way binding with participant list
  const [chartTravelMode, setChartTravelMode] = useState<any>('DRIVING'); // Travel mode for chart in location detail view
  const [participantTravelData, setParticipantTravelData] = useState<Map<string, { distance: number; duration: number }>>(new Map()); // Travel data for chart
  const [candidatePhotoCache, setCandidatePhotoCache] = useState<Map<string, string | null>>(new Map()); // Cache for candidate photos
  const [showTravelChart, setShowTravelChart] = useState(false); // Show/hide travel chart as separate view
  const [showPublishConfirm, setShowPublishConfirm] = useState(false); // Custom publish confirmation modal
  const [candidateEditorialSummary, setCandidateEditorialSummary] = useState<string | null>(null); // Editorial summary for selected candidate
  const [candidateOpeningHours, setCandidateOpeningHours] = useState<any>(null); // Opening hours for selected candidate
  const [isAboutExpanded, setIsAboutExpanded] = useState(true); // Collapsible About section
  const [isHoursExpanded, setIsHoursExpanded] = useState(true); // Collapsible Hours section
  const [showLocationConfirm, setShowLocationConfirm] = useState(false); // Custom location confirmation modal
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number; address: string | null } | null>(null); // Temporary clicked location

  // Create participant colors map
  const participantColors = useMemo(() => {
    const colorMap = new Map<string, string>();
    participants.forEach((participant, index) => {
      colorMap.set(participant.id, PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length]);
    });
    return colorMap;
  }, [participants]);

  // Create candidate/location colors map
  const candidateColors = useMemo(() => {
    const colorMap = new Map<string, string>();
    candidates.forEach((candidate, index) => {
      colorMap.set(candidate.id, CANDIDATE_COLORS[index % CANDIDATE_COLORS.length]);
    });
    return colorMap;
  }, [candidates]);

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
  const loadEventData = async (id: string, currentParticipantId?: string | null) => {
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

      // Convert participants to locations
      // Use ACTUAL coordinates (not fuzzy) for circle calculation
      // The circle represents the optimal meeting area based on real distances
      const locs: Location[] = participantData.map((p) => ({
        id: p.id,
        lat: p.lat,  // Use actual lat for circle calculation
        lng: p.lng,  // Use actual lng for circle calculation
        address: p.name || `Participant ${p.id.slice(0, 8)}`,
        name: p.name,
      }));
      console.log('📍 loadEventData: Setting locations from participants', locs);
      setLocations(locs);

      // Load candidates if any
      const candidateData = await api.getCandidates(id);
      setCandidates(convertAPICandidates(candidateData));

      // Load current user's votes if they're a participant
      // Use passed parameter or fall back to state
      const pId = currentParticipantId ?? participantId;
      if (pId && pId.trim()) {
        try {
          const votes = await api.getVotes(id, pId);
          const votedIds = new Set(votes.map(v => v.candidate_id));
          const votesMap = new Map(votes.map(v => [v.candidate_id, v.id]));
          setMyVotedCandidateIds(votedIds);
          setMyVotes(votesMap);
        } catch (err) {
          console.error('Failed to load votes:', err);
          // Don't fail the whole load if votes fail
        }
      } else {
        // Clear votes if no participant
        setMyVotedCandidateIds(new Set());
        setMyVotes(new Map());
      }
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
    return apiCandidates.map((c) => {
      const photoRef = (c as any).photo_reference;
      if (photoRef) {
        console.log('📸 Photo reference found for', c.name, ':', photoRef);
      }
      return {
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
        photoReference: photoRef,
      };
    });
  };

  // Fetch photo when a candidate is selected
  useEffect(() => {
    if (!selectedCandidate || !eventId) return;

    // Check if we already have the photo reference
    if (selectedCandidate.photoReference) return;

    // Check cache first
    const cached = candidatePhotoCache.get(selectedCandidate.id);
    if (cached !== undefined) {
      // Update the selected candidate with cached photo
      const photoRef = cached || undefined;
      setSelectedCandidate({ ...selectedCandidate, photoReference: photoRef });
      return;
    }

    // Fetch photo from backend
    const fetchPhoto = async () => {
      try {
        console.log('📸 Fetching photo for', selectedCandidate.name);
        const response = await api.getCandidatePhoto(eventId, selectedCandidate.id);
        const photoRef = response.photo_reference || undefined;

        // Update cache
        setCandidatePhotoCache(prev => new Map(prev).set(selectedCandidate.id, photoRef || null));

        // Update the selected candidate
        setSelectedCandidate({ ...selectedCandidate, photoReference: photoRef });

        // Update the candidate in the candidates list too
        setCandidates(prev => prev.map(c =>
          c.id === selectedCandidate.id ? { ...c, photoReference: photoRef } : c
        ));

        console.log('📸 Photo loaded:', photoRef ? 'Yes' : 'No photo available');
      } catch (error) {
        console.error('❌ Failed to fetch photo:', error);
        setCandidatePhotoCache(prev => new Map(prev).set(selectedCandidate.id, null));
      }
    };

    fetchPhoto();
  }, [selectedCandidate?.id, eventId]);

  // Fetch editorial summary and opening hours when a candidate is selected
  useEffect(() => {
    if (!selectedCandidate || !eventId) {
      setCandidateEditorialSummary(null);
      setCandidateOpeningHours(null);
      setShowTravelChart(false); // Close travel chart when changing venues
      return;
    }

    const fetchDetails = async () => {
      try {
        console.log('📝 Fetching details for', selectedCandidate.name);
        const response = await api.getCandidateDetails(eventId, selectedCandidate.id);
        setCandidateEditorialSummary(response.editorial_summary);
        setCandidateOpeningHours(response.opening_hours);
        console.log('📝 Details loaded - Summary:', response.editorial_summary ? 'Yes' : 'No', '| Hours:', response.opening_hours ? 'Yes' : 'No');
      } catch (error) {
        console.error('❌ Failed to fetch candidate details:', error);
        setCandidateEditorialSummary(null);
        setCandidateOpeningHours(null);
      }
    };

    fetchDetails();
  }, [selectedCandidate?.id, eventId]);

  // Recompute centroid and circle with 2-second debounce
  useEffect(() => {
    console.log('🔵 Circle effect triggered - locations:', locations.length, 'customCentroid:', customCentroid, 'authCircle:', authoritativeCircle);

    if (locations.length === 0) {
      console.log('🔵 Circle effect: No locations, clearing circle');
      setCentroid(null);
      setCircle(null);
      return;
    }

    // Debounce: Wait 2 seconds before recalculating circle
    console.log('⏱️ Circle recalculation scheduled in 2 seconds...');
    const timeoutId = setTimeout(() => {
      console.log('🔵 Circle recalculation starting now (after 2s delay)');

      // Use custom centroid if available, otherwise compute automatically
      const effectiveCentroid = customCentroid || computeCentroid(locations);
      setCentroid(effectiveCentroid);
      console.log('🔵 Circle effect: Centroid set to', effectiveCentroid, 'from locations:', locations.map(l => ({ lat: l.lat, lng: l.lng })));

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
      // Otherwise show preview with direct circleRadiusKm
      if (authoritativeCircle) {
        console.log('🔵 Circle effect: Using authoritative circle from backend', authoritativeCircle);
        setCircle(authoritativeCircle);
      } else {
        // Use direct circleRadiusKm value (1-20km range) for preview circle
        const previewRadius = circleRadiusKm * 1000; // Convert km to meters

        const newCircle = {
          center: circleCenter,
          radius: previewRadius,
        };
        console.log('🔵 Circle effect: Setting preview circle', newCircle, `(Circle Radius: ${circleRadiusKm.toFixed(1)}km)`);
        setCircle(newCircle);
      }
    }, 2000); // 2 second delay

    // Cleanup: Cancel pending recalculation if locations change again
    return () => {
      console.log('⏱️ Circle recalculation cancelled (locations changed before timeout)');
      clearTimeout(timeoutId);
    };
  }, [locations, customCentroid, authoritativeCircle, circleRadiusKm]);

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
    // Unselect candidate when clicking empty space on map
    if (selectedCandidate) {
      setSelectedCandidate(null);
      return;
    }

    // Unselect participant when clicking empty space on map
    if (selectedParticipantId) {
      setSelectedParticipantId(null);
      return;
    }

    // Ignore map clicks right after dragging centroid
    if (isDraggingCentroid) {
      setIsDraggingCentroid(false);
      return;
    }

    // If user already has a participant ID and is not a host, they can't add another location
    if (participantId && role !== 'host') return;

    if (!eventId) return;

    // Fetch address via reverse geocoding
    let address: string | null = null;
    try {
      const geocodeResult = await api.reverseGeocode(lat, lng);
      address = geocodeResult.address;

      // If we got snapped coordinates (nearest building), use those instead of raw click
      if (geocodeResult.lat !== lat || geocodeResult.lng !== lng) {
        console.log('📍 Snapped to nearest address:', {
          original: { lat, lng },
          snapped: { lat: geocodeResult.lat, lng: geocodeResult.lng },
          address
        });
        lat = geocodeResult.lat;
        lng = geocodeResult.lng;
      }
    } catch (err) {
      console.warn('Failed to fetch address, using coordinates only:', err);
    }

    // Set clicked location and show custom modal
    setClickedLocation({ lat, lng, address });
    setShowLocationConfirm(true);
  }, [participantId, role, isDraggingCentroid, eventId, selectedCandidate, selectedParticipantId]);

  // Confirm location selection from modal
  const confirmLocationSelection = useCallback(async () => {
    if (!clickedLocation || !eventId) return;

    try {
      // Generate unique anonymous name
      const existingNames = extractExistingNames(participants);
      const anonymousName = generateUniqueName(existingNames);

      // Add participant with anonymous name
      const participant = await api.addParticipant(eventId, {
        lat: clickedLocation.lat,
        lng: clickedLocation.lng,
        name: anonymousName,
        address: clickedLocation.address || undefined,
      });

      // Store participant ID
      sessionStorage.setItem('participantId', participant.id);
      setParticipantId(participant.id);

      // Close modal
      setShowLocationConfirm(false);
      setClickedLocation(null);

      // Show success toast with generated name
      toast.success(`Added as ${anonymousName}`);

      // Reload event data to get updated list
      await loadEventData(eventId);
    } catch (err) {
      console.error('Failed to add location:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to add location');
    }
  }, [clickedLocation, eventId, participants]);

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
      // Calculate multiplier based on desired circleRadiusKm and MEC radius
      // Compute MEC to determine baseline
      const mec = computeMinimumEnclosingCircle(locations);
      const MIN_BASE_RADIUS_KM = 1; // 1km minimum
      const mecRadiusKm = mec ? mec.radius / 1000 : MIN_BASE_RADIUS_KM;
      const effectiveMecRadiusKm = Math.max(mecRadiusKm, MIN_BASE_RADIUS_KM);

      // Calculate multiplier: desired km / MEC km
      const calculatedMultiplier = circleRadiusKm / effectiveMecRadiusKm;

      // Include custom centroid if user has dragged the center point
      const searchParams: any = {
        keyword: keyword,
        radius_multiplier: calculatedMultiplier,
        only_in_circle: onlyInCircle,
      };

      if (customCentroid) {
        searchParams.custom_center_lat = customCentroid.lat;
        searchParams.custom_center_lng = customCentroid.lng;
        console.log('🎯 Searching with custom center:', customCentroid, 'radius:', circleRadiusKm.toFixed(1) + 'km', 'only_in_circle:', onlyInCircle);
      } else {
        console.log('📍 Searching with computed MEC center, radius:', circleRadiusKm.toFixed(1) + 'km', 'only_in_circle:', onlyInCircle);
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
  }, [eventId, keyword, customCentroid, onlyInCircle, t, circleRadiusKm, locations]);

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

    const isCurrentlyVoted = myVotedCandidateIds.has(candidateId);
    const voteId = myVotes.get(candidateId);

    // Optimistically update UI
    setMyVotedCandidateIds(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyVoted) {
        newSet.delete(candidateId);
      } else {
        newSet.add(candidateId);
      }
      return newSet;
    });

    if (isCurrentlyVoted) {
      // Also optimistically update the votes map
      setMyVotes(prev => {
        const newMap = new Map(prev);
        newMap.delete(candidateId);
        return newMap;
      });
    }

    try {
      if (isCurrentlyVoted && voteId) {
        // Remove existing vote
        await api.removeVote(eventId, voteId, participantId);
      } else {
        // Cast new vote
        await api.castVote(eventId, participantId, candidateId);
      }
      // Reload to get updated vote counts from server
      await loadEventData(eventId, participantId);
    } catch (err) {
      console.error('Failed to vote:', err);
      // Revert optimistic update on error
      setMyVotedCandidateIds(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyVoted) {
          newSet.add(candidateId);
        } else {
          newSet.delete(candidateId);
        }
        return newSet;
      });
      if (isCurrentlyVoted && voteId) {
        // Revert the votes map as well
        setMyVotes(prev => {
          const newMap = new Map(prev);
          newMap.set(candidateId, voteId);
          return newMap;
        });
      }
      toast.error(err instanceof Error ? err.message : 'Failed to vote');
    }
  }, [eventId, participantId, event, myVotedCandidateIds, myVotes]);

  // Show publish confirmation modal
  const handlePublish = useCallback(() => {
    if (!eventId || role !== 'host' || !selectedCandidate) {
      toast.info(t.pleaseSelectVenue);
      return;
    }
    setShowPublishConfirm(true);
  }, [eventId, role, selectedCandidate, t]);

  // Confirm and publish final decision
  const confirmPublish = useCallback(async () => {
    if (!eventId || !selectedCandidate) return;

    try {
      await api.publishEvent(eventId, selectedCandidate.name);
      await loadEventData(eventId);
      setShowPublishConfirm(false);
      toast.success(t.finalDecisionPublished);
    } catch (err) {
      console.error('Failed to publish:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to publish');
    }
  }, [eventId, selectedCandidate, t, loadEventData]);

  // Unpublish final decision
  const handleUnpublish = useCallback(async () => {
    if (!eventId || role !== 'host') return;

    try {
      await api.unpublishEvent(eventId);
      await loadEventData(eventId);
      toast.success('Decision unpublished successfully');
    } catch (err) {
      console.error('Failed to unpublish:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to unpublish');
    }
  }, [eventId, role, loadEventData]);

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

      // Automatically vote for the venue if user is a participant, voting is enabled, and they haven't voted yet
      if (participantId && event?.allow_vote && !myVotedCandidateIds.has(candidateId)) {
        try {
          await api.castVote(eventId, participantId, candidateId);
        } catch (voteErr: any) {
          console.error('Failed to auto-vote:', voteErr);
          // Don't show error to user - saving is the main action
        }
      }

      await loadEventData(eventId);
      toast.success(participantId && event?.allow_vote && !myVotedCandidateIds.has(candidateId) ? 'Venue added and voted!' : 'Venue saved to list');
    } catch (err) {
      console.error('Failed to save venue:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save venue');
    }
  }, [eventId, participantId, event, myVotedCandidateIds]);

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
      // Fetch address via reverse geocoding if privacy mode is OFF
      let address: string | undefined;
      if (!data.blur) {
        try {
          const geocodeResult = await api.reverseGeocode(data.lat, data.lng);
          if (geocodeResult.address) {
            address = geocodeResult.address;
          }
        } catch (geocodeErr) {
          console.warn('Failed to fetch address, continuing without it:', geocodeErr);
        }
      }

      const participant = await api.addParticipant(eventId, {
        lat: data.lat,
        lng: data.lng,
        name: data.name,
        address: address,
        visibility: data.blur ? 'blur' : 'show',  // Per-participant visibility
      });

      // Store participant ID
      sessionStorage.setItem('participantId', participant.id);
      setParticipantId(participant.id);

      // Clear authoritative circle when new participant joins
      setAuthoritativeCircle(null);

      toast.success(`Joined as ${data.name}`);

      // Reload event data
      await loadEventData(eventId);
    } catch (err) {
      console.error('Failed to join event:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to join event');
      throw err;
    }
  }, [eventId]);

  const handleEditOwnLocation = useCallback(async (data: { name?: string; lat?: number; lng?: number; blur?: boolean }) => {
    if (!eventId || !participantId) return;

    try {
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.lat !== undefined) updateData.lat = data.lat;
      if (data.lng !== undefined) updateData.lng = data.lng;
      if (data.blur !== undefined) {
        updateData.visibility = data.blur ? 'blur' : 'show';
      }

      // Fetch address via reverse geocoding if coordinates changed and privacy mode is OFF
      if (data.lat !== undefined && data.lng !== undefined && !data.blur) {
        try {
          const geocodeResult = await api.reverseGeocode(data.lat, data.lng);
          if (geocodeResult.address) {
            updateData.address = geocodeResult.address;
          }
        } catch (geocodeErr) {
          console.warn('Failed to fetch address, continuing without it:', geocodeErr);
        }
      }

      await api.updateParticipant(eventId, participantId, updateData);

      // Clear authoritative circle when participant location changes
      // This forces recalculation based on new participant positions
      setAuthoritativeCircle(null);

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

      // Clear authoritative circle when participant is removed
      setAuthoritativeCircle(null);

      await loadEventData(eventId);
      toast.success('Location removed');
    } catch (err) {
      console.error('Failed to remove location:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to remove location');
    }
  }, [eventId, participantId]);

  const handleParticipantClick = useCallback((participantId: string) => {
    // Toggle selection: if clicking already selected participant, unselect it
    if (selectedParticipantId === participantId) {
      setSelectedParticipantId(null);
      return;
    }

    // Find the participant
    const participant = participants.find(p => p.id === participantId);
    if (!participant) return;

    // Set selected participant for two-way binding (will highlight and center on map)
    setSelectedParticipantId(participantId);

    // Pan map to their location by triggering MapView to center on this participant
    // MapView will handle the actual centering via the selectedParticipantId prop
  }, [participants, selectedParticipantId]);

  const handleCircleRadiusChange = useCallback((radiusKm: number) => {
    setCircleRadiusKm(radiusKm);
    // Clear authoritative circle to show the new preview with updated radius
    setAuthoritativeCircle(null);
  }, []);

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
          onCandidateClick={(candidate) => {
            // Toggle selection: if clicking already selected candidate, unselect it
            if (selectedCandidate?.id === candidate.id) {
              setSelectedCandidate(null);
            } else {
              setSelectedCandidate(candidate);
            }
          }}
          myParticipantId={participantId || undefined}
          routeFromParticipantId={selectedCandidate && selectedParticipantId ? selectedParticipantId : routeFromParticipantId}
          travelMode={selectedCandidate && selectedParticipantId ? chartTravelMode : travelMode}
          onTravelModeChange={setTravelMode}
          onCentroidDrag={handleCentroidDrag}
          isHost={role === 'host'}
          language={language}
          participantColors={participantColors}
          candidateColors={candidateColors}
          showParticipantNames={showParticipantNames}
          selectedParticipantId={selectedParticipantId}
          chartRouteMode={selectedCandidate && selectedParticipantId ? true : false}
        />
      </div>

      {/* Final Decision Banner - Brutalist/Techno Style */}
      {event.final_decision && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-50 max-w-2xl">
          <div className="bg-black text-white px-6 py-2 border-b-4 border-black flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="font-bold text-xs uppercase tracking-wider">{t.finalDecision}</p>
          </div>
          <div className="px-6 py-4">
            <p className="font-bold text-xl text-black uppercase text-center">{event.final_decision}</p>
          </div>
        </div>
      )}

      {/* New Unified Left Panel */}
      <div className="absolute left-0 top-0 z-10">
        <LeftPanel
          // TopView
          eventTitle={event?.title}
          eventId={eventId || undefined}
          token={joinToken || undefined}
          finalDecision={event?.final_decision}
          onPublishDecision={handlePublish}
          onUnpublishDecision={handleUnpublish}

          // Input Section
          isJoined={!!participantId && participants.some(p => p.id === participantId)}
          onJoinEvent={handleJoinEvent}
          onEditLocation={handleEditOwnLocation}
          onRemoveOwnLocation={handleRemoveOwnLocation}
          currentParticipant={participants.find(p => p.id === participantId)}
          isHost={role === 'host'}

          // Venues Section
          keyword={keyword}
          onKeywordChange={setKeyword}
          onSearch={searchPlaces}
          isSearching={isSearching}
          sortMode={sortMode}
          onSortChange={setSortMode}
          onlyInCircle={onlyInCircle}
          onOnlyInCircleChange={setOnlyInCircle}
          candidates={candidates}
          selectedCandidate={selectedCandidate}
          onCandidateClick={(candidate) => {
            // Toggle selection: if clicking already selected candidate, unselect it
            if (selectedCandidate?.id === candidate.id) {
              setSelectedCandidate(null);
            } else {
              setSelectedCandidate(candidate);
            }
          }}
          onVote={handleVote}
          onDownvote={handleVote}
          participantId={participantId || undefined}
          myVotedCandidateIds={myVotedCandidateIds}
          onSaveCandidate={handleSaveCandidate}
          onRemoveCandidate={handleRemoveCandidate}
          hasAutoSearched={hasAutoSearched}
          candidateColors={candidateColors}

          // Participation Section
          participants={participants}
          myParticipantId={participantId || undefined}
          selectedParticipantId={selectedParticipantId}
          onParticipantClick={handleParticipantClick}
          onRemoveParticipant={role === 'host' ? handleRemoveLocation : undefined}
          showParticipantNames={showParticipantNames}
          onToggleShowNames={setShowParticipantNames}
        />
      </div>

      {/* Venue Detail Panel - Middle Right (when venue selected) */}
      {selectedCandidate && (
        <div className="fixed bottom-64 right-6 w-96 h-[40 vh] bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-20 flex flex-col">
          {/* Header with Photo Background */}
          <div
            className="relative flex items-center justify-between px-4 py-3 bg-black text-white border-b-2 border-black h-32"
            style={{
              backgroundImage: selectedCandidate.photoReference
                ? `url(https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${selectedCandidate.photoReference}&key=${apiKey})`
                : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-black/50"></div>

            {/* Content */}
            <div className="relative flex items-center justify-between w-full">
              <h3 className="font-bold text-sm uppercase truncate flex-1 text-white drop-shadow-lg">{selectedCandidate.name}</h3>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="ml-2 hover:bg-white hover:text-black w-6 h-6 flex items-center justify-center transition-all bg-black/50 backdrop-blur-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Rating, Distance, and Vote */}
            <div className="flex items-center justify-between mb-3 text-xs text-black">
              {/* Left side: Rating and Distance */}
              <div className="flex items-center gap-3">
                {selectedCandidate.rating && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-bold text-black">{selectedCandidate.rating.toFixed(1)}</span>
                    {selectedCandidate.userRatingsTotal && (
                      <span className="text-black">({selectedCandidate.userRatingsTotal})</span>
                    )}
                  </div>
                )}
                {selectedCandidate.distanceFromCenter && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-bold text-black">{(selectedCandidate.distanceFromCenter / 1000).toFixed(2)} km</span>
                  </div>
                )}
              </div>

              {/* Right side: Chart Button and Vote Button */}
              <div className="flex items-center gap-2">
                {/* Chart Button */}
                {participants.length > 0 && (
                  <button
                    onClick={() => setShowTravelChart(!showTravelChart)}
                    className={`p-1.5 border-2 border-black transition-all ${
                      showTravelChart ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                    }`}
                    title="Travel Analysis"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </button>
                )}

                {/* Vote Button */}
                {participantId && (
                  <button
                    onClick={() => handleVote(selectedCandidate.id)}
                    className="flex items-center gap-1 hover:opacity-70 transition-opacity"
                  >
                    <Heart className={`w-5 h-5 ${
                      myVotedCandidateIds.has(selectedCandidate.id)
                        ? 'fill-black text-black'
                        : 'text-neutral-400'
                    }`} />
                    <span className="font-bold text-sm text-black">
                      {selectedCandidate.voteCount || 0}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Address */}
            {selectedCandidate.vicinity && (
              <div className="mb-3">
                <p className="text-xs text-black">{selectedCandidate.vicinity}</p>
              </div>
            )}

            {/* About / Editorial Summary Section */}
            {candidateEditorialSummary && (
              <div className="border-t-2 border-black pt-3 mb-3">
                <button
                  onClick={() => setIsAboutExpanded(!isAboutExpanded)}
                  className="flex items-center gap-1.5 hover:opacity-70 transition-opacity w-full mb-2"
                >
                  {isAboutExpanded ? (
                    <ChevronUp className="w-3 h-3 text-black" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-black" />
                  )}
                  <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="text-xs font-bold uppercase text-black">About</h4>
                </button>
                {isAboutExpanded && (
                  <div className="text-xs text-black leading-relaxed">
                    {candidateEditorialSummary}
                  </div>
                )}
              </div>
            )}

            {/* Opening Hours */}
            {candidateOpeningHours && (
              <div className="border-t-2 border-black pt-3 mb-3">
                <button
                  onClick={() => setIsHoursExpanded(!isHoursExpanded)}
                  className="flex items-center gap-1.5 hover:opacity-70 transition-opacity w-full mb-2"
                >
                  {isHoursExpanded ? (
                    <ChevronUp className="w-3 h-3 text-black" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-black" />
                  )}
                  <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="text-xs font-bold uppercase text-black">Hours</h4>
                </button>
                {isHoursExpanded && candidateOpeningHours.weekday_text && (
                  <div className="text-xs text-black space-y-1">
                    {candidateOpeningHours.weekday_text.map((day: string, index: number) => (
                      <div key={index} className="leading-relaxed">{day}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Google Maps Link */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${selectedCandidate.lat},${selectedCandidate.lng}&query_place_id=${selectedCandidate.placeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-black text-white text-xs font-bold uppercase border-2 border-black hover:bg-white hover:text-black transition-all"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              Google Map
            </a>
          </div>
        </div>
      )}

      {/* Travel Analysis View - Separate view below detail card */}
      {showTravelChart && selectedCandidate && participants.length > 0 && (
        <div className="absolute top-16 right-6 w-96 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-30 max-h-[calc(100vh-5rem)] flex flex-col">
          {/* Header */}
          <div className="bg-black text-white px-4 py-3 border-b-4 border-black flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase">Travel Analysis</h3>
            <button
              onClick={() => setShowTravelChart(false)}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Transportation Mode Selector */}
            <div className="flex gap-1 mb-4 justify-center">
              {(['DRIVING', 'TRANSIT', 'WALKING', 'BICYCLING'] as const).map((mode) => {
                const icons = {
                  DRIVING: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M3 7h18M5 7v10l2-1 2 1 2-1 2 1 2-1 2 1V7',
                  TRANSIT: 'M5 13v6M5 5v6M5 11h14M19 5v14M12 8v5M8 8v5M16 8v5',
                  WALKING: 'M16 7a2 2 0 11-4 0 2 2 0 014 0zM12 14l-2 6M12 14l2 6M12 14V9M10 9l2-2 2 2',
                  BICYCLING: 'M5 19a3 3 0 100-6 3 3 0 000 6zM19 19a3 3 0 100-6 3 3 0 000 6zM7 8l4 8M11 8h4l-1 4',
                };
                const isActive = chartTravelMode === mode ||
                  (typeof chartTravelMode === 'object' && chartTravelMode?.toString() === mode);

                return (
                  <button
                    key={mode}
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.google?.maps?.TravelMode) {
                        setChartTravelMode((google.maps.TravelMode as any)[mode]);
                      } else {
                        setChartTravelMode(mode);
                      }
                    }}
                    className={`p-1.5 border-2 border-black transition-all ${
                      isActive ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                    }`}
                    title={mode}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={icons[mode]} />
                    </svg>
                  </button>
                );
              })}
            </div>

            {/* Travel Chart */}
            <TravelChart
              participants={participants}
              selectedCandidate={selectedCandidate}
              participantColors={participantColors}
              travelMode={chartTravelMode}
              apiKey={apiKey}
              selectedParticipantId={selectedParticipantId}
              onParticipantClick={handleParticipantClick}
            />
          </div>
        </div>
      )}

      {/* Circle Radius Controller - Bottom Right (All joined users) */}
      {participantId && !selectedCandidate && (
        <div className={`fixed right-6 z-20 ${role === 'host' ? 'bottom-6' : 'bottom-6'}`}>
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-4 py-3 min-w-[280px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-black">Search Radius</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-black">{circleRadiusKm.toFixed(1)} km</span>
                <div className="group relative">
                  <svg className="w-3.5 h-3.5 text-black cursor-help" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4M12 8h.01"/>
                  </svg>
                  <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-56 px-3 py-2 bg-black text-white text-xs border-2 border-black shadow-lg z-10">
                    Search area radius (0.5-2km). Adjust before searching. Larger = more venues, further distance.
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCircleRadiusChange(Math.max(0.5, circleRadiusKm - 0.1))}
                className="px-3 py-1.5 text-sm font-bold border-2 border-black bg-white hover:bg-black hover:text-white transition-all"
              >
                −
              </button>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={circleRadiusKm}
                onChange={(e) => handleCircleRadiusChange(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-200 border-2 border-black appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, black ${((circleRadiusKm - 0.5) / 1.5) * 100}%, #e5e7eb ${((circleRadiusKm - 0.5) / 1.5) * 100}%)`
                }}
              />
              <button
                onClick={() => handleCircleRadiusChange(Math.min(2, circleRadiusKm + 0.1))}
                className="px-3 py-1.5 text-sm font-bold border-2 border-black bg-white hover:bg-black hover:text-white transition-all"
              >
                +
              </button>
            </div>
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

      {/* Toast Notifications - Brutalist/Techno style */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'white',
            color: 'black',
            border: '4px solid black',
            boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)',
            fontWeight: 'bold',
            fontSize: '20px',
            textTransform: 'uppercase',
            padding: '18px 24px',
          },
          className: 'toast-brutalist',
        }}
      />

      {/* Publish Confirmation Modal */}
      {showPublishConfirm && selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full mx-4">
            {/* Header */}
            <div className="bg-black text-white px-6 py-4 border-b-4 border-black">
              <h3 className="text-lg font-bold uppercase">Publish Final Decision</h3>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <p className="text-black mb-4 font-medium">
                You are about to publish <span className="font-bold">{selectedCandidate.name}</span> as the final meeting location.
              </p>
              <p className="text-black text-sm mb-6">
                All participants will be notified of this decision. This action cannot be undone.
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPublishConfirm(false)}
                  className="flex-1 px-4 py-3 border-2 border-black bg-white text-black hover:bg-gray-100 transition-all font-bold text-sm uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPublish}
                  className="flex-1 px-4 py-3 border-2 border-black bg-black text-white hover:bg-gray-900 transition-all font-bold text-sm uppercase"
                >
                  Publish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Confirmation Modal */}
      {showLocationConfirm && clickedLocation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full mx-4">
            {/* Header */}
            <div className="bg-black text-white px-6 py-4 border-b-4 border-black">
              <h3 className="text-lg font-bold uppercase">Add Your Location</h3>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <p className="text-black mb-3 font-bold text-sm uppercase">Location:</p>
              {clickedLocation.address ? (
                <p className="text-black mb-6 font-medium">
                  {clickedLocation.address}
                </p>
              ) : (
                <p className="text-black mb-6 font-mono text-sm">
                  {clickedLocation.lat.toFixed(6)}, {clickedLocation.lng.toFixed(6)}
                </p>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowLocationConfirm(false);
                    setClickedLocation(null);
                  }}
                  className="flex-1 px-4 py-3 border-2 border-black bg-white text-black hover:bg-gray-100 transition-all font-bold text-sm uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLocationSelection}
                  className="flex-1 px-4 py-3 border-2 border-black bg-black text-white hover:bg-gray-900 transition-all font-bold text-sm uppercase"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
