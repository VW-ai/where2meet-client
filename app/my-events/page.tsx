'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Event } from '@/lib/api';

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

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      // Remove from localStorage
      const storedEventIds = localStorage.getItem('my_events');
      if (storedEventIds) {
        const eventIds = JSON.parse(storedEventIds);
        const updatedIds = eventIds.filter((id: string) => id !== eventId);
        localStorage.setItem('my_events', JSON.stringify(updatedIds));
      }

      setEvents(prev => prev.filter(event => event.id !== eventId));
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">My Events</h1>
          <p className="text-gray-600">Find Meeting Point events you've created or joined</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-300 bg-white p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="py-12 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 border border-black text-black hover:bg-gray-50 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && events.length === 0 && (
          <div className="py-12 text-center">
            <div className="text-6xl mb-4">📍</div>
            <h3 className="text-xl font-bold text-black mb-2">No events yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't created any Find Meeting Point events yet.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors font-medium"
            >
              Create Your First Event
            </button>
          </div>
        )}

        {/* Events List */}
        {!loading && !error && events.length > 0 && (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="border border-gray-300 bg-white p-6 hover:border-black transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-black mb-1">{event.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>📍 {event.category}</span>
                      <span>👥 {event.participant_count || 0} participants</span>
                      <span>🗺️ {event.candidate_count || 0} venues</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs font-medium px-3 py-1 ${
                      getExpiresIn(event.expires_at).includes('Expired')
                        ? 'bg-red-100 text-red-700'
                        : getExpiresIn(event.expires_at).includes('today') || getExpiresIn(event.expires_at).includes('tomorrow')
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {getExpiresIn(event.expires_at)}
                    </span>
                  </div>
                </div>

                <div className="mb-4 text-sm text-gray-500">
                  <span>Created: {formatDate(event.created_at)}</span>
                  <span className="mx-2">•</span>
                  <span>Expires: {formatDate(event.expires_at)}</span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleViewEvent(event.id)}
                    className="flex-1 py-2 px-4 bg-black text-white hover:bg-gray-800 transition-colors font-medium"
                  >
                    View Event
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/event?id=${event.id}`);
                      alert('Event link copied to clipboard!');
                    }}
                    className="py-2 px-4 border border-gray-300 text-gray-700 hover:border-black hover:text-black transition-colors font-medium"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="py-2 px-4 border border-red-300 text-red-600 hover:bg-red-50 transition-colors font-medium"
                  >
                    Delete
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
            className="text-gray-600 hover:text-black font-medium"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </main>
  );
}
