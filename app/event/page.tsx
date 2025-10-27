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
import { ChevronUp, ChevronDown, Heart, Utensils, Coffee, Beer, Trees, Star, MapPin } from 'lucide-react';
import EventStatusBadge from '@/components/EventStatusBadge';

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

  // Mobile UI state
  const [mobileTab, setMobileTab] = useState<'participants' | 'search' | 'saved'>('participants');
  const [showMobileInputModal, setShowMobileInputModal] = useState(false);
  const [showMobileVenueDetail, setShowMobileVenueDetail] = useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);

  // Mobile input form state
  const [mobileInputName, setMobileInputName] = useState('');
  const [mobileInputAddress, setMobileInputAddress] = useState('');
  const [mobileInputCoordinates, setMobileInputCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [mobileInputBlur, setMobileInputBlur] = useState(false);
  const [mobileInputSubmitting, setMobileInputSubmitting] = useState(false);
  const mobileAddressInputRef = useRef<HTMLInputElement>(null);

  // Mobile search state
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

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

  // Sync selectedCandidate with candidates array when candidates update (e.g., after voting)
  useEffect(() => {
    if (!selectedCandidate) return;

    // Find the updated version of the selected candidate
    const updatedCandidate = candidates.find(c => c.id === selectedCandidate.id);
    if (updatedCandidate && updatedCandidate.voteCount !== selectedCandidate.voteCount) {
      console.log('🔄 Updating selectedCandidate vote count:', selectedCandidate.voteCount, '->', updatedCandidate.voteCount);
      setSelectedCandidate(updatedCandidate);
    }
  }, [candidates, selectedCandidate]);

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

    // Clear both custom centroid and authoritative circle to force recalculation
    setCustomCentroid(null);
    setAuthoritativeCircle(null);

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

    // Show copied message
    setShowCopiedMessage(true);

    // Hide message after 2 seconds
    setTimeout(() => {
      setShowCopiedMessage(false);
    }, 2000);
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

      // Clear authoritative circle and custom centroid when new participant joins
      // This forces recalculation based on all participant locations
      setAuthoritativeCircle(null);
      setCustomCentroid(null);

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

      // Clear authoritative circle and custom centroid when participant location changes
      // This forces recalculation based on new participant positions
      setAuthoritativeCircle(null);
      setCustomCentroid(null);

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

      // Clear authoritative circle and custom centroid when participant is removed
      setAuthoritativeCircle(null);
      setCustomCentroid(null);

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

  // Initialize mobile input form when modal opens
  useEffect(() => {
    if (showMobileInputModal) {
      const currentParticipant = participants.find(p => p.id === participantId);
      if (currentParticipant) {
        // Editing existing participant
        setMobileInputName(currentParticipant.name || '');
        setMobileInputAddress(currentParticipant.address || 'Your location');
        setMobileInputCoordinates({ lat: currentParticipant.lat, lng: currentParticipant.lng });
        setMobileInputBlur(currentParticipant.visibility === 'blur');
      } else {
        // New participant
        setMobileInputName(generateUniqueName(extractExistingNames(participants)));
        setMobileInputAddress('');
        setMobileInputCoordinates(null);
        setMobileInputBlur(false);
      }
    }
  }, [showMobileInputModal, participantId, participants]);

  // Initialize Google Places Autocomplete for mobile address input
  useEffect(() => {
    if (!mobileAddressInputRef.current || !showMobileInputModal) {
      return;
    }

    // Wait for Google Maps to load
    const checkGoogleLoaded = () => {
      if (typeof window !== 'undefined' && window.google?.maps?.places?.Autocomplete) {
        const autocomplete = new google.maps.places.Autocomplete(mobileAddressInputRef.current!, {
          fields: ['formatted_address', 'geometry', 'name', 'place_id'],
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry?.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const formattedAddress = place.formatted_address || place.name || '';
            setMobileInputCoordinates({ lat, lng });
            setMobileInputAddress(formattedAddress);
            toast.success(`Location set: ${formattedAddress}`);
          }
        });
      } else {
        setTimeout(checkGoogleLoaded, 100);
      }
    };

    checkGoogleLoaded();
  }, [showMobileInputModal]);

  // Initialize Google Places Autocomplete for mobile search input
  useEffect(() => {
    if (!mobileSearchInputRef.current || mobileTab !== 'search') {
      return;
    }

    // Wait for Google Maps to load
    const checkGoogleLoaded = () => {
      if (typeof window !== 'undefined' && window.google?.maps?.places?.Autocomplete) {
        const autocomplete = new google.maps.places.Autocomplete(mobileSearchInputRef.current!, {
          types: ['establishment'], // Focus on businesses/venues
          fields: ['name', 'place_id'],
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.name) {
            setKeyword(place.name);
          }
        });
      } else {
        setTimeout(checkGoogleLoaded, 100);
      }
    };

    checkGoogleLoaded();
  }, [mobileTab]);

  // Mobile input form handlers
  const handleMobileCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }

    toast.info('Getting your location...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMobileInputCoordinates({ lat: latitude, lng: longitude });
        setMobileInputAddress('Current location');
        toast.success('Location retrieved!');
      },
      (error) => {
        toast.error('Unable to retrieve your location');
        console.error('Geolocation error:', error);
      }
    );
  };

  const handleMobileShuffleName = () => {
    const newName = generateUniqueName(extractExistingNames(participants));
    setMobileInputName(newName);
  };

  const handleMobileSubmit = async () => {
    if (!mobileInputName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!mobileInputCoordinates) {
      toast.error('Please select a location');
      return;
    }

    setMobileInputSubmitting(true);
    try {
      if (participantId) {
        // Update existing participant
        await handleEditOwnLocation({
          name: mobileInputName.trim(),
          lat: mobileInputCoordinates.lat,
          lng: mobileInputCoordinates.lng,
          blur: mobileInputBlur,
        });
      } else {
        // Join as new participant
        await handleJoinEvent({
          name: mobileInputName.trim(),
          lat: mobileInputCoordinates.lat,
          lng: mobileInputCoordinates.lng,
          blur: mobileInputBlur,
        });
      }
      setShowMobileInputModal(false);
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setMobileInputSubmitting(false);
    }
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
            <div className="w-3 h-3 bg-black border-2 border-black animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-white border-2 border-black animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-black border-2 border-black animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-sm text-black font-bold uppercase">{t.loadingEvent}</p>
        </div>
      </div>
    );
  }

  // Check for missing API key AFTER initialization
  if (!apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md">
          <h1 className="text-lg sm:text-xl font-bold text-black uppercase mb-4">{t.apiKeyMissing}</h1>
          <p className="text-sm text-black mb-4">
            {t.apiKeyMissingMessage} <code className="bg-white border-2 border-black px-2 py-1 text-black font-mono">.env.local</code> file:
          </p>
          <pre className="bg-black border-2 border-black p-4 text-sm overflow-x-auto text-white font-mono">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
          </pre>
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen w-screen overflow-hidden relative bg-white">
      {/* Desktop Layout - Hidden on mobile */}
      <div className="hidden lg:block h-full w-full">
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
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-50 max-w-xl">
          <div className="bg-black text-white px-4 py-2 border-b-4 border-black flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="font-bold text-xs sm:text-sm uppercase tracking-wider">{t.finalDecision}</p>
          </div>
          <div className="px-4 py-3">
            <p className="font-bold text-base sm:text-lg text-black uppercase text-center">{event.final_decision}</p>
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
              <h3 className="font-bold text-base sm:text-lg uppercase truncate flex-1 text-white drop-shadow-lg">{selectedCandidate.name}</h3>
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
            <div className="flex items-center justify-between mb-3 text-sm text-black">
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
                <p className="text-sm text-black">{selectedCandidate.vicinity}</p>
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
                  <div className="text-sm text-black leading-relaxed">
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
                  <div className="text-sm text-black space-y-1">
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

      {/* Circle Radius Controller - Mobile version: left edge above bottom nav */}
      {participantId && !selectedCandidate && (
        <div className="fixed left-0 bottom-16 z-20 block lg:hidden">
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
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-56 px-3 py-2 bg-black text-white text-xs border-2 border-black shadow-lg z-10">
                    Search area radius (0.5-2km). Adjust before searching. Larger = more venues, further distance.
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCircleRadiusChange(Math.max(0.5, circleRadiusKm - 0.1))}
                className="px-3 py-1.5 text-sm font-bold text-black bg-white border-2 border-black hover:bg-black hover:text-white transition-all"
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
                className="flex-1 h-2 bg-black border-2 border-black appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-600 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-red-600 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-black [&::-moz-range-thumb]:cursor-pointer"
              />
              <button
                onClick={() => handleCircleRadiusChange(Math.min(2, circleRadiusKm + 0.1))}
                className="px-3 py-1.5 text-sm font-bold text-black bg-white border-2 border-black hover:bg-black hover:text-white transition-all"
              >
                +
              </button>
              {/* Reset Circle Position Button - Only show if circle has been manually moved */}
              {(customCentroid || authoritativeCircle) && role === 'host' && (
                <button
                  onClick={handleResetCentroid}
                  className="px-3 py-1.5 text-xs font-bold uppercase text-black border-2 border-black bg-white hover:bg-black hover:text-white transition-all"
                  title="Reset circle to auto-calculated position based on participants"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Circle Radius Controller - Desktop version: right side */}
      {participantId && !selectedCandidate && (
        <div className="fixed right-6 bottom-20 z-20 hidden lg:block">
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
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-56 px-3 py-2 bg-black text-white text-xs border-2 border-black shadow-lg z-10">
                    Search area radius (0.5-2km). Adjust before searching. Larger = more venues, further distance.
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCircleRadiusChange(Math.max(0.5, circleRadiusKm - 0.1))}
                className="px-3 py-1.5 text-sm font-bold text-black bg-white border-2 border-black hover:bg-black hover:text-white transition-all"
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
                className="flex-1 h-2 bg-black border-2 border-black appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-600 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-red-600 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-black [&::-moz-range-thumb]:cursor-pointer"
              />
              <button
                onClick={() => handleCircleRadiusChange(Math.min(2, circleRadiusKm + 0.1))}
                className="px-3 py-1.5 text-sm font-bold text-black bg-white border-2 border-black hover:bg-black hover:text-white transition-all"
              >
                +
              </button>
              {/* Reset Circle Position Button - Only show if circle has been manually moved */}
              {(customCentroid || authoritativeCircle) && role === 'host' && (
                <button
                  onClick={handleResetCentroid}
                  className="px-3 py-1.5 text-xs font-bold uppercase text-black border-2 border-black bg-white hover:bg-black hover:text-white transition-all"
                  title="Reset circle to auto-calculated position based on participants"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShareModal(false)}>
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-black text-white px-6 py-4 border-b-4 border-black">
              <h3 className="text-base sm:text-lg font-bold uppercase">{t.shareEventLink}</h3>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <p className="text-sm text-black mb-4 font-medium">
                Invite participants to join this event
              </p>
              <div className="bg-white border-2 border-black p-3 mb-4 break-all text-sm text-black font-mono">
                {window.location.origin}/event?id={eventId}&token={joinToken}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={copyJoinLink}
                  className="flex-1 px-4 py-3 border-2 border-black bg-black text-white hover:bg-gray-900 transition-all font-bold text-sm uppercase"
                >
                  {t.copyLink}
                </button>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-black bg-white text-black hover:bg-gray-100 transition-all font-bold text-sm uppercase"
                >
                  {t.close}
                </button>
              </div>
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
            border: '3px solid black',
            boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
            fontWeight: 'bold',
            fontSize: '14px',
            textTransform: 'uppercase',
            padding: '12px 16px',
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
              <h3 className="text-base sm:text-lg font-bold uppercase">Publish Final Decision</h3>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <p className="text-sm text-black mb-4 font-medium">
                You are about to publish <span className="font-bold">{selectedCandidate.name}</span> as the final meeting location.
              </p>
              <p className="text-sm text-black mb-6">
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
              <h3 className="text-base sm:text-lg font-bold uppercase">Add Your Location</h3>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <p className="text-black mb-3 font-bold text-sm uppercase">Location:</p>
              {clickedLocation.address ? (
                <p className="text-sm text-black mb-6 font-medium">
                  {clickedLocation.address}
                </p>
              ) : (
                <p className="text-sm text-black mb-6 font-mono">
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
      </div>

      {/* Mobile Layout - Only visible on mobile */}
      <div className="block lg:hidden h-full w-full flex flex-col">
        {/* Mobile Header */}
        <div className="bg-black text-white px-3 py-3 border-b-2 border-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              onClick={() => {
                if (participantId) {
                  // Show confirmation if joined
                  if (window.confirm('Return to home? You will lose your current session.')) {
                    router.push('/');
                  }
                } else {
                  router.push('/');
                }
              }}
              className="flex-shrink-0 hover:opacity-80 transition-opacity"
            >
              <Logo size="sm" showText={false} theme="dark" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-xs font-bold uppercase truncate">
                {event?.title || t.eventTitle}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Copy Link Button */}
            <div className="relative">
              <button
                onClick={copyJoinLink}
                className={`p-1.5 border-2 border-white transition-all ${
                  showCopiedMessage
                    ? 'bg-white text-black'
                    : 'bg-black text-white hover:bg-white hover:text-black'
                }`}
                title="Copy event link"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </button>
              {showCopiedMessage && (
                <div className="absolute top-full right-0 mt-1 bg-black text-white px-2 py-1 text-xs font-bold whitespace-nowrap border-2 border-white">
                  Copied!
                </div>
              )}
            </div>

            {/* Publish Button (Host only, when venue selected and no final decision) */}
            {role === 'host' && selectedCandidate && !event?.final_decision && (
              <button
                onClick={handlePublish}
                className="px-2 py-1.5 border-2 border-white bg-white text-black hover:bg-black hover:text-white transition-all text-xs font-bold uppercase"
                title="Publish final decision"
              >
                Publish
              </button>
            )}

            {/* Unpublish Button (Host only, when final decision exists) */}
            {role === 'host' && event?.final_decision && (
              <button
                onClick={handleUnpublish}
                className="px-2 py-1.5 border-2 border-white bg-black text-white hover:bg-white hover:text-black transition-all text-xs font-bold uppercase"
                title="Unpublish decision"
              >
                Unpublish
              </button>
            )}
          </div>
        </div>

        {/* Final Decision Banner - Mobile */}
        {event.final_decision && (
          <div className="bg-white border-b-4 border-black z-50">
            <div className="bg-black text-white px-3 py-2 border-b-2 border-black flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="font-bold text-xs uppercase tracking-wider">{t.finalDecision}</p>
            </div>
            <div className="px-3 py-2">
              <p className="font-bold text-sm text-black uppercase text-center">{event.final_decision}</p>
            </div>
          </div>
        )}

        {/* Map Container - 40% height */}
        <div className="relative h-[40vh] flex-shrink-0">
          <MapView
            key={`map-mobile-${language}`}
            apiKey={apiKey}
            locations={locations}
            centroid={centroid}
            circle={circle}
            candidates={sortedCandidates()}
            selectedCandidate={selectedCandidate}
            onMapClick={handleMapClick}
            onCandidateClick={(candidate) => {
              setSelectedCandidate(candidate);
              setShowMobileVenueDetail(true);
            }}
            myParticipantId={participantId || undefined}
            routeFromParticipantId={selectedCandidate && selectedParticipantId ? selectedParticipantId : routeFromParticipantId}
            travelMode={selectedCandidate && selectedParticipantId ? chartTravelMode : travelMode}
            onTravelModeChange={setTravelMode}
            onCentroidDrag={role === 'host' ? handleCentroidDrag : undefined}
            isHost={role === 'host'}
            language={language}
            participantColors={participantColors}
            candidateColors={candidateColors}
            showParticipantNames={showParticipantNames}
            selectedParticipantId={selectedParticipantId}
            chartRouteMode={selectedCandidate && selectedParticipantId ? true : false}
          />

          {/* Vertical Search Radius Slider - Only show in Search/Saved tabs */}
          {(mobileTab === 'search' || mobileTab === 'saved') && participantId && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 bg-white border-r-2 border-y-2 border-black px-2 py-4 flex flex-col items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <button
                onClick={() => handleCircleRadiusChange(Math.min(2, circleRadiusKm + 0.1))}
                className="p-1 border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all text-xs font-bold"
              >
                +
              </button>
              <div className="flex flex-col items-center gap-1">
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={circleRadiusKm}
                  onChange={(e) => handleCircleRadiusChange(parseFloat(e.target.value))}
                  className="h-32 w-2 appearance-none bg-black border-2 border-black cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-600 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-red-600 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-black [&::-moz-range-thumb]:cursor-pointer"
                  style={{
                    writingMode: 'vertical-lr',
                    direction: 'rtl',
                  }}
                />
                <span className="text-[10px] font-bold text-black whitespace-nowrap">
                  {circleRadiusKm.toFixed(1)}km
                </span>
              </div>
              <button
                onClick={() => handleCircleRadiusChange(Math.max(0.5, circleRadiusKm - 0.1))}
                className="p-1 border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all text-xs font-bold"
              >
                −
              </button>
            </div>
          )}
        </div>

        {/* Content Area - Remaining height minus bottom nav */}
        <div className="flex-1 overflow-y-auto pb-16">
          {/* Participants Tab */}
          {mobileTab === 'participants' && (
            <div className="h-full">
              <div className="p-4">
                <h3 className="text-sm font-bold uppercase mb-3 text-black">Participants ({participants.length})</h3>

                {/* Participants list - matching desktop design */}
                <div className="space-y-1">
                  {participants.map((participant, index) => {
                    const isMe = participant.id === participantId;
                    const color = participantColors.get(participant.id) || '#10b981';
                    const displayName = participant.name || `Participant ${participant.id.slice(0, 8)}`;
                    const isSelected = participant.id === selectedParticipantId;

                    // Check if location is blurred
                    const isBlurred = participant.fuzzy_lat !== null && participant.fuzzy_lng !== null &&
                      (participant.fuzzy_lat !== participant.lat || participant.fuzzy_lng !== participant.lng);

                    // Use fuzzy coordinates if available, otherwise exact
                    const displayLat = participant.fuzzy_lat ?? participant.lat;
                    const displayLng = participant.fuzzy_lng ?? participant.lng;

                    return (
                      <div
                        key={participant.id}
                        onClick={() => isMe ? setShowMobileInputModal(true) : handleParticipantClick(participant.id)}
                        className={`relative flex border-2 border-black cursor-pointer transition-all overflow-hidden ${
                          isMe
                            ? 'bg-black text-white'
                            : isSelected
                            ? 'bg-gray-300 text-black'
                            : 'bg-white hover:bg-gray-100'
                        }`}
                      >
                        {/* Left content - Two-line layout */}
                        <div className="flex-1 min-w-0 relative z-10 p-2 pr-3">
                          {/* Line 1: Name and indicators */}
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={`text-sm font-bold flex-shrink-0 ${
                              isMe ? 'text-white' : 'text-black'
                            }`}>
                              {isMe && '→ '}
                              {displayName}
                            </span>

                            {/* Blur indicator */}
                            {isBlurred && (
                              <svg className={`w-3 h-3 flex-shrink-0 ${
                                isMe ? 'text-gray-400' : 'text-neutral-400'
                              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            )}

                            {/* Edit hint for own card */}
                            {isMe && (
                              <span className="text-xs text-gray-400 ml-auto">Tap to edit</span>
                            )}
                          </div>

                          {/* Line 2: Address or Coordinates */}
                          <div className="flex items-center">
                            {!isBlurred && participant.address ? (
                              <span className={`text-xs truncate ${
                                isMe ? 'text-gray-300' : 'text-neutral-600'
                              }`} title={participant.address}>
                                {participant.address.replace(/,?\s*USA\s*$/i, '').replace(/,?\s*United States\s*$/i, '').replace(/,?\s*\d{5}(-\d{4})?\s*$/i, '')}
                              </span>
                            ) : (
                              <span className={`text-xs truncate ${
                                isMe ? 'text-gray-300' : 'text-neutral-600'
                              }`} title={`${displayLat}, ${displayLng}`}>
                                {displayLat.toFixed(4)}, {displayLng.toFixed(4)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Color tag - Rightmost 25% with angled left edge */}
                        <div
                          className="absolute right-0 top-0 bottom-0 w-[25%] flex-shrink-0"
                          style={{
                            backgroundColor: color,
                            clipPath: 'polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%)',
                          }}
                          title={`Map marker color: ${color}`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Join button for non-participants */}
                {!participantId && (
                  <button
                    onClick={() => setShowMobileInputModal(true)}
                    className="w-full mt-4 border-2 border-black p-3 bg-black text-white hover:bg-gray-900 transition-all font-bold text-sm uppercase"
                  >
                    Join Event
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Search Tab */}
          {mobileTab === 'search' && (
            <div className="h-full flex flex-col">
              {/* Sticky Search Bar */}
              <div className="sticky top-0 z-20 bg-white border-b-2 border-black p-4 flex-shrink-0">
                <input
                  ref={mobileSearchInputRef}
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchPlaces()}
                  placeholder="Search for places..."
                  className="w-full px-3 py-2 text-sm text-black placeholder:text-gray-500 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-sm font-bold uppercase mb-3 text-black">Search Venues</h3>

                {/* Category Chips - First 4 */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={() => setKeyword('restaurant')}
                    className="px-3 py-2 border-2 border-black bg-white hover:bg-gray-100 transition-all text-xs font-bold uppercase flex items-center justify-center gap-1.5 text-black"
                  >
                    <Utensils className="w-4 h-4" />
                    Restaurant
                  </button>
                  <button
                    onClick={() => setKeyword('cafe')}
                    className="px-3 py-2 border-2 border-black bg-white hover:bg-gray-100 transition-all text-xs font-bold uppercase flex items-center justify-center gap-1.5 text-black"
                  >
                    <Coffee className="w-4 h-4" />
                    Cafe
                  </button>
                  <button
                    onClick={() => setKeyword('bar')}
                    className="px-3 py-2 border-2 border-black bg-white hover:bg-gray-100 transition-all text-xs font-bold uppercase flex items-center justify-center gap-1.5 text-black"
                  >
                    <Beer className="w-4 h-4" />
                    Bar
                  </button>
                  <button
                    onClick={() => setKeyword('park')}
                    className="px-3 py-2 border-2 border-black bg-white hover:bg-gray-100 transition-all text-xs font-bold uppercase flex items-center justify-center gap-1.5 text-black"
                  >
                    <Trees className="w-4 h-4" />
                    Park
                  </button>
                </div>

                {/* Search Button */}
                <button
                  onClick={searchPlaces}
                  disabled={isSearching || !keyword.trim()}
                  className="w-full mb-4 px-4 py-2 bg-black text-white font-bold text-sm uppercase border-2 border-black hover:bg-gray-900 disabled:opacity-50"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>

                {/* Results List - Right 20% is vote area */}
                <div className="space-y-0.5">
                  {sortedCandidates().map((candidate) => {
                    const isSelected = selectedCandidate?.id === candidate.id;
                    const hasUserVoted = myVotedCandidateIds.has(candidate.id);
                    const hasVoteCount = candidate.voteCount && candidate.voteCount > 0;

                    return (
                      <div
                        key={candidate.id}
                        className={`flex border-2 transition-all ${
                          isSelected
                            ? 'bg-black text-white border-black'
                            : 'bg-white border-black hover:bg-gray-100'
                        }`}
                      >
                        {/* Left 80%: Card content - opens detail */}
                        <div
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setShowMobileVenueDetail(true);
                          }}
                          className="flex-1 p-1.5 cursor-pointer"
                        >
                          {/* Line 1: Name + Rating + Distance */}
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h5 className={`font-semibold text-xs flex-1 min-w-0 ${
                              isSelected ? 'text-white' : 'text-neutral-900'
                            }`}>
                              {candidate.name.length > 30 ? `${candidate.name.substring(0, 30)}...` : candidate.name}
                            </h5>
                            <div className="flex items-center gap-1.5 text-xs flex-shrink-0">
                              {candidate.rating && (
                                <div className="flex items-center gap-0.5">
                                  <Star className={`w-3 h-3 ${
                                    isSelected ? 'fill-white text-white' : 'fill-yellow-400 text-yellow-400'
                                  }`} />
                                  <span className={`font-medium ${
                                    isSelected ? 'text-white' : 'text-neutral-700'
                                  }`}>
                                    {candidate.rating.toFixed(1)}
                                  </span>
                                </div>
                              )}
                              {candidate.distanceFromCenter !== undefined && (
                                <div className="flex items-center gap-0.5">
                                  <MapPin className={`w-3 h-3 ${
                                    isSelected ? 'text-white' : 'text-neutral-500'
                                  }`} />
                                  <span className={isSelected ? 'text-white' : 'text-neutral-600'}>
                                    {(candidate.distanceFromCenter / 1000).toFixed(1)}km
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Line 2: Address */}
                          <p className={`text-xs truncate ${
                            isSelected ? 'text-gray-300' : 'text-neutral-500'
                          }`}>
                            {candidate.vicinity || 'No address'}
                          </p>
                        </div>

                        {/* Right 20%: Vote button area */}
                        {participantId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (hasUserVoted) {
                                handleVote(candidate.id);
                              } else {
                                handleSaveCandidate(candidate.id);
                              }
                            }}
                            className={`w-[20%] flex items-center justify-center border-l-2 border-black transition-colors relative ${
                              isSelected
                                ? 'bg-white text-black hover:bg-gray-200'
                                : hasUserVoted
                                ? 'bg-black hover:bg-gray-900'
                                : 'bg-white hover:bg-gray-100'
                            }`}
                            title={hasUserVoted ? 'Remove vote' : 'Save and Vote'}
                          >
                            <Heart className={`w-6 h-6 ${
                              hasUserVoted ? 'text-white' : 'text-neutral-400'
                            }`} />
                            {hasVoteCount && (
                              <span className={`absolute bottom-1 text-xs font-bold ${
                                hasUserVoted ? 'text-white' : 'text-black'
                              }`}>
                                {candidate.voteCount}
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {candidates.length === 0 && !isSearching && (
                    <p className="text-center text-gray-500 text-sm py-8">
                      Search for venues to see results
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Saved Tab */}
          {mobileTab === 'saved' && (
            <div className="h-full">
              <div className="p-4">
                <h3 className="text-sm font-bold uppercase mb-3 text-black">
                  Liked Venues ({candidates.filter(c => myVotedCandidateIds.has(c.id)).length})
                </h3>

                {/* Saved venues list - Right 20% is vote area, no color tags */}
                <div className="space-y-0.5">
                  {sortedCandidates()
                    .filter(c => myVotedCandidateIds.has(c.id))
                    .map((candidate) => {
                      const isSelected = selectedCandidate?.id === candidate.id;
                      const hasUserVoted = myVotedCandidateIds.has(candidate.id);
                      const hasVoteCount = candidate.voteCount && candidate.voteCount > 0;

                      return (
                        <div
                          key={candidate.id}
                          className={`flex border-2 transition-all ${
                            isSelected
                              ? 'bg-black text-white border-black'
                              : 'bg-white border-black hover:bg-gray-100'
                          }`}
                        >
                          {/* Left 80%: Card content - opens detail */}
                          <div
                            onClick={() => {
                              setSelectedCandidate(candidate);
                              setShowMobileVenueDetail(true);
                            }}
                            className="flex-1 p-1.5 cursor-pointer"
                          >
                            {/* Line 1: Name + Rating + Distance */}
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <h5 className={`font-semibold text-xs flex-1 min-w-0 ${
                                isSelected ? 'text-white' : 'text-neutral-900'
                              }`}>
                                {candidate.name.length > 30 ? `${candidate.name.substring(0, 30)}...` : candidate.name}
                              </h5>
                              <div className="flex items-center gap-1.5 text-xs flex-shrink-0">
                                {candidate.rating && (
                                  <div className="flex items-center gap-0.5">
                                    <Star className={`w-3 h-3 ${
                                      isSelected ? 'fill-white text-white' : 'fill-yellow-400 text-yellow-400'
                                    }`} />
                                    <span className={`font-medium ${
                                      isSelected ? 'text-white' : 'text-neutral-700'
                                    }`}>
                                      {candidate.rating.toFixed(1)}
                                    </span>
                                  </div>
                                )}
                                {candidate.distanceFromCenter !== undefined && (
                                  <div className="flex items-center gap-0.5">
                                    <MapPin className={`w-3 h-3 ${
                                      isSelected ? 'text-white' : 'text-neutral-500'
                                    }`} />
                                    <span className={isSelected ? 'text-white' : 'text-neutral-600'}>
                                      {(candidate.distanceFromCenter / 1000).toFixed(1)}km
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Line 2: Address */}
                            <p className={`text-xs truncate ${
                              isSelected ? 'text-gray-300' : 'text-neutral-500'
                            }`}>
                              {candidate.vicinity || 'No address'}
                            </p>
                          </div>

                          {/* Right 20%: Vote button area */}
                          {participantId && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVote(candidate.id);
                              }}
                              className={`w-[20%] flex items-center justify-center border-l-2 border-black transition-colors relative ${
                                isSelected
                                  ? 'bg-white text-black hover:bg-gray-200'
                                  : hasUserVoted
                                  ? 'bg-black hover:bg-gray-900'
                                  : 'bg-white hover:bg-gray-100'
                              }`}
                              title={hasUserVoted ? 'Remove vote' : 'Vote'}
                            >
                              <Heart className={`w-6 h-6 ${
                                hasUserVoted ? 'text-white' : 'text-neutral-400'
                              }`} />
                              {hasVoteCount && (
                                <span className={`absolute bottom-1 text-xs font-bold ${
                                  hasUserVoted ? 'text-white' : 'text-black'
                                }`}>
                                  {candidate.voteCount}
                                </span>
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}

                  {candidates.filter(c => c.addedBy).length === 0 && (
                    <p className="text-center text-gray-500 text-sm py-8">
                      No saved venues yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Bar - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-black z-50">
          <div className="flex justify-around items-center h-16">
            <button
              onClick={() => setMobileTab('participants')}
              className={`flex-1 flex flex-col items-center justify-center h-full transition-colors ${
                mobileTab === 'participants' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="text-xs font-medium">
                Participants ({participants.length})
              </span>
            </button>

            <button
              onClick={() => setMobileTab('search')}
              className={`flex-1 flex flex-col items-center justify-center h-full transition-colors ${
                mobileTab === 'search' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-xs font-medium">
                Search ({candidates.length})
              </span>
            </button>

            <button
              onClick={() => setMobileTab('saved')}
              className={`flex-1 flex flex-col items-center justify-center h-full transition-colors ${
                mobileTab === 'saved' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span className="text-xs font-medium">
                Saved ({candidates.filter(c => myVotedCandidateIds.has(c.id)).length})
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Input Modal - Centered Popup */}
        {showMobileInputModal && (
          <div
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowMobileInputModal(false)}
          >
            <div
              className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-black text-white px-4 py-3 flex items-center justify-between border-b-4 border-black flex-shrink-0">
                <h3 className="text-sm font-bold uppercase">
                  {participantId ? 'Edit Location' : 'Join Event'}
                </h3>
                <button
                  onClick={() => setShowMobileInputModal(false)}
                  className="hover:bg-white hover:text-black w-6 h-6 flex items-center justify-center transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Name Input */}
                <div>
                  <label className="block text-xs font-bold uppercase mb-1 text-black">Name</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={mobileInputName}
                      onChange={(e) => setMobileInputName(e.target.value)}
                      placeholder="Your name"
                      className="flex-1 px-3 py-2 text-sm text-black placeholder:text-gray-500 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <button
                      onClick={handleMobileShuffleName}
                      className="px-3 py-2 border-2 border-black bg-white hover:bg-gray-100 transition-all text-black"
                      title="Shuffle name"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Address Input */}
                <div>
                  <label className="block text-xs font-bold uppercase mb-1 text-black">Location</label>
                  <input
                    ref={mobileAddressInputRef}
                    type="text"
                    value={mobileInputAddress}
                    onChange={(e) => setMobileInputAddress(e.target.value)}
                    placeholder="Search for an address..."
                    className="w-full px-3 py-2 text-sm text-black placeholder:text-gray-500 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black mb-2"
                  />
                  <button
                    onClick={handleMobileCurrentLocation}
                    className="w-full px-3 py-2 border-2 border-black bg-black text-white hover:bg-gray-900 transition-all text-sm font-bold uppercase flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Use Current Location
                  </button>
                </div>

                {/* Privacy Toggle - Full width */}
                <button
                  onClick={() => setMobileInputBlur(!mobileInputBlur)}
                  className={`w-full p-3 border-2 border-black transition-all flex items-center gap-3 ${
                    mobileInputBlur
                      ? 'bg-black text-white hover:bg-gray-900'
                      : 'bg-white text-black hover:bg-gray-100'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {mobileInputBlur ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold uppercase">
                      {mobileInputBlur ? 'Privacy: ON' : 'Privacy: OFF'}
                    </p>
                    <p className="text-xs opacity-80 mt-0.5">
                      {mobileInputBlur
                        ? 'Location blurred by ~500m'
                        : 'Exact location will be visible'}
                    </p>
                  </div>
                </button>
              </div>

              {/* Modal Footer with action buttons */}
              <div className="p-4 border-t-2 border-black bg-white flex-shrink-0">
                <button
                  onClick={handleMobileSubmit}
                  disabled={mobileInputSubmitting || !mobileInputName.trim() || !mobileInputCoordinates}
                  className="w-full py-3 px-4 bg-black text-white font-bold text-sm uppercase border-2 border-black hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {mobileInputSubmitting ? 'Saving...' : participantId ? 'Save Changes' : 'Join Event'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Venue Detail Modal - Large centered */}
        {showMobileVenueDetail && selectedCandidate && (
          <div
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowMobileVenueDetail(false)}
          >
            <div
              className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-[90vw] max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Photo */}
              <div
                className="relative h-32 bg-black text-white border-b-4 border-black flex-shrink-0"
                style={{
                  backgroundImage: selectedCandidate.photoReference
                    ? `url(https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${selectedCandidate.photoReference}&key=${apiKey})`
                    : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 bg-black/50"></div>
                <div className="relative flex items-center justify-between px-4 py-3 h-full">
                  <h3 className="font-bold text-base uppercase truncate flex-1 text-white drop-shadow-lg">
                    {selectedCandidate.name}
                  </h3>
                  <button
                    onClick={() => setShowMobileVenueDetail(false)}
                    className="ml-2 hover:bg-white hover:text-black w-8 h-8 flex items-center justify-center transition-all bg-black/50 backdrop-blur-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Rating, Distance, and Vote */}
                <div className="flex items-center justify-between mb-3 text-sm text-black">
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

                  {/* Right side: Vote Button */}
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

                {/* Address */}
                {selectedCandidate.vicinity && (
                  <div className="mb-3">
                    <p className="text-sm text-black">{selectedCandidate.vicinity}</p>
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
                      <div className="text-sm text-black leading-relaxed">
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
                      <div className="text-sm text-black space-y-1">
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
          </div>
        )}
      </div>
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
