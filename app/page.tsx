'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, CreateEventRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Event creation form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('restaurant');
  const [visibility, setVisibility] = useState<'blur' | 'show'>('blur');
  const [allowVote, setAllowVote] = useState(true);

  const handleCreateEvent = async () => {
    if (!title.trim()) {
      setError('Please enter an event title');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const request: CreateEventRequest = {
        title: title.trim(),
        category,
        visibility,
        allow_vote: allowVote,
      };

      // Pass auth token if user is logged in
      const response = await api.createEvent(request, token || undefined);

      // Store event ID and role in sessionStorage
      sessionStorage.setItem('eventId', response.event.id);
      sessionStorage.setItem('role', 'host');
      sessionStorage.setItem('joinToken', response.join_token);

      // For anonymous users, store event ID in localStorage
      if (!token) {
        const storedEventIds = localStorage.getItem('my_events');
        const eventIds = storedEventIds ? JSON.parse(storedEventIds) : [];
        eventIds.unshift(response.event.id); // Add to beginning
        localStorage.setItem('my_events', JSON.stringify(eventIds));
      }

      // Navigate to event page
      router.push(`/event?id=${response.event.id}`);
    } catch (err) {
      console.error('Failed to create event:', err);
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinWithLink = () => {
    const link = prompt('Paste the event join link:');
    if (!link) return;

    try {
      // Extract event ID from link (format: http://...?id=EVENT_ID&token=TOKEN)
      const url = new URL(link);
      const eventId = url.searchParams.get('id');
      const token = url.searchParams.get('token');

      if (!eventId) {
        setError('Invalid join link: missing event ID');
        return;
      }

      // Store event ID and role in sessionStorage
      sessionStorage.setItem('eventId', eventId);
      sessionStorage.setItem('role', 'participant');
      if (token) {
        sessionStorage.setItem('joinToken', token);
      }

      // Navigate to event page
      router.push(`/event?id=${eventId}`);
    } catch (err) {
      console.error('Invalid join link:', err);
      setError('Invalid join link format');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-xl font-bold text-gray-800">Where2Meet</div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-gray-600">
                  Hello, {user.name || user.email}
                </span>
                <Link
                  href="/my-events"
                  className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  My Events
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-gray-600 hover:text-gray-700 font-medium"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-600 hover:text-gray-700 font-medium"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center p-4 pt-12">
        <div className="max-w-2xl w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">Where2Meet</h1>
            <p className="text-xl text-gray-600">
              Find the perfect meeting place for your group
            </p>
          </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Event</h2>

          {/* Event Creation Form */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Team Lunch, Weekend Hangout"
                className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Looking for
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="restaurant">Restaurant</option>
                <option value="cafe">Café</option>
                <option value="bar">Bar</option>
                <option value="park">Park</option>
                <option value="basketball_court">Basketball Court</option>
                <option value="gym">Gym</option>
                <option value="library">Library</option>
                <option value="movie_theater">Movie Theater</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowVote}
                  onChange={(e) => setAllowVote(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Allow voting</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleCreateEvent}
            disabled={isCreating || !title.trim()}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white text-lg font-semibold rounded-lg hover:from-blue-700 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isCreating ? 'Creating Event...' : 'Create Event & Get Link'}
          </button>
        </div>

        {/* Join Event */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Already have a link?
          </h3>
          <button
            onClick={handleJoinWithLink}
            className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors border-2 border-gray-300"
          >
            Join Existing Event
          </button>
        </div>

        {/* Features List */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-4">
            <div className="text-3xl mb-2">📍</div>
            <h4 className="font-semibold text-gray-800 mb-1">Add Locations</h4>
            <p className="text-sm text-gray-600">
              Everyone adds their location anonymously
            </p>
          </div>
          <div className="p-4">
            <div className="text-3xl mb-2">🎯</div>
            <h4 className="font-semibold text-gray-800 mb-1">Find Venues</h4>
            <p className="text-sm text-gray-600">
              Smart algorithm finds the perfect middle ground
            </p>
          </div>
          <div className="p-4">
            <div className="text-3xl mb-2">🗳️</div>
            <h4 className="font-semibold text-gray-800 mb-1">Vote Together</h4>
            <p className="text-sm text-gray-600">
              Let everyone vote on their favorite spot
            </p>
          </div>
        </div>
        </div>
      </div>
    </main>
  );
}
