'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import EventHeroImage from '@/components/EventHeroImage';
import EventHeader from '@/components/EventHeader';
import EventAbout from '@/components/EventAbout';
import EventHost from '@/components/EventHost';
import EventParticipants from '@/components/EventParticipants';
import EventVenues from '@/components/EventVenues';
import EventHostSettings from '@/components/EventHostSettings';
import EditEventModal from '@/components/EditEventModal';
import ManageParticipantsModal from '@/components/ManageParticipantsModal';
import MeetingLocationCard from '@/components/MeetingLocationCard';
import Header from '@/components/Header';
import JoinEventDialog from '@/components/JoinEventDialog';
import LeaveEventDialog from '@/components/LeaveEventDialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import { api } from '@/lib/api';
import { Event, Candidate } from '@/types';

function EventDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, logout } = useAuth();

  // Event state
  const [eventId, setEventId] = useState<string | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [joinToken, setJoinToken] = useState<string | null>(null);

  // Data state
  const [participants, setParticipants] = useState<Array<{ id: string; user_id?: string; name: string; email?: string; avatar?: string }>>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // UI state
  const [isInitializing, setIsInitializing] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [participantToRemove, setParticipantToRemove] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'planning'>('details');

  // Initialize event from URL
  useEffect(() => {
    const initializeApp = async () => {
      const id = searchParams.get('id');
      const token = searchParams.get('token');

      if (!id) {
        router.push('/');
        return;
      }

      console.log('🔍 Initializing event:', id);
      setEventId(id);

      const storedToken = sessionStorage.getItem('joinToken') || token;
      const storedParticipantId = sessionStorage.getItem('participantId');

      setJoinToken(storedToken);
      if (storedParticipantId) {
        setParticipantId(storedParticipantId);
      }

      // Load event data from API
      await loadEventData(id);
      setIsInitializing(false);
    };

    initializeApp();
  }, [searchParams, router]);

  // Reload event data when user changes (for role detection)
  useEffect(() => {
    if (eventId && user) {
      loadEventData(eventId);
    }
  }, [user]);

  // Load event data from API
  const loadEventData = async (id: string) => {
    try {
      console.log('📡 Loading event from API:', id, 'with token:', token ? 'YES' : 'NO');
      const response = await api.getEventFeedDetail(id, token || undefined);

      setEvent(response.event);
      setParticipants(response.participants);

      // Convert venues from backend format to frontend Candidate format
      const convertedVenues = response.venues.map((v: any) => ({
        id: v.id,
        placeId: v.place_id,
        name: v.name,
        lat: v.lat,
        lng: v.lng,
        rating: v.rating,
        userRatingsTotal: v.user_ratings_total,
        distanceFromCenter: v.distance_from_center,
        inCircle: v.in_circle,
        openNow: v.open_now,
        vicinity: v.vicinity,
        types: v.types,
        photoReference: v.photo_reference,
        voteCount: v.vote_count || 0,
        addedBy: v.added_by,
        userVoted: v.user_voted || false,
      }));
      setCandidates(convertedVenues);

      // Determine if current user is host and/or participant
      console.log('🔍 Response from backend:', {
        is_host: response.is_host,
        is_participant: response.is_participant,
        event_host_id: response.event.host_id,
        current_user_id: user?.id
      });

      const userIsHost = response.is_host !== undefined
        ? response.is_host
        : (user && response.event.host_id === user.id) || false;

      const userIsParticipant = response.is_participant !== undefined
        ? response.is_participant
        : (user && response.participants.some((p: any) => p.user_id === user.id)) || false;

      // Find and set participant ID if user is a participant
      if (userIsParticipant && user) {
        const userParticipant = response.participants.find((p: any) => p.user_id === user.id);
        if (userParticipant) {
          setParticipantId(userParticipant.id);
          console.log('👤 Found participant ID:', userParticipant.id);
        }
      } else {
        setParticipantId(null);
      }

      setIsHost(userIsHost);
      setIsParticipant(userIsParticipant);
      console.log('✅ Event loaded successfully. Is host:', userIsHost, 'Is participant:', userIsParticipant);
    } catch (err) {
      console.error('❌ Failed to load event from API:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to load event');
    }
  };

  // Mock data removed - now using real backend API

  // Show join dialog
  const handleJoinClick = () => {
    setShowJoinDialog(true);
  };

  // Confirm join event
  const handleJoinConfirm = async () => {
    if (!eventId) return;

    if (!user || !token) {
      toast.error('Please log in to join events');
      router.push('/login');
      return;
    }

    setIsJoining(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/feed/events/${eventId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: user.name || user.email,
          email: user.email,
          avatar: user.avatar,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to join event' }));
        throw new Error(errorData.detail || 'Failed to join event');
      }

      const result = await response.json();
      setParticipantId(result.id);

      toast.success('Successfully joined the event!');
      setIsParticipant(true);
      setShowJoinDialog(false);

      // Reload event data to get updated participant count
      await loadEventData(eventId);
    } catch (err) {
      console.error('Failed to join event:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to join event');
    } finally {
      setIsJoining(false);
    }
  };

  // Show leave dialog
  const handleLeaveClick = () => {
    setShowLeaveDialog(true);
  };

  // Confirm leave event
  const handleLeaveConfirm = async () => {
    if (!eventId) return;

    if (!token) {
      toast.error('Please log in to leave events');
      return;
    }

    setIsLeaving(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/feed/events/${eventId}/leave`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to leave event' }));
        throw new Error(errorData.detail || 'Failed to leave event');
      }

      toast.success('Successfully left the event');
      setIsParticipant(false);
      setParticipantId(null);
      setShowLeaveDialog(false);

      // Reload event data to get updated participant count
      await loadEventData(eventId);
    } catch (err) {
      console.error('Failed to leave event:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to leave event');
    } finally {
      setIsLeaving(false);
    }
  };

  // Share event
  const handleShare = () => {
    setShowShareModal(true);
  };

  // Copy share link
  const copyShareLink = () => {
    if (!eventId) return;

    const link = joinToken
      ? `${window.location.origin}/event-detail?id=${eventId}&token=${joinToken}`
      : `${window.location.origin}/event-detail?id=${eventId}`;

    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  // Add venue (participants only)
  const handleAddVenue = async (venueData: {
    place_id: string;
    name: string;
    address?: string;
    lat: number;
    lng: number;
    rating?: number;
  }) => {
    if (!eventId || !token) {
      toast.error('Please log in to add venues');
      return;
    }

    try {
      const payload = {
        place_id: venueData.place_id,
        name: venueData.name,
        vicinity: venueData.address ?? null,
        lat: venueData.lat,
        lng: venueData.lng,
        rating: venueData.rating ?? null,
        user_ratings_total: 0,
        distance_from_center: null,
        in_circle: true,
        open_now: null,
        types: null,
        photo_reference: null,
      };

      console.log('Sending venue data to backend:', JSON.stringify(payload, null, 2));

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/feed/events/${eventId}/venues`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to add venue' }));

        console.error('Full error response:', JSON.stringify(errorData, null, 2));

        // Handle validation errors (array) or simple error messages
        let errorMessage = 'Failed to add venue';
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          // Format validation errors - FastAPI format
          errorMessage = errorData.detail.map((err: any) => {
            const field = err.loc ? err.loc.join('.') : 'unknown';
            const msg = err.msg || 'validation error';
            return `${field}: ${msg}`;
          }).join(', ');
        }

        console.error('Formatted error:', errorMessage);
        throw new Error(errorMessage);
      }

      toast.success('Venue added successfully!');

      // Reload event data to show new venue
      await loadEventData(eventId);
    } catch (err) {
      console.error('Failed to add venue:', err);
      throw err; // Re-throw to let modal handle it
    }
  };

  // Vote or unvote on candidate
  const handleVote = async (venueId: string, currentlyVoted: boolean = false) => {
    console.log('🗳️ Attempting to vote/unvote:', {
      eventId,
      venueId,
      currentlyVoted,
      allowVote: event?.allow_vote,
      hasToken: !!token,
      isParticipant,
      participantId,
      userId: user?.id,
    });

    if (!eventId || !event?.allow_vote || !token) {
      console.error('❌ Vote blocked - missing requirements');
      toast.error('Cannot vote: missing requirements');
      return;
    }

    try {
      const url = currentlyVoted
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/feed/events/${eventId}/votes/${venueId}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/feed/events/${eventId}/votes`;

      const response = await fetch(url, {
        method: currentlyVoted ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: currentlyVoted ? undefined : JSON.stringify({ venue_id: venueId }),
      });

      console.log('📊 Vote response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: currentlyVoted ? 'Failed to unvote' : 'Failed to vote' }));
        console.error('❌ Vote failed:', errorData);
        throw new Error(errorData.detail || (currentlyVoted ? 'Failed to unvote' : 'Failed to vote'));
      }

      await loadEventData(eventId);
      toast.success(currentlyVoted ? 'Vote removed successfully!' : 'Vote cast successfully!');
    } catch (err) {
      console.error('Failed to vote:', err);
      toast.error(err instanceof Error ? err.message : (currentlyVoted ? 'Failed to unvote' : 'Failed to vote'));
    }
  };

  // Edit event (host only)
  const handleEditEvent = async (data: {
    title: string;
    description?: string;
    meeting_time: string;
    participant_limit?: number;
    status: any;
  }) => {
    if (!eventId || !token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/feed/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to update event' }));
        throw new Error(errorData.detail || 'Failed to update event');
      }

      const updatedEvent = await response.json();

      // Update local state with the response from backend
      setEvent(updatedEvent);

      toast.success('Event updated successfully!');
      setShowEditModal(false);

      // Reload event data to ensure consistency
      await loadEventData(eventId);
    } catch (err) {
      console.error('Failed to update event:', err);
      throw err; // Let modal handle the error
    }
  };

  // Manage participants (host only)
  const handleManageParticipants = () => {
    setShowManageModal(true);
  };

  // Remove participant (host only)
  const handleRemoveParticipant = (participantId: string) => {
    console.log('handleRemoveParticipant called with participantId:', participantId);
    setParticipantToRemove(participantId);
    setShowRemoveConfirm(true);
  };

  const confirmRemoveParticipant = async () => {
    if (!eventId || !token || !participantToRemove) {
      toast.error('Please log in to remove participants');
      return;
    }

    console.log('Removing participant:', participantToRemove, 'from event:', eventId);
    setIsRemoving(true);

    try {
      // Call backend API to remove participant from event feed
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/feed/events/${eventId}/participants/${participantToRemove}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to remove participant' }));
        throw new Error(errorData.detail || 'Failed to remove participant');
      }

      // Update local state
      setParticipants((prev) => prev.filter((p) => p.id !== participantToRemove));

      toast.success('Participant removed successfully');
      console.log('Participant removed successfully');

      // Close dialog
      setShowRemoveConfirm(false);
      setParticipantToRemove(null);
    } catch (err) {
      console.error('Failed to remove participant:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to remove participant');
    } finally {
      setIsRemoving(false);
    }
  };

  // Close event (host only)
  const handleCloseEvent = () => {
    setShowCloseConfirm(true);
  };

  const confirmCloseEvent = async () => {
    if (!eventId || !token) {
      toast.error('Please log in to close event');
      return;
    }

    setIsClosing(true);

    try {
      // Call backend API to close event
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/feed/events/${eventId}/close`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to close event' }));
        throw new Error(errorData.detail || 'Failed to close event');
      }

      // Update local state
      setEvent((prev) => (prev ? { ...prev, status: 'closed' } : null));

      toast.success('Event closed successfully');

      // Close dialog
      setShowCloseConfirm(false);

      // Reload event data
      await loadEventData(eventId);
    } catch (err) {
      console.error('Failed to close event:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to close event');
    } finally {
      setIsClosing(false);
    }
  };

  // Delete event (host only)
  const handleDeleteEvent = async () => {
    if (!eventId || !event || !token) return;

    if (
      !confirm(
        `⚠️ DELETE "${event.title}"?\n\nThis action CANNOT be undone. All participant data, votes, and venue suggestions will be permanently removed.`
      )
    ) {
      return;
    }

    // Second confirmation
    const confirmation = prompt(
      'Please type "DELETE" (in capitals) to permanently delete this event:'
    );

    if (confirmation !== 'DELETE') {
      toast.error('Event deletion cancelled - confirmation text did not match');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/feed/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to delete event' }));
        throw new Error(errorData.detail || 'Failed to delete event');
      }

      toast.success('Event deleted successfully');

      // Redirect to homepage after a brief delay
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      console.error('Failed to delete event:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete event');
    }
  };

  // Export participants (host only)
  const handleExportParticipants = () => {
    if (!event || participants.length === 0) {
      toast.error('No participants to export');
      return;
    }

    try {
      // Create CSV content
      const csvHeader = 'Name,Email,Joined At,Role\n';
      const csvRows = participants.map((p) => {
        const name = p.name || 'Unnamed';
        const email = p.email || 'N/A';
        const joinedAt = new Date().toISOString(); // You might want to add joined_at to the participant data
        const role = p.user_id === event.host_id ? 'Host' : 'Participant';
        return `"${name}","${email}","${joinedAt}","${role}"`;
      }).join('\n');

      const csvContent = csvHeader + csvRows;

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `${event.title.replace(/[^a-z0-9]/gi, '_')}_participants.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${participants.length} participants`);
    } catch (err) {
      console.error('Failed to export participants:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to export participants');
    }
  };

  // Loading state
  if (isInitializing || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-gray-500 font-medium">Loading event...</p>
        </div>
      </div>
    );
  }

  // Format participants for display
  const formattedParticipants = participants.map((p) => ({
    id: p.id,
    name: p.name || 'Unnamed',
    avatar: p.avatar, // Use avatar from API
    isHost: p.user_id === event.host_id, // Check user_id instead of participant id
  }));

  // Get participant avatars for header
  const participantAvatars = participants.slice(0, 4).map(p =>
    p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'User')}&background=random`
  );

  // Get host avatar from participants list if host has joined
  const hostParticipant = participants.find(p => p.user_id === event.host_id);
  const hostAvatar = hostParticipant?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.host_name || 'Host')}&background=4F46E5&color=fff`;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header
        user={user}
        onLogout={logout}
      />

      {/* Tab Navigation */}
      <div className="border-b border-gray-300 bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-2 font-medium transition-colors relative ${
                activeTab === 'details'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              Event Details
            </button>
            {/* Only show "Find Meeting Point" tab for collaborative events */}
            {event.location_type === 'collaborative' && (
              <button
                onClick={() => setActiveTab('planning')}
                className={`py-4 px-2 font-medium transition-colors relative ${
                  activeTab === 'planning'
                    ? 'text-black border-b-2 border-black'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                Find Meeting Point
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' ? (
        <div>
          {/* Hero Image with Host Settings Overlay */}
          <div className="relative">
            <EventHeroImage
              imageUrl={event.background_image}
              category={event.category}
              status={isHost ? 'host' : isParticipant ? 'participant' : 'guest'}
            />

            {/* Event Settings (Host Only) - Positioned top right below hero image */}
            {isHost && (
              <div className="absolute top-4 right-4 z-10">
                <EventHostSettings
                  visibility={event.visibility}
                  status={event.status}
                  participantLimit={event.participant_limit}
                  allowVote={event.allow_vote}
                  onEdit={() => setShowEditModal(true)}
                  onExportParticipants={handleExportParticipants}
                  onClose={handleCloseEvent}
                  onDelete={() => {
                    // TODO: Implement delete event
                    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
                      alert('Delete event functionality coming soon');
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Event Header */}
          <EventHeader
            title={event.title}
            category={event.category}
            hostName={event.host_name || 'Unknown'}
            meetingTime={event.meeting_time}
            locationArea={event.location_area || 'Location TBD'}
            venueName={event.location_type === 'fixed' ? event.fixed_venue_name : undefined}
            venueAddress={event.location_type === 'fixed' ? event.fixed_venue_address : undefined}
            participantCount={participants.length}
            participantLimit={event.participant_limit}
            participantAvatars={participantAvatars}
            onShare={handleShare}
            onJoin={!isParticipant ? handleJoinClick : undefined}
            onLeave={isParticipant ? handleLeaveClick : undefined}
            onEdit={isHost ? () => setShowEditModal(true) : undefined}
            userRole={isHost ? 'host' : isParticipant ? 'participant' : 'guest'}
            isHost={isHost}
            isParticipant={isParticipant}
            isJoining={isJoining}
            isLeaving={isLeaving}
          />

          {/* About Section */}
          <EventAbout description={event.description} />

          {/* Host Section */}
          <EventHost
            hostName={event.host_name || 'Unknown Host'}
            hostAvatar={hostAvatar}
            hostBio={event.host_bio}
            contactNumber={event.host_contact_number}
          />

          {/* Participants Section */}
          <EventParticipants
            participants={formattedParticipants}
            participantCount={participants.length}
            participantLimit={event.participant_limit}
            isHost={isHost}
            onManage={isHost ? handleManageParticipants : undefined}
          />

          {/* Meeting Location Section - Different for fixed vs collaborative events */}
          {event.location_type === 'fixed' ? (
            // Fixed Location Events: Show meeting location card
            <div className="bg-white border-t border-gray-300 px-8 py-6">
              <h2 className="text-xl font-bold text-black mb-4">📍 Meeting Location</h2>
              <MeetingLocationCard
                venueName={event.fixed_venue_name || event.location_area}
                venueAddress={event.fixed_venue_address}
                lat={event.fixed_venue_lat}
                lng={event.fixed_venue_lng}
              />
            </div>
          ) : (
            // Collaborative Events: Show venues with voting
            <EventVenues
              candidates={candidates}
              selectedCandidate={selectedCandidate}
              onCandidateClick={setSelectedCandidate}
              onVote={handleVote}
              onAddVenue={handleAddVenue}
              participantId={participantId || undefined}
              allowVote={event.allow_vote}
              isParticipant={isParticipant}
            />
          )}
        </div>
      ) : (
        <div className="max-w-7xl mx-auto p-8">
          <div className="bg-gray-100 rounded-lg p-12 text-center">
            <h2 className="text-2xl font-bold text-black mb-4">
              🗺️ Collaborative Planning Interface
            </h2>
            {eventId?.startsWith('mock-') ? (
              <>
                <p className="text-gray-600 mb-4">
                  The collaborative planning feature is only available for real events created through the platform.
                </p>
                <p className="text-gray-500 text-sm">
                  This is a demo event. Create a real event to access the interactive map and location planning tools.
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  This will show the interactive map and planning tools from the existing event page.
                </p>
                <button
                  onClick={() => router.push(`/event?id=${eventId}${joinToken ? `&token=${joinToken}` : ''}`)}
                  className="px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Go to Planning Interface
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-4xl">🔗</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-black mb-2 text-center">
              Share Event
            </h3>
            <p className="text-sm text-gray-500 mb-4 text-center">
              Copy the link to invite others to this event
            </p>
            <div className="bg-gray-100 p-3 rounded-lg mb-4 break-all text-sm text-gray-700">
              {window.location.origin}/event-detail?id={eventId}
              {joinToken && `&token=${joinToken}`}
            </div>

            {/* Copy Link Button */}
            <button
              onClick={copyShareLink}
              className="w-full px-4 py-2.5 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors mb-4"
            >
              Copy Link
            </button>

            {/* Social Sharing Buttons */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3 text-center">Or share via:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/event-detail?id=${eventId}${joinToken ? `&token=${joinToken}` : ''}`;
                    const text = `Join me at ${event?.title || 'this event'}!`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:border-green-500 hover:text-green-600 transition-colors"
                >
                  <span className="text-xl">📱</span>
                  WhatsApp
                </button>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/event-detail?id=${eventId}${joinToken ? `&token=${joinToken}` : ''}`;
                    const subject = `Join me at ${event?.title || 'this event'}`;
                    const body = `I thought you might be interested in this event:\n\n${event?.title || 'Event'}\n${event?.description || ''}\n\n${url}`;
                    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                  <span className="text-xl">📧</span>
                  Email
                </button>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/event-detail?id=${eventId}${joinToken ? `&token=${joinToken}` : ''}`;
                    const text = `Join me at ${event?.title || 'this event'}!`;
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:border-sky-500 hover:text-sky-600 transition-colors"
                >
                  <span className="text-xl">🐦</span>
                  Twitter
                </button>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/event-detail?id=${eventId}${joinToken ? `&token=${joinToken}` : ''}`;
                    const text = `Join me at ${event?.title || 'this event'}! ${url}`;
                    window.open(`sms:?&body=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:border-purple-500 hover:text-purple-600 transition-colors"
                >
                  <span className="text-xl">💬</span>
                  Messages
                </button>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full px-4 py-2.5 border border-gray-300 text-black font-medium rounded-lg hover:border-black transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Join Event Dialog */}
      <JoinEventDialog
        isOpen={showJoinDialog}
        onClose={() => setShowJoinDialog(false)}
        onConfirm={handleJoinConfirm}
        eventTitle={event?.title || 'this event'}
        isLoading={isJoining}
      />

      {/* Leave Event Dialog */}
      <LeaveEventDialog
        isOpen={showLeaveDialog}
        onClose={() => setShowLeaveDialog(false)}
        onConfirm={handleLeaveConfirm}
        isLoading={isLeaving}
      />

      {/* Edit Event Modal */}
      {event && (
        <EditEventModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditEvent}
          initialData={{
            title: event.title,
            description: event.description,
            meeting_time: event.meeting_time,
            participant_limit: event.participant_limit,
            status: event.status,
          }}
        />
      )}

      {/* Manage Participants Modal */}
      <ManageParticipantsModal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        participants={formattedParticipants}
        onRemoveParticipant={handleRemoveParticipant}
      />

      {/* Remove Participant Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRemoveConfirm}
        onClose={() => {
          setShowRemoveConfirm(false);
          setParticipantToRemove(null);
        }}
        onConfirm={confirmRemoveParticipant}
        title="Remove Participant?"
        message="This will remove this participant from the event. They will no longer have access to event details."
        confirmText="Remove Participant"
        cancelText="Keep Participant"
        confirmVariant="danger"
        isLoading={isRemoving}
      />

      {/* Close Event Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCloseConfirm}
        onClose={() => {
          setShowCloseConfirm(false);
        }}
        onConfirm={confirmCloseEvent}
        title="Close Event?"
        message="This will mark the event as closed. The event will still appear in your My Posts, but will no longer appear in the public Events Feed. Participants will still be able to view event details."
        confirmText="Close Event"
        cancelText="Keep Open"
        confirmVariant="default"
        isLoading={isClosing}
      />

      {/* Toast Notifications */}
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}

// Main export with Suspense boundary
export default function EventDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <EventDetailContent />
    </Suspense>
  );
}
