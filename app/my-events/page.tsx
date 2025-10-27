'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Event } from '@/lib/api';
import { MapPin, Users, Map, Calendar, Trash2, Copy, X } from 'lucide-react';

interface EventWithDetails extends Event {
  participant_count?: number;
  candidate_count?: number;
}

export default function MyEventsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  // Fetch user's events
  useEffect(() => {
    const fetchMyEvents = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get event IDs from localStorage (for anonymous users)
        const storedEventIds = localStorage.getItem('my_events');
        const eventIds = storedEventIds ? JSON.parse(storedEventIds) : [];

        if (eventIds.length === 0) {
          setEvents([]);
          setLoading(false);
          return;
        }

        // Fetch events from backend
        const eventsPromises = eventIds.map(async (id: string) => {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/events/${id}`);
            if (!response.ok) throw new Error('Failed to fetch event');
            return await response.json();
          } catch (err) {
            console.error(`Failed to fetch event ${id}:`, err);
            return null;
          }
        });

        const fetchedEvents = (await Promise.all(eventsPromises)).filter(e => e !== null);
        setEvents(fetchedEvents);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch events:', err);
        setError('Failed to load your events. Please try again.');
        setEvents([]);
        setLoading(false);
      }
    };

    fetchMyEvents();
  }, [user]);

  const handleViewEvent = (eventId: string) => {
    router.push(`/event?id=${eventId}`);
  };

  const openDeleteModal = (eventId: string) => {
    setEventToDelete(eventId);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setEventToDelete(null);
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/events/${eventToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      // Remove from localStorage
      const storedEventIds = localStorage.getItem('my_events');
      if (storedEventIds) {
        const eventIds = JSON.parse(storedEventIds);
        const updatedIds = eventIds.filter((id: string) => id !== eventToDelete);
        localStorage.setItem('my_events', JSON.stringify(updatedIds));
      }

      setEvents(prev => prev.filter(event => event.id !== eventToDelete));
      closeDeleteModal();
    } catch (err) {
      console.error('Failed to delete event:', err);
      alert('Failed to delete event. Please try again.');
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getExpiresIn = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return 'Expired';
    if (daysLeft === 0) return 'Expires today';
    if (daysLeft === 1) return 'Expires tomorrow';
    return `${daysLeft} days left`;
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <Header user={user} onLogout={logout} />

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold text-black uppercase mb-2">My Events</h1>
          <p className="text-sm text-gray-600">Find Meeting Point events you've created or joined</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border-2 border-black bg-white p-6 animate-pulse">
                <div className="h-6 bg-gray-200 w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 w-1/2 mb-3"></div>
                <div className="h-4 bg-gray-200 w-2/3"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="py-12 text-center">
            <p className="text-red-600 text-sm mb-4 font-bold uppercase">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 border-2 border-black text-black text-sm font-bold uppercase hover:bg-gray-100 transition-all bg-white"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && events.length === 0 && (
          <div className="py-12 text-center border-2 border-black p-8">
            <MapPin className="w-16 h-16 text-black mx-auto mb-4" />
            <h3 className="text-lg font-bold text-black uppercase mb-2">No events yet</h3>
            <p className="text-sm text-gray-600 mb-6">
              You haven't created any Find Meeting Point events yet.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-black text-white text-sm font-bold uppercase hover:bg-gray-900 transition-all border-2 border-black"
            >
              Create Your First Event
            </button>
          </div>
        )}

        {/* Events List */}
        {!loading && !error && events.length > 0 && (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="border-2 border-black bg-white p-6 hover:bg-gray-50 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-black uppercase mb-2">{event.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {event.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {event.participant_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Map className="w-3.5 h-3.5" /> {event.candidate_count || 0} venues
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs font-bold uppercase px-3 py-1.5 border-2 ${
                      getExpiresIn(event.expires_at).includes('Expired')
                        ? 'border-red-600 text-red-600 bg-white'
                        : getExpiresIn(event.expires_at).includes('today') || getExpiresIn(event.expires_at).includes('tomorrow')
                        ? 'border-yellow-600 text-yellow-600 bg-white'
                        : 'border-green-600 text-green-600 bg-white'
                    }`}>
                      {getExpiresIn(event.expires_at)}
                    </span>
                  </div>
                </div>

                <div className="mb-4 text-xs text-gray-500 flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  <span>Created: {formatDate(event.created_at)}</span>
                  <span>•</span>
                  <span>Expires: {formatDate(event.expires_at)}</span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleViewEvent(event.id)}
                    className="flex-1 py-2.5 px-4 bg-black text-white text-sm font-bold uppercase hover:bg-gray-900 transition-all border-2 border-black"
                  >
                    View Event
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/event?id=${event.id}`);
                      alert('Event link copied to clipboard!');
                    }}
                    className="py-2.5 px-4 border-2 border-black bg-white hover:bg-gray-100 transition-all"
                    title="Copy Link"
                  >
                    <Copy className="w-4 h-4 text-black" />
                  </button>
                  <button
                    onClick={() => openDeleteModal(event.id)}
                    className="py-2.5 px-4 border-2 border-red-600 bg-white hover:bg-red-50 transition-all"
                    title="Delete Event"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-600 hover:text-black font-bold uppercase transition-all"
          >
            ← Back to Home
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-black max-w-md w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            {/* Modal Header */}
            <div className="bg-black text-white p-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase">Delete Event</h3>
              <button
                onClick={closeDeleteModal}
                className="hover:bg-gray-800 transition-all p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-base text-black mb-6">
                Are you sure you want to delete this event? This action cannot be undone.
              </p>

              {/* Modal Actions */}
              <div className="flex gap-3">
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 py-2.5 px-4 border-2 border-black text-black text-sm font-bold uppercase hover:bg-gray-100 transition-all bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 px-4 border-2 border-red-600 bg-red-600 text-white text-sm font-bold uppercase hover:bg-red-700 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
