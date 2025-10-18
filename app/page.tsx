'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, CreateEventRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from '@/lib/i18n';

export default function Home() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const { t, language } = useTranslation();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Event creation form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('restaurant');
  const [visibility, setVisibility] = useState<'blur' | 'show'>('blur');
  const [allowVote, setAllowVote] = useState(true);

  const handleCreateEvent = async () => {
    if (!title.trim()) {
      setError(t.pleaseEnterTitle);
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
        setError(t.invalidJoinLink);
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
      setError(t.invalidJoinLinkFormat);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Logo size="md" showText={true} />
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            {user ? (
              <>
                <span className="text-gray-600">
                  {t.hello}, {user.name || user.email}
                </span>
                <Link
                  href="/my-events"
                  className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  {t.myEvents}
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-gray-600 hover:text-gray-700 font-medium"
                >
                  {t.logOut}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-600 hover:text-gray-700 font-medium"
                >
                  {t.logIn}
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {t.signUp}
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
            <Logo size="lg" showText={true} className="mb-6 justify-center text-5xl" />
            <p className="text-xl text-gray-600">
              {t.tagline}
            </p>
          </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{t.createNewEvent}</h2>

          {/* Event Creation Form */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.eventTitle}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.eventTitlePlaceholder}
                className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.lookingFor}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="restaurant">{t.categoryRestaurant}</option>
                <option value="cafe">{t.categoryCafe}</option>
                <option value="bar">{t.categoryBar}</option>
                <option value="park">{t.categoryPark}</option>
                <option value="basketball_court">{t.categoryBasketballCourt}</option>
                <option value="gym">{t.categoryGym}</option>
                <option value="library">{t.categoryLibrary}</option>
                <option value="movie_theater">{t.categoryMovieTheater}</option>
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
                <span className="text-sm text-gray-700">{t.allowVoting}</span>
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
            {isCreating ? t.creatingEvent : t.createEventGetLink}
          </button>
        </div>

        {/* Join Event */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            {t.alreadyHaveLink}
          </h3>
          <button
            onClick={handleJoinWithLink}
            className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors border-2 border-gray-300"
          >
            {t.joinExistingEvent}
          </button>
        </div>

        {/* Features List */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-4">
            <div className="text-3xl mb-2">📍</div>
            <h4 className="font-semibold text-gray-800 mb-1">{t.addLocationsFeature}</h4>
            <p className="text-sm text-gray-600">
              {t.addLocationsDescription}
            </p>
          </div>
          <div className="p-4">
            <div className="text-3xl mb-2">🎯</div>
            <h4 className="font-semibold text-gray-800 mb-1">{t.findVenuesFeature}</h4>
            <p className="text-sm text-gray-600">
              {t.findVenuesDescription}
            </p>
          </div>
          <div className="p-4">
            <div className="text-3xl mb-2">🗳️</div>
            <h4 className="font-semibold text-gray-800 mb-1">{t.voteTogetherFeature}</h4>
            <p className="text-sm text-gray-600">
              {t.voteTogetherDescription}
            </p>
          </div>
        </div>
        </div>
      </div>
    </main>
  );
}
