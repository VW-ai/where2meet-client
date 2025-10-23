'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import EventCard from '@/components/EventCard';
import EventCardSkeleton from '@/components/EventCardSkeleton';
import { Event as EventFeedType } from '@/types';

export default function MyPostsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState<EventFeedType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's posts
  useEffect(() => {
    const fetchMyPosts = async () => {
      setLoading(true);
      setError(null);

      try {
        // For now, return empty array since backend requires auth token
        // TODO: Implement proper authentication and pass token
        console.log('ℹ️ My Posts requires authentication - showing empty state');
        setPosts([]);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch posts:', err);
        setError('Failed to load your posts. Please try again.');
        setPosts([]);
        setLoading(false);
      }
    };

    if (user) {
      fetchMyPosts();
    } else {
      // Show empty state if not authenticated
      setPosts([]);
      setLoading(false);
    }
  }, [user, router]);

  const handleViewEvent = (eventId: string) => {
    router.push(`/event-detail?id=${eventId}`);
  };

  const handleDeletePost = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/feed/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      setPosts(prev => prev.filter(post => post.id !== eventId));
    } catch (err) {
      console.error('Failed to delete post:', err);
      alert('Failed to delete post. Please try again.');
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">My Posts</h1>
          <p className="text-gray-600">Events you've created in the Event Feed</p>
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
              onClick={() => router.push('/')}
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
              <div key={post.id} className="relative">
                <EventCard
                  event={post}
                  userRole="host"
                  onView={handleViewEvent}
                />
                {/* Delete Button Overlay */}
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="absolute top-4 right-4 z-20 p-2 bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium"
                  title="Delete post"
                >
                  Delete
                </button>
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
