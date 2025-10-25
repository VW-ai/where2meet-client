'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api, Event } from '@/lib/api';

export default function MyEventsPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (token) {
          // Logged in: fetch events from backend
          const userEvents = await api.getUserEvents(token);
          setEvents(userEvents);
        } else {
          // Anonymous: load events from localStorage
          const storedEventIds = localStorage.getItem('my_events');
          if (storedEventIds) {
            const eventIds = JSON.parse(storedEventIds) as string[];
            const eventPromises = eventIds.map(id => api.getEvent(id).catch(() => null));
            const loadedEvents = (await Promise.all(eventPromises)).filter(e => e !== null) as Event[];
            setEvents(loadedEvents);
          }
        }
      } catch (err) {
        console.error('Failed to load events:', err);
        setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [token]);

  const handleEventClick = (eventId: string) => {
    router.push(`/event?id=${eventId}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-gray-800">
            Where2Meet
          </Link>
          {user && (
            <span className="text-gray-600">
              Hello, {user.name || user.email}
            </span>
          )}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-4 pt-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Events</h1>
          <p className="text-gray-600">
            {user
              ? 'Events you have created'
              : 'Events from this browser (stored locally)'}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading your events...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && events.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Events Yet</h2>
            <p className="text-gray-600 mb-6">
              You haven't created any events. Start by creating one!
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-green-700 transition-all shadow-lg"
            >
              Create New Event
            </Link>
          </div>
        )}

        {/* Events List */}
        {!isLoading && events.length > 0 && (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => handleEventClick(event.id)}
                className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-2xl transition-shadow border border-gray-200"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <span>📍</span>
                        {event.category}
                      </span>
                      {event.allow_vote && (
                        <span className="flex items-center gap-1">
                          <span>🗳️</span>
                          Voting enabled
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Created {new Date(event.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="ml-4">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create New Event Button */}
        {!isLoading && events.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-green-700 transition-all shadow-lg"
            >
              Create New Event
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
