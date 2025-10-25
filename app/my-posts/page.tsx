'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import EventCard from '@/components/EventCard';
import EventCardSkeleton from '@/components/EventCardSkeleton';
import PostEventModal from '@/components/PostEventModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Event as EventFeedType, CreateEventFeedRequest } from '@/types';
import { api } from '@/lib/api';

export default function MyPostsPage() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [posts, setPosts] = useState<EventFeedType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPostEventModal, setShowPostEventModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch user's posts
  useEffect(() => {
    const fetchMyPosts = async () => {
      setLoading(true);
      setError(null);

      if (!token) {
        setError('Please log in to view your posts.');
        setPosts([]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/feed/my-posts`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Please log in to view your posts.');
          }
          throw new Error('Failed to fetch posts');
        }

        const data = await response.json();
        setPosts(data.events || []);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch posts:', err);
        setError(err instanceof Error ? err.message : 'Failed to load your posts. Please try again.');
        setPosts([]);
        setLoading(false);
      }
    };

    if (user && token) {
      fetchMyPosts();
    } else {
      // Show empty state if not authenticated
      setPosts([]);
      setLoading(false);
    }
  }, [user, token, router]);

  const handleViewEvent = (eventId: string) => {
    router.push(`/event-detail?id=${eventId}`);
  };

  const handleCreateEvent = async (data: any) => {
    if (!token) {
      alert('Please log in to create an event.');
      return;
    }

    try {
      const eventData: CreateEventFeedRequest = {
        title: data.title,
        description: data.description,
        meeting_time: data.meeting_time,
        location_area: data.location_area,
        location_coords: data.location_coords,
        location_type: data.location_type || 'collaborative',
        fixed_venue_name: data.fixed_venue_name,
        fixed_venue_address: data.fixed_venue_address,
        fixed_venue_lat: data.fixed_venue_lat,
        fixed_venue_lng: data.fixed_venue_lng,
        category: data.category,
        participant_limit: data.participant_limit,
        visibility: data.visibility,
        allow_vote: data.allow_vote !== undefined ? data.allow_vote : true,
        contact_number: data.contact_number,
        background_image: data.background_image,
      };

      // Convert location_coords object to flat fields for backend
      const backendData: any = {
        ...eventData,
        location_coords_lat: eventData.location_coords?.lat,
        location_coords_lng: eventData.location_coords?.lng,
      };
      delete backendData.location_coords;

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

      const result = await response.json();

      // Close modal and refresh posts
      setShowPostEventModal(false);

      // Refresh the posts list
      const postsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/feed/my-posts`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        setPosts(postsData.events || []);
      }

      alert('Event created successfully!');
    } catch (err) {
      console.error('Failed to create event:', err);
      throw err; // Let modal handle the error
    }
  };

  const handleDeletePost = (eventId: string) => {
    console.log('handleDeletePost called with eventId:', eventId);
    setPostToDelete(eventId);
    setShowDeleteConfirm(true);
  };

  const confirmDeletePost = async () => {
    if (!postToDelete || !token) {
      alert('Please log in to delete posts.');
      return;
    }

    console.log('Sending DELETE request for event:', postToDelete);
    setIsDeleting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/feed/events/${postToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Delete response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to delete post' }));
        throw new Error(errorData.detail || 'Failed to delete post');
      }

      // Remove from local state
      setPosts(prev => prev.filter(post => post.id !== postToDelete));
      console.log('Post deleted successfully');

      // Close dialog
      setShowDeleteConfirm(false);
      setPostToDelete(null);
    } catch (err) {
      console.error('Failed to delete post:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <Header user={user} onLogout={logout} />

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">My Posts</h1>
            <p className="text-gray-600">Events you've created in the Event Feed</p>
          </div>
          {user && (
            <button
              onClick={() => setShowPostEventModal(true)}
              className="px-4 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              Create Post
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            {[...Array(2)].map((_, i) => (
              <EventCardSkeleton key={i} />
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
        {!loading && !error && posts.length === 0 && (
          <div className="py-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-bold text-black mb-2">No posts yet</h3>
            <p className="text-gray-600 mb-6">
              {user
                ? "You haven't created any events in the Event Feed yet."
                : "Please log in to see your posts."}
            </p>
            <button
              onClick={() => user ? setShowPostEventModal(true) : router.push('/')}
              className="px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors font-medium"
            >
              {user ? 'Create Your First Post' : 'Go to Home'}
            </button>
          </div>
        )}

        {/* Posts List */}
        {!loading && !error && posts.length > 0 && (
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="relative" style={{ isolation: 'isolate' }}>
                <EventCard
                  event={post}
                  userRole="host"
                  onView={handleViewEvent}
                  showManageButton={true}
                />
                {/* Delete Button Overlay */}
                <div className="absolute top-4 right-4 z-[9999]" style={{ zIndex: 9999 }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Delete button clicked for post:', post.id);
                      handleDeletePost(post.id);
                    }}
                    className="p-3 bg-red-600 text-white hover:bg-red-700 active:bg-red-800 transition-colors text-sm sm:text-base font-bold rounded-lg shadow-2xl cursor-pointer border-2 border-white"
                    title="Delete post"
                  >
                    🗑️ Delete
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

      {/* Post Event Modal */}
      <PostEventModal
        isOpen={showPostEventModal}
        onClose={() => setShowPostEventModal(false)}
        onSubmit={handleCreateEvent}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setPostToDelete(null);
        }}
        onConfirm={confirmDeletePost}
        title="Delete Post?"
        message="This will permanently delete this event and all its data. This action cannot be undone."
        confirmText="Delete Post"
        cancelText="Keep Post"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </main>
  );
}
