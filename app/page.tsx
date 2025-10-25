'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, CreateEventRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from '@/lib/i18n';
import MagicBento from '@/components/MagicBento';
import Header from '@/components/Header';
import EventCard from '@/components/EventCard';
import EventCardSkeleton from '@/components/EventCardSkeleton';
import PostEventModal from '@/components/PostEventModal';
import { Event as EventFeedType } from '@/types';

export default function Home() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const { t, language } = useTranslation();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Event creation form state
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState<'blur' | 'show'>('blur');
  const [allowVote, setAllowVote] = useState(true);
  const [meetingTime, setMeetingTime] = useState('');

  // Events feed state
  const [events, setEvents] = useState<EventFeedType[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [nearMeFilter, setNearMeFilter] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreEvents, setHasMoreEvents] = useState(true);
  const [showPostEventModal, setShowPostEventModal] = useState(false);
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>([]);
  const [hostedEventIds, setHostedEventIds] = useState<string[]>([]);
  const [mobileTab, setMobileTab] = useState<'meeting' | 'events' | 'lists'>('events');
  const [isEventFeedFullscreen, setIsEventFeedFullscreen] = useState(false);

  // Subcategories for each main category (only sports and entertainment)
  const subCategories: Record<string, string[]> = {
    sports: ['Basketball', 'Soccer', 'Tennis', 'Running', 'Gym', 'Cycling', 'Volleyball', 'Badminton'],
    entertainment: ['Movies', 'Theater', 'Concerts', 'Museums', 'Gaming', 'Comedy', 'Karaoke', 'Festival'],
  };

  // Generate next 14 days for date selector (scrollable)
  const getNext14Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        date: date.getDate(),
        fullDate: date,
        isToday: i === 0,
      });
    }
    return days;
  };

  const weekDays = getNext14Days();

  // Fetch events from backend API
  // Note: Mock data has been removed - this now connects to real backend

  // Fetch events from backend API
  const fetchEvents = async (page = 1, append = false) => {
    setEventsLoading(true);
    setEventsError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('page_size', '20');

      // Apply filters
      if (selectedDate) {
        // Format date in local timezone (YYYY-MM-DD) instead of UTC
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        params.append('date', `${year}-${month}-${day}`);

        // Send timezone offset in minutes (e.g., -480 for PST which is UTC-8)
        const timezoneOffset = selectedDate.getTimezoneOffset();
        params.append('timezone_offset', timezoneOffset.toString());
      }
      // If subcategory is selected, send it; otherwise send parent category
      if (selectedSubCategory) {
        params.append('category', selectedSubCategory);
      } else if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      if (nearMeFilter && userLocation) {
        params.append('near_me', 'true');
        params.append('user_lat', userLocation.lat.toString());
        params.append('user_lng', userLocation.lng.toString());
      }

      // Call backend API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/feed/events?${params}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (append) {
        setEvents((prev) => [...prev, ...(data.events || [])]);
      } else {
        setEvents(data.events || []);
      }

      setHasMoreEvents(data.has_more || false);
      setCurrentPage(page);
      setEventsLoading(false);
    } catch (err) {
      console.error('Failed to fetch events:', err);

      // Check if it's a network error (backend not running)
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setEventsError('Backend server is not running. Please start the server with ./start_all.sh');
      } else {
        setEventsError('Failed to load events. Please try again.');
      }

      setEvents([]);
      setEventsLoading(false);
    }
  };

  // Fetch events on mount and when filters change
  useEffect(() => {
    fetchEvents(1, false);
  }, [selectedDate, nearMeFilter, selectedCategory, selectedSubCategory, userLocation]);

  // Request geolocation for "Near Me" filter
  const handleNearMeToggle = () => {
    if (!nearMeFilter && !userLocation) {
      // Request location
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            setNearMeFilter(true);
          },
          (error) => {
            console.error('Geolocation error:', error);
            alert('Unable to get your location. Please enable location permissions.');
          }
        );
      } else {
        alert('Geolocation is not supported by your browser.');
      }
    } else {
      setNearMeFilter(!nearMeFilter);
    }
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    if (selectedDate && selectedDate.toDateString() === date.toDateString()) {
      setSelectedDate(null); // Deselect if clicking same date
    } else {
      setSelectedDate(date);
    }
  };

  // Handle post event
  const handlePostEvent = async (data: {
    title: string;
    description?: string;
    meeting_time: string;
    location_area: string;
    location_coords?: { lat: number; lng: number };
    category?: any;
    participant_limit?: number;
    visibility: 'public' | 'link_only';
    location_type?: 'fixed' | 'collaborative';
    fixed_venue_name?: string;
    fixed_venue_address?: string;
    fixed_venue_lat?: number;
    fixed_venue_lng?: number;
    background_image?: string;
  }) => {
    if (!token) {
      alert('Please log in to create an event.');
      router.push('/login');
      return;
    }

    try {
      // Convert location_coords object to flat fields for backend
      const backendData: any = {
        ...data,
        location_coords_lat: data.location_coords?.lat,
        location_coords_lng: data.location_coords?.lng,
        allow_vote: true,
      };
      delete backendData.location_coords;

      // Call backend API to create event
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/feed/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(backendData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to create event' }));
        throw new Error(errorData.detail || 'Failed to create event');
      }

      const newEvent = await response.json();

      // Add to local events list
      setEvents((prev) => [newEvent, ...prev]);
      setHostedEventIds((prev) => [...prev, newEvent.id]);

      alert('✅ Event posted successfully!');
    } catch (err) {
      console.error('Failed to create event:', err);
      alert(`❌ Failed to post event: ${err instanceof Error ? err.message : 'Please try again.'}`);
      throw err;
    }
  };

  // Handle join event
  const handleJoinEvent = async (eventId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!token) {
      alert('Please log in to join events.');
      return;
    }

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

      setJoinedEventIds((prev) => [...prev, eventId]);

      // Update participant count in local state
      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId
            ? { ...event, participant_count: event.participant_count + 1 }
            : event
        )
      );
    } catch (err) {
      console.error('Failed to join event:', err);
      alert(err instanceof Error ? err.message : 'Failed to join event. Please try again.');
    }
  };

  // Handle leave event
  const handleLeaveEvent = async (eventId: string) => {
    if (!token) {
      alert('Please log in to leave events.');
      return;
    }

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

      setJoinedEventIds((prev) => prev.filter((id) => id !== eventId));

      // Update participant count in local state
      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId
            ? { ...event, participant_count: Math.max(0, event.participant_count - 1) }
            : event
        )
      );
    } catch (err) {
      console.error('Failed to leave event:', err);
      alert(err instanceof Error ? err.message : 'Failed to leave event. Please try again.');
    }
  };

  // Handle view event
  const handleViewEvent = (eventId: string) => {
    // For mock events, use the new event-detail page
    // For real events from backend, you can add logic to distinguish
    router.push(`/event-detail?id=${eventId}`);
  };

  // Load more events
  const handleLoadMore = () => {
    if (!eventsLoading && hasMoreEvents) {
      fetchEvents(currentPage + 1, true);
    }
  };

  const handleCreateEvent = async () => {
    if (!title.trim()) {
      setError(t.pleaseEnterEventTitle);
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const request: CreateEventRequest = {
        title: title.trim(),
        category: 'restaurant', // Default category
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
    <main className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <Header user={user} onLogout={logout} />

      {/* Mobile Layout - Only visible on mobile/tablet */}
      <div className="block lg:hidden pb-20">
        {/* Mobile Tab Content */}
        <div className="min-h-[calc(100vh-140px)]">
          {/* Find Meeting Point Tab */}
          {mobileTab === 'meeting' && (
            <div className="p-4 sm:p-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">📍 Find Meeting Point</h2>

              {/* Meeting Point Form */}
              <div className="space-y-5">
                <div>
                  <label className="block text-base sm:text-lg font-medium text-black mb-2">
                    Meeting Name
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Team Lunch, Coffee Catch-up"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base sm:text-lg text-black border border-gray-300 rounded-lg focus:border-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-base sm:text-lg font-medium text-black mb-2">
                    Meeting Time
                  </label>
                  <input
                    type="datetime-local"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base sm:text-lg text-black border border-gray-300 rounded-lg focus:border-black focus:outline-none"
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer text-base sm:text-lg text-black">
                  <input
                    type="checkbox"
                    checked={allowVote}
                    onChange={(e) => setAllowVote(e.target.checked)}
                    className="w-5 h-5 border-2 border-gray-300 rounded"
                    style={{ accentColor: '#000000' }}
                  />
                  <span suppressHydrationWarning>{t.allowVoting}</span>
                </label>
              </div>

              {error && (
                <div className="mt-5 p-3 sm:p-4 border border-red-500 rounded-lg text-red-700 text-base sm:text-lg">
                  {error}
                </div>
              )}

              <div className="space-y-3 mt-6">
                <button
                  onClick={handleCreateEvent}
                  disabled={isCreating || !title.trim()}
                  className="w-full py-3 text-base sm:text-lg bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Finding...' : 'Find Meeting Point'}
                </button>

                <button
                  onClick={handleJoinWithLink}
                  className="w-full py-3 text-base sm:text-lg border-2 border-black text-black font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  suppressHydrationWarning
                >
                  {t.joinExistingEvent}
                </button>
              </div>
            </div>
          )}

          {/* Events Feed Tab */}
          {mobileTab === 'events' && (
            <div>
              {/* Header */}
              <div className="sticky top-0 bg-white z-30 border-b border-gray-300">
                <div className="px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
                  <h2 className="text-xl sm:text-2xl font-bold text-black">📅 Events Feed</h2>
                  <button
                    onClick={() => setShowPostEventModal(true)}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-black text-white hover:bg-gray-800 transition-colors font-medium text-sm sm:text-base rounded-lg"
                  >
                    + Post
                  </button>
                </div>

                {/* Date Selector */}
                <div className="px-4 sm:px-6 py-3 overflow-x-auto scrollbar-hide">
                  <div className="flex gap-2 min-w-max">
                    {weekDays.map((day, index) => (
                      <button
                        key={index}
                        onClick={() => handleDateSelect(day.fullDate)}
                        className={`py-1 px-2 transition-colors whitespace-nowrap min-w-[50px] rounded ${
                          selectedDate && selectedDate.toDateString() === day.fullDate.toDateString()
                            ? 'bg-black text-white'
                            : day.isToday
                            ? 'border-2 border-blue-500 text-gray-700'
                            : 'border border-gray-300 text-gray-700'
                        }`}
                      >
                        <div className="text-xs font-medium mb-1">{day.dayName}</div>
                        <div className="text-base font-bold">{day.date}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filters */}
                <div className="px-4 sm:px-6 py-3 border-t border-gray-200">
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    <button
                      onClick={() => {
                        setSelectedCategory(null);
                        setNearMeFilter(false);
                      }}
                      className={`px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap rounded ${
                        !selectedCategory && !nearMeFilter ? 'bg-black text-white' : 'border border-gray-300 text-gray-700'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={handleNearMeToggle}
                      className={`px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap rounded ${
                        nearMeFilter ? 'bg-black text-white' : 'border border-gray-300 text-gray-700'
                      }`}
                    >
                      📍 Near Me
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCategory('sports');
                        setSelectedSubCategory(null);
                        setNearMeFilter(false);
                      }}
                      className={`px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap rounded ${
                        selectedCategory === 'sports' ? 'bg-black text-white' : 'border border-gray-300 text-gray-700'
                      }`}
                    >
                      🏀 Sports
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCategory('entertainment');
                        setSelectedSubCategory(null);
                        setNearMeFilter(false);
                      }}
                      className={`px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap rounded ${
                        selectedCategory === 'entertainment' ? 'bg-black text-white' : 'border border-gray-300 text-gray-700'
                      }`}
                    >
                      🎬 Entertainment
                    </button>
                  </div>
                </div>

                {/* Subcategory Filters - Only shown when a category is selected (Mobile/Tablet) */}
                {selectedCategory && subCategories[selectedCategory] && (
                  <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                      <button
                        onClick={() => setSelectedSubCategory(null)}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap rounded ${
                          !selectedSubCategory
                            ? 'bg-black text-white'
                            : 'border border-gray-300 bg-white text-gray-700'
                        }`}
                      >
                        All {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
                      </button>
                      {subCategories[selectedCategory].map((subCat) => (
                        <button
                          key={subCat}
                          onClick={() => setSelectedSubCategory(subCat)}
                          className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap rounded ${
                            selectedSubCategory === subCat
                              ? 'bg-black text-white'
                              : 'border border-gray-300 bg-white text-gray-700'
                          }`}
                        >
                          {subCat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Event Cards */}
              <div className="p-4 sm:p-6 space-y-6">
                {eventsLoading && events.length === 0 && (
                  <>
                    {[...Array(2)].map((_, i) => (
                      <EventCardSkeleton key={i} />
                    ))}
                  </>
                )}

                {eventsError && !eventsLoading && (
                  <div className="py-8 text-center px-4">
                    <p className="text-red-600 mb-3 text-base">{eventsError}</p>
                    <button
                      onClick={() => fetchEvents(1, false)}
                      className="px-5 py-2 text-base border border-black text-black rounded-lg"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {!eventsLoading && !eventsError && events.length === 0 && (
                  <div className="py-8 text-center px-4">
                    <div className="text-5xl mb-3">📅</div>
                    <h3 className="text-xl font-bold text-black mb-2">No events found</h3>
                    <p className="text-base text-gray-600 mb-4">
                      {selectedDate ? 'No events on this day' : 'Be the first to post!'}
                    </p>
                    <button
                      onClick={() => setShowPostEventModal(true)}
                      className="px-5 py-2.5 text-base bg-black text-white rounded-lg"
                    >
                      Post Event
                    </button>
                  </div>
                )}

                {!eventsLoading && !eventsError && events.map((event) => {
                  const isHost = user && event.host_id === user.id;
                  const isParticipant = user && joinedEventIds.includes(event.id) && !isHost;
                  const userRole = isHost ? 'host' : isParticipant ? 'participant' : 'guest';

                  return (
                    <EventCard
                      key={event.id}
                      event={event}
                      userRole={userRole}
                      onView={handleViewEvent}
                      onJoin={handleJoinEvent}
                      onLeave={handleLeaveEvent}
                    />
                  );
                })}

                {!eventsLoading && !eventsError && events.length > 0 && hasMoreEvents && (
                  <div className="text-center pt-4">
                    <button
                      onClick={handleLoadMore}
                      disabled={eventsLoading}
                      className="px-5 py-2 text-base text-gray-600 font-medium"
                    >
                      {eventsLoading ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Other People's Lists Tab */}
          {mobileTab === 'lists' && (
            <div className="p-4 sm:p-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">⭐ Other People's Lists</h2>

              {/* Categories */}
              <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
                <button className="px-3 py-1.5 text-sm bg-black text-white rounded flex-shrink-0">All</button>
                <button className="px-3 py-1.5 text-sm text-gray-700 hover:text-black rounded flex-shrink-0">Food</button>
                <button className="px-3 py-1.5 text-sm text-gray-700 hover:text-black rounded flex-shrink-0">Sports</button>
                <button className="px-3 py-1.5 text-sm text-gray-700 hover:text-black rounded flex-shrink-0">Culture</button>
              </div>

              {/* Lists Grid - 1 column on mobile, 2 on tablet */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Placeholder list cards */}
                <div className="border border-gray-300 p-4 rounded-lg hover:border-black transition-colors">
                  <h3 className="font-semibold text-base text-black mb-2">🍜 Best Ramen in Tokyo</h3>
                  <p className="text-sm text-gray-600 mb-2">by @foodie_explorer</p>
                  <p className="text-sm text-gray-600 mb-3">📍 12 venues · ❤️ 234</p>
                  <button className="w-full py-2 px-3 border border-black text-black text-sm font-medium rounded hover:bg-gray-50">
                    View List
                  </button>
                </div>

                <div className="border border-gray-300 p-4 rounded-lg hover:border-black transition-colors">
                  <h3 className="font-semibold text-base text-black mb-2">☕ Best Coffee - NYC</h3>
                  <p className="text-sm text-gray-600 mb-2">by @coffee_addict</p>
                  <p className="text-sm text-gray-600 mb-3">📍 18 venues · ❤️ 567</p>
                  <button className="w-full py-2 px-3 border border-black text-black text-sm font-medium rounded hover:bg-gray-50">
                    View List
                  </button>
                </div>

                <div className="border border-gray-300 p-4 rounded-lg hover:border-black transition-colors">
                  <h3 className="font-semibold text-base text-black mb-2">🏋️ Best Gyms for CrossFit</h3>
                  <p className="text-sm text-gray-600 mb-2">by @fitness_freak</p>
                  <p className="text-sm text-gray-600 mb-3">📍 8 venues · ❤️ 123</p>
                  <button className="w-full py-2 px-3 border border-black text-black text-sm font-medium rounded hover:bg-gray-50">
                    View List
                  </button>
                </div>

                <div className="border border-gray-300 p-4 rounded-lg hover:border-black transition-colors">
                  <h3 className="font-semibold text-base text-black mb-2">🍕 NYC Pizza Joints</h3>
                  <p className="text-sm text-gray-600 mb-2">by @pizza_lover</p>
                  <p className="text-sm text-gray-600 mb-3">📍 15 venues · ❤️ 445</p>
                  <button className="w-full py-2 px-3 border border-black text-black text-sm font-medium rounded hover:bg-gray-50">
                    View List
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button className="text-gray-600 hover:text-black font-medium text-base">
                  View All Lists →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-black z-50">
          <div className="flex justify-around items-center h-16">
            <button
              onClick={() => setMobileTab('meeting')}
              className={`flex-1 flex flex-col items-center justify-center h-full transition-colors ${
                mobileTab === 'meeting' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl mb-1">📍</span>
              <span className="text-xs font-medium">Find Meeting</span>
            </button>

            <button
              onClick={() => setMobileTab('events')}
              className={`flex-1 flex flex-col items-center justify-center h-full transition-colors ${
                mobileTab === 'events' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl mb-1">📅</span>
              <span className="text-xs font-medium">Events Feed</span>
            </button>

            <button
              onClick={() => setMobileTab('lists')}
              className={`flex-1 flex flex-col items-center justify-center h-full transition-colors ${
                mobileTab === 'lists' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl mb-1">⭐</span>
              <span className="text-xs font-medium">Lists</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Only visible on desktop */}
      <div className="hidden lg:block">
        <div className={`transition-all duration-300 ${isEventFeedFullscreen ? 'max-w-full' : 'max-w-[1400px]'} mx-auto`}>
          <div className={`grid transition-all duration-300 ${isEventFeedFullscreen ? 'grid-cols-1' : 'grid-cols-[65%_35%]'}`}>
            {/* Left Column (65%) */}
            <div className={`border-r border-black transition-all duration-300 ${isEventFeedFullscreen ? 'hidden' : 'block'}`}>
              {/* Top Left: Find Meeting Point */}
              <div className="border-b border-black" style={{ minHeight: '50vh' }}>
                {/* Navigation Bar */}
                <div className="border-b border-gray-300 px-6 lg:px-8 py-3 lg:py-4 flex justify-between items-center">
                  <h2 className="text-xl lg:text-2xl xl:text-3xl font-bold text-black">
                    📍 Find Meeting Point
                  </h2>
                  {user && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push('/my-events')}
                        className="px-3 lg:px-4 py-1.5 lg:py-2 border border-gray-300 text-black hover:border-black transition-colors font-medium text-sm lg:text-base"
                      >
                        My Events
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6 lg:p-8">
                {/* Meeting Point Form */}
                <div className="space-y-5 lg:space-y-6 mb-6 lg:mb-8 max-w-xl">
                  <div>
                    <label className="block text-base lg:text-lg font-medium text-black mb-2">
                      Meeting Name
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Team Lunch, Coffee Catch-up"
                      className="w-full px-3 lg:px-4 py-2.5 lg:py-3 text-base lg:text-lg text-black border border-gray-300 focus:border-black focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-base lg:text-lg font-medium text-black mb-2">
                      Meeting Time
                    </label>
                    <input
                      type="datetime-local"
                      value={meetingTime}
                      onChange={(e) => setMeetingTime(e.target.value)}
                      className="w-full px-3 lg:px-4 py-2.5 lg:py-3 text-base lg:text-lg text-black border border-gray-300 focus:border-black focus:outline-none"
                    />
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer text-base lg:text-lg text-black">
                    <input
                      type="checkbox"
                      checked={allowVote}
                      onChange={(e) => setAllowVote(e.target.checked)}
                      className="w-5 h-5 border-2 border-gray-300"
                      style={{ accentColor: '#000000' }}
                    />
                    <span suppressHydrationWarning>{t.allowVoting}</span>
                  </label>
                </div>

                {error && (
                  <div className="mb-5 lg:mb-6 p-3 lg:p-4 border border-red-500 text-red-700 text-base lg:text-lg">
                    {error}
                  </div>
                )}

                <div className="space-y-3 lg:space-y-4 max-w-xl">
                  <button
                    onClick={handleCreateEvent}
                    disabled={isCreating || !title.trim()}
                    className="w-full py-2.5 lg:py-3 text-base lg:text-lg bg-black text-white font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? 'Finding...' : 'Find Meeting Point'}
                  </button>

                  <button
                    onClick={handleJoinWithLink}
                    className="w-full py-2.5 lg:py-3 text-base lg:text-lg border border-black text-black font-medium hover:bg-gray-50 transition-colors"
                    suppressHydrationWarning
                  >
                    {t.joinExistingEvent}
                  </button>
                </div>
                </div>
              </div>

              {/* Bottom Left: Other People's Lists */}
              <div className="overflow-y-auto" style={{ maxHeight: '50vh' }}>
                {/* Navigation Bar */}
                <div className="border-b border-gray-300 px-6 lg:px-8 py-3 lg:py-4 flex justify-between items-center sticky top-0 bg-white">
                  <h2 className="text-xl lg:text-2xl xl:text-3xl font-bold text-black">
                    ⭐ Other People's Lists
                  </h2>
                  <div className="flex gap-2">
                    <button className="px-2 lg:px-3 py-1 text-sm lg:text-base bg-black text-white">
                      All
                    </button>
                    <button className="px-2 lg:px-3 py-1 text-sm lg:text-base text-gray-700 hover:text-black">
                      Food
                    </button>
                    <button className="px-2 lg:px-3 py-1 text-sm lg:text-base text-gray-700 hover:text-black">
                      Sports
                    </button>
                    <button className="px-2 lg:px-3 py-1 text-sm lg:text-base text-gray-700 hover:text-black">
                      Culture
                    </button>
                  </div>
                </div>

                <div className="p-8">
                {/* Venue Lists - 3 Column Grid */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {/* List Card 1 */}
                  <div className="border border-gray-300 p-4 hover:border-black transition-colors">
                    <h3 className="font-semibold text-base text-black mb-2">
                      🍜 Best Ramen in Tokyo
                    </h3>
                    <p className="text-xs text-gray-600 mb-2">by @foodie_explorer</p>
                    <p className="text-xs text-gray-600 mb-3">
                      📍 12 venues · ❤️ 234
                    </p>
                    <div className="text-xs text-gray-700 mb-3 space-y-1">
                      <p className="font-medium">Preview:</p>
                      <p>1. Ichiran ⭐ 4.8</p>
                      <p>2. Ippudo ⭐ 4.7</p>
                      <p>3. Afuri ⭐ 4.6</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button className="w-full py-2 px-3 border border-black text-black text-xs font-medium hover:bg-gray-50 transition-colors">
                        View
                      </button>
                      <button className="w-full py-2 px-3 text-gray-600 hover:text-black text-xs font-medium">
                        Save
                      </button>
                    </div>
                  </div>

                  {/* List Card 2 */}
                  <div className="border border-gray-300 p-4 hover:border-black transition-colors">
                    <h3 className="font-semibold text-base text-black mb-2">
                      ☕ Best Coffee Shops - NYC
                    </h3>
                    <p className="text-xs text-gray-600 mb-2">by @coffee_addict</p>
                    <p className="text-xs text-gray-600 mb-3">
                      📍 18 venues · ❤️ 567
                    </p>
                    <div className="text-xs text-gray-700 mb-3 space-y-1">
                      <p className="font-medium">Preview:</p>
                      <p>1. Blue Bottle ⭐ 4.9</p>
                      <p>2. La Colombe ⭐ 4.8</p>
                      <p>3. Stumptown ⭐ 4.7</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button className="w-full py-2 px-3 border border-black text-black text-xs font-medium hover:bg-gray-50 transition-colors">
                        View
                      </button>
                      <button className="w-full py-2 px-3 text-gray-600 hover:text-black text-xs font-medium">
                        Save
                      </button>
                    </div>
                  </div>

                  {/* List Card 3 */}
                  <div className="border border-gray-300 p-4 hover:border-black transition-colors">
                    <h3 className="font-semibold text-base text-black mb-2">
                      🏋️ Best Gyms for CrossFit
                    </h3>
                    <p className="text-xs text-gray-600 mb-2">by @fitness_freak</p>
                    <p className="text-xs text-gray-600 mb-3">
                      📍 8 venues · ❤️ 123
                    </p>
                    <div className="text-xs text-gray-700 mb-3 space-y-1">
                      <p className="font-medium">Preview:</p>
                      <p>1. CrossFit Box ⭐ 4.9</p>
                      <p>2. Iron Paradise ⭐ 4.7</p>
                      <p>3. The WOD ⭐ 4.6</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button className="w-full py-2 px-3 border border-black text-black text-xs font-medium hover:bg-gray-50 transition-colors">
                        View
                      </button>
                      <button className="w-full py-2 px-3 text-gray-600 hover:text-black text-xs font-medium">
                        Save
                      </button>
                    </div>
                  </div>

                  {/* List Card 4 */}
                  <div className="border border-gray-300 p-4 hover:border-black transition-colors">
                    <h3 className="font-semibold text-base text-black mb-2">
                      🍕 NYC Pizza Joints
                    </h3>
                    <p className="text-xs text-gray-600 mb-2">by @pizza_lover</p>
                    <p className="text-xs text-gray-600 mb-3">
                      📍 15 venues · ❤️ 445
                    </p>
                    <div className="text-xs text-gray-700 mb-3 space-y-1">
                      <p className="font-medium">Preview:</p>
                      <p>1. Joe's Pizza ⭐ 4.9</p>
                      <p>2. Lombardi's ⭐ 4.8</p>
                      <p>3. Prince St ⭐ 4.7</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button className="w-full py-2 px-3 border border-black text-black text-xs font-medium hover:bg-gray-50 transition-colors">
                        View
                      </button>
                      <button className="w-full py-2 px-3 text-gray-600 hover:text-black text-xs font-medium">
                        Save
                      </button>
                    </div>
                  </div>

                  {/* List Card 5 */}
                  <div className="border border-gray-300 p-4 hover:border-black transition-colors">
                    <h3 className="font-semibold text-base text-black mb-2">
                      🌳 Best Parks for Picnics
                    </h3>
                    <p className="text-xs text-gray-600 mb-2">by @outdoors_fan</p>
                    <p className="text-xs text-gray-600 mb-3">
                      📍 10 venues · ❤️ 189
                    </p>
                    <div className="text-xs text-gray-700 mb-3 space-y-1">
                      <p className="font-medium">Preview:</p>
                      <p>1. Central Park ⭐ 5.0</p>
                      <p>2. Prospect Park ⭐ 4.8</p>
                      <p>3. Bryant Park ⭐ 4.6</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button className="w-full py-2 px-3 border border-black text-black text-xs font-medium hover:bg-gray-50 transition-colors">
                        View
                      </button>
                      <button className="w-full py-2 px-3 text-gray-600 hover:text-black text-xs font-medium">
                        Save
                      </button>
                    </div>
                  </div>

                  {/* List Card 6 */}
                  <div className="border border-gray-300 p-4 hover:border-black transition-colors">
                    <h3 className="font-semibold text-base text-black mb-2">
                      🎵 Live Music Venues
                    </h3>
                    <p className="text-xs text-gray-600 mb-2">by @music_nerd</p>
                    <p className="text-xs text-gray-600 mb-3">
                      📍 14 venues · ❤️ 356
                    </p>
                    <div className="text-xs text-gray-700 mb-3 space-y-1">
                      <p className="font-medium">Preview:</p>
                      <p>1. Blue Note ⭐ 4.9</p>
                      <p>2. Village Vanguard ⭐ 4.8</p>
                      <p>3. Bowery Ballroom ⭐ 4.7</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button className="w-full py-2 px-3 border border-black text-black text-xs font-medium hover:bg-gray-50 transition-colors">
                        View
                      </button>
                      <button className="w-full py-2 px-3 text-gray-600 hover:text-black text-xs font-medium">
                        Save
                      </button>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3 pt-6 border-t border-gray-300">
                  <button className="w-full py-3 bg-black text-white font-semibold hover:bg-gray-800 transition-colors">
                    Create Your List
                  </button>
                  <button className="w-full py-2 text-gray-600 hover:text-black font-medium">
                    View All Lists →
                  </button>
                </div>
                </div>
              </div>
            </div>

            {/* Right Panel (35%): Events Feed */}
            <div className={`overflow-y-auto transition-all duration-300 ${isEventFeedFullscreen ? 'w-full' : ''}`} style={{ maxHeight: '115vh' }}>
              {/* Unified Sticky Header - Events Feed + Calendar + Filters */}
              <div className="sticky top-0 bg-white z-30 border-b border-gray-300">
                {/* Navigation Bar */}
                <div className="px-6 lg:px-8 py-3 lg:py-4 flex justify-between items-center">
                  <div className="flex gap-3 items-center">
                    <button
                      onClick={() => setIsEventFeedFullscreen(!isEventFeedFullscreen)}
                      className="px-2 py-1 border border-gray-300 text-black hover:border-black transition-colors text-xs"
                      title={isEventFeedFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                    >
                      {isEventFeedFullscreen ? '⊗' : '⛶'}
                    </button>
                    <h2 className="text-xl lg:text-2xl xl:text-3xl font-bold text-black">
                      📅 Events Feed
                    </h2>
                  </div>
                  <div className="flex gap-2">
                    {user && (
                      <>
                        <button
                          onClick={() => router.push('/my-posts')}
                          className="px-3 lg:px-4 py-1.5 lg:py-2 border border-gray-300 text-black hover:border-black transition-colors font-medium text-sm lg:text-base"
                        >
                          My Posts
                        </button>
                        <button
                          onClick={() => setShowPostEventModal(true)}
                          className="px-3 lg:px-4 py-1.5 lg:py-2 bg-black text-white hover:bg-gray-800 transition-colors font-medium text-sm lg:text-base"
                        >
                          + Post
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Date Selector - Scrollable */}
                <div className="px-8 py-4 overflow-x-auto scrollbar-hide">
                  <div className="flex gap-2 min-w-max">
                    {weekDays.map((day, index) => (
                      <button
                        key={index}
                        onClick={() => handleDateSelect(day.fullDate)}
                        className={`py-1 px-2 transition-colors whitespace-nowrap min-w-[50px] ${
                          selectedDate && selectedDate.toDateString() === day.fullDate.toDateString()
                            ? 'bg-black text-white border-2 border-black'
                            : day.isToday
                            ? 'border-2 border-blue-500 text-gray-700 hover:border-blue-700'
                            : 'border border-gray-300 text-gray-700 hover:border-black'
                        }`}
                        suppressHydrationWarning
                      >
                        <div className="text-xs font-medium mb-1">{day.dayName}</div>
                        <div className="text-lg font-bold">{day.date}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Options */}
                <div>
                {/* Main Category Filters */}
                <div className="px-8 py-4">
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    <button
                      onClick={() => {
                        setSelectedCategory(null);
                        setSelectedSubCategory(null);
                        setNearMeFilter(false);
                      }}
                      className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                        !selectedCategory && !nearMeFilter
                          ? 'bg-black text-white'
                          : 'border border-gray-300 text-gray-700 hover:border-black'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={handleNearMeToggle}
                      className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                        nearMeFilter
                          ? 'bg-black text-white'
                          : 'border border-gray-300 text-gray-700 hover:border-black'
                      }`}
                    >
                      📍 Near Me
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCategory('sports');
                        setSelectedSubCategory(null);
                        setNearMeFilter(false);
                      }}
                      className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                        selectedCategory === 'sports'
                          ? 'bg-black text-white'
                          : 'border border-gray-300 text-gray-700 hover:border-black'
                      }`}
                    >
                      🏀 Sports
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCategory('entertainment');
                        setSelectedSubCategory(null);
                        setNearMeFilter(false);
                      }}
                      className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                        selectedCategory === 'entertainment'
                          ? 'bg-black text-white'
                          : 'border border-gray-300 text-gray-700 hover:border-black'
                      }`}
                    >
                      🎬 Entertainment
                    </button>
                  </div>
                </div>

                {/* Subcategory Filters - Only shown when a category is selected */}
                {selectedCategory && subCategories[selectedCategory] && (
                  <div className="px-8 py-3 border-t border-gray-200 bg-gray-50">
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                      <button
                        onClick={() => setSelectedSubCategory(null)}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                          !selectedSubCategory
                            ? 'bg-black text-white'
                            : 'border border-gray-300 bg-white text-gray-700 hover:border-black'
                        }`}
                      >
                        All {selectedCategory}
                      </button>
                      {subCategories[selectedCategory].map((subCat) => (
                        <button
                          key={subCat}
                          onClick={() => setSelectedSubCategory(subCat)}
                          className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                            selectedSubCategory === subCat
                              ? 'bg-black text-white'
                              : 'border border-gray-300 bg-white text-gray-700 hover:border-black'
                          }`}
                        >
                          {subCat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              </div>

              {/* Event Cards */}
              <div className={`p-8 transition-all duration-300 ${isEventFeedFullscreen ? 'grid grid-cols-3 gap-6' : 'space-y-6'}`} style={{ minHeight: 'calc(100vh - 400px)' }}>
                {/* Loading State */}
                {eventsLoading && events.length === 0 && (
                  <>
                    {[...Array(3)].map((_, i) => (
                      <EventCardSkeleton key={i} />
                    ))}
                  </>
                )}

                {/* Error State */}
                {eventsError && !eventsLoading && (
                  <div className={`py-8 lg:py-12 text-center px-4 ${isEventFeedFullscreen ? 'col-span-full' : ''}`}>
                    <p className="text-red-600 mb-3 lg:mb-4 text-base lg:text-lg">{eventsError}</p>
                    <button
                      onClick={() => fetchEvents(1, false)}
                      className="px-5 lg:px-6 py-2 lg:py-2.5 text-base lg:text-lg border border-black text-black hover:bg-gray-50 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Empty State */}
                {!eventsLoading && !eventsError && events.length === 0 && (
                  <div className={`py-8 lg:py-12 text-center px-4 ${isEventFeedFullscreen ? 'col-span-full' : ''}`}>
                    <div className="text-5xl lg:text-6xl mb-3 lg:mb-4">📅</div>
                    <h3 className="text-xl lg:text-2xl xl:text-3xl font-bold text-black mb-2">No events found</h3>
                    <p className="text-base lg:text-lg text-gray-600 mb-4 lg:mb-6">
                      {selectedDate
                        ? 'No events on this day. Try a different date or'
                        : nearMeFilter
                        ? 'No events near you yet.'
                        : 'No events yet. Be the first to post!'}
                    </p>
                    <button
                      onClick={() => setShowPostEventModal(true)}
                      className="px-5 lg:px-6 py-2.5 lg:py-3 text-base lg:text-lg bg-black text-white hover:bg-gray-800 transition-colors font-medium"
                    >
                      Post Event
                    </button>
                  </div>
                )}

                {/* Event Cards */}
                {!eventsLoading && !eventsError && events.map((event) => {
                  // Check if current user is the host by comparing user ID with event host_id
                  const isHost = user && event.host_id === user.id;
                  const isParticipant = user && joinedEventIds.includes(event.id) && !isHost;
                  const userRole = isHost ? 'host' : isParticipant ? 'participant' : 'guest';

                  return (
                    <EventCard
                      key={event.id}
                      event={event}
                      userRole={userRole}
                      onView={handleViewEvent}
                      onJoin={handleJoinEvent}
                      onLeave={handleLeaveEvent}
                    />
                  );
                })}
              </div>

              {/* Load More */}
              {!eventsLoading && !eventsError && events.length > 0 && (
                <div className="mt-6 lg:mt-8 pt-5 lg:pt-6 text-center border-t border-gray-300">
                  {hasMoreEvents ? (
                    <button
                      onClick={handleLoadMore}
                      disabled={eventsLoading}
                      className="px-5 lg:px-6 py-2 text-base lg:text-lg text-gray-600 hover:text-black font-medium disabled:opacity-50"
                    >
                      {eventsLoading ? 'Loading...' : 'Load More'}
                    </button>
                  ) : (
                    <p className="text-gray-500 text-sm lg:text-base">No more events to load</p>
                  )}
                </div>
              )}
              </div>
            </div>
          </div>
        </div>

      {/* Footer */}
      <footer className="hidden lg:block border-t border-black mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <div className="flex justify-center gap-6">
            <Link href="/about" className="hover:text-black">About</Link>
            <Link href="/help" className="hover:text-black">Help</Link>
            <Link href="/privacy" className="hover:text-black">Privacy</Link>
            <Link href="/terms" className="hover:text-black">Terms</Link>
            <Link href="/contact" className="hover:text-black">Contact</Link>
          </div>
        </div>
      </footer>

      {/* Post Event Modal */}
      <PostEventModal
        isOpen={showPostEventModal}
        onClose={() => setShowPostEventModal(false)}
        onSubmit={handlePostEvent}
      />
    </main>
  );
}
