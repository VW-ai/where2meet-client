'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';
import EventHeroImage from '@/components/EventHeroImage';
import EventHeader from '@/components/EventHeader';
import EventAbout from '@/components/EventAbout';
import EventParticipants from '@/components/EventParticipants';
import EventVenues from '@/components/EventVenues';
import EventHostSettings from '@/components/EventHostSettings';
import EditEventModal from '@/components/EditEventModal';
import ManageParticipantsModal from '@/components/ManageParticipantsModal';
import MeetingLocationCard from '@/components/MeetingLocationCard';
import Header from '@/components/Header';
import JoinEventDialog from '@/components/JoinEventDialog';
import LeaveEventDialog from '@/components/LeaveEventDialog';
import { api } from '@/lib/api';
import { Event, Candidate } from '@/types';

function EventDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Event state
  const [eventId, setEventId] = useState<string | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [role, setRole] = useState<'host' | 'participant' | 'guest'>('guest');
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [joinToken, setJoinToken] = useState<string | null>(null);

  // Data state
  const [participants, setParticipants] = useState<Array<{ id: string; name: string; email?: string }>>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // UI state
  const [isInitializing, setIsInitializing] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
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

      // Check if user is host or participant
      const storedRole = sessionStorage.getItem('role');
      const storedToken = sessionStorage.getItem('joinToken') || token;
      const storedParticipantId = sessionStorage.getItem('participantId');

      setRole((storedRole as 'host' | 'participant') || 'guest');
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

  // Load event data from API
  const loadEventData = async (id: string) => {
    try {
      console.log('📡 Loading event from API:', id);
      const response = await api.getEventFeedDetail(id);

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
      }));
      setCandidates(convertedVenues);

      // Update role based on backend response
      if (response.user_role && response.user_role !== 'guest') {
        setRole(response.user_role);
      }

      console.log('✅ Event loaded successfully');
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

    setIsJoining(true);
    try {
      // Implement join logic here
      toast.success('Successfully joined the event!');
      setRole('participant');
      setShowJoinDialog(false);
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
    if (!eventId || !participantId) return;

    setIsLeaving(true);
    try {
      // Implement leave logic here
      toast.success('Successfully left the event');
      setRole('guest');
      setParticipantId(null);
      setShowLeaveDialog(false);
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

  // Vote on candidate
  const handleVote = async (candidateId: string) => {
    if (!eventId || !participantId || !event?.allow_vote) return;

    try {
      await api.castVote(eventId, participantId, candidateId);
      await loadEventData(eventId);
      toast.success('Vote cast successfully!');
    } catch (err) {
      console.error('Failed to vote:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to vote');
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
    if (!eventId) return;

    try {
      // Implement edit event API call here
      // await api.updateEvent(eventId, data);

      // Update local state
      setEvent((prev) =>
        prev
          ? {
              ...prev,
              title: data.title,
              description: data.description,
              meeting_time: data.meeting_time,
              participant_limit: data.participant_limit,
              status: data.status,
            }
          : null
      );

      toast.success('Event updated successfully!');
      setShowEditModal(false);
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
  const handleRemoveParticipant = async (participantId: string) => {
    if (!eventId) return;

    try {
      // Implement remove participant API call here
      // await api.removeParticipant(eventId, participantId);

      // Update local state
      setParticipants((prev) => prev.filter((p) => p.id !== participantId));

      toast.success('Participant removed successfully');
    } catch (err) {
      console.error('Failed to remove participant:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to remove participant');
      throw err; // Let modal handle the error
    }
  };

  // Close event (host only)
  const handleCloseEvent = () => {
    if (!eventId || !event) return;

    if (
      !confirm(
        `Close "${event.title}"? This will stop accepting new participants. You can reopen it later from the event settings.`
      )
    ) {
      return;
    }

    try {
      // Implement close event API call here
      // await api.updateEvent(eventId, { status: 'closed' });

      // Update local state
      setEvent((prev) => (prev ? { ...prev, status: 'closed' } : null));

      toast.success('Event closed successfully');
    } catch (err) {
      console.error('Failed to close event:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to close event');
    }
  };

  // Delete event (host only)
  const handleDeleteEvent = () => {
    if (!eventId || !event) return;

    if (
      !confirm(
        `⚠️ DELETE "${event.title}"?\n\nThis action CANNOT be undone. All participant data, votes, and venue suggestions will be permanently removed.\n\nType "DELETE" to confirm.`
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
      // Implement delete event API call here
      // await api.deleteEvent(eventId);

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
    avatar: undefined, // Add avatar URL from API if available
    isHost: p.id === event.host_id,
  }));

  // Get participant avatars for header
  const participantAvatars = participants.slice(0, 4).map(p =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'User')}&background=random`
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header
        user={role === 'host' || role === 'participant' ? { name: 'User', email: '' } : null}
        onLogin={() => router.push('/login')}
        onLogout={() => {}}
        onSignup={() => router.push('/signup')}
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
          {/* Hero Image */}
          <EventHeroImage
            imageUrl={event.background_image}
            category={event.category}
            status={role}
          />

          {/* Event Header */}
          <EventHeader
            title={event.title}
            category={event.category}
            hostName={event.host_name || 'Unknown'}
            meetingTime={event.meeting_time}
            locationArea={event.location_area || 'Location TBD'}
            participantCount={participants.length}
            participantLimit={event.participant_limit}
            participantAvatars={participantAvatars}
            onShare={handleShare}
            onJoin={role === 'guest' ? handleJoinClick : undefined}
            onLeave={role === 'participant' ? handleLeaveClick : undefined}
            userRole={role}
            isJoining={isJoining}
            isLeaving={isLeaving}
          />

          {/* About Section */}
          <EventAbout description={event.description} />

          {/* Participants Section */}
          <EventParticipants
            participants={formattedParticipants}
            participantCount={participants.length}
            participantLimit={event.participant_limit}
            isHost={role === 'host'}
            onManage={role === 'host' ? handleManageParticipants : undefined}
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
              participantId={participantId || undefined}
              allowVote={event.allow_vote}
            />
          )}

          {/* Host Settings Section (Host Only) */}
          {role === 'host' && (
            <EventHostSettings
              visibility={event.visibility}
              status={event.status}
              participantLimit={event.participant_limit}
              allowVote={event.allow_vote}
              onEdit={() => setShowEditModal(true)}
              onClose={handleCloseEvent}
              onDelete={handleDeleteEvent}
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
