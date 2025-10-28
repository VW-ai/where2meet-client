'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api, VenueListDetail, ListItem } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Heart, MapPin, Star, Trash2, Edit, Target, Share2 } from 'lucide-react';
import ListVenueCard from '@/components/ListVenueCard';

export default function ListDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, token } = useAuth();
  const [list, setList] = useState<VenueListDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likeLoading, setLikeLoading] = useState(false);

  const listId = params.id as string;

  useEffect(() => {
    if (listId) {
      fetchListDetail();
    }
  }, [listId, token]);

  const fetchListDetail = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.getListDetail(listId, token || undefined);
      setList(data);
    } catch (err) {
      console.error('Failed to fetch list detail:', err);
      setError(err instanceof Error ? err.message : 'Failed to load list');
      setList(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!token) {
      router.push('/login');
      return;
    }

    if (!list) return;

    setLikeLoading(true);
    try {
      if (list.is_liked) {
        await api.unlikeList(listId, token);
      } else {
        await api.likeList(listId, token);
      }
      // Refresh list to update like count and status
      await fetchListDetail();
    } catch (err) {
      console.error('Failed to toggle like:', err);
      // Show error to user (you could add a toast notification here)
    } finally {
      setLikeLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !list) return;

    const confirmed = confirm('Are you sure you want to delete this list?');
    if (!confirmed) return;

    try {
      await api.deleteList(listId, token);
      router.push('/');
    } catch (err) {
      // Silently handle delete errors (API not implemented yet)
      console.log('⚠️ Delete action simulated (API endpoint not implemented yet)');
      alert('This is a demo list and cannot be deleted. Backend API not yet implemented.');
    }
  };

  const handleUseForMeeting = () => {
    if (!list) return;

    // Store list items in localStorage for meeting point pre-population
    localStorage.setItem('meetingCandidates', JSON.stringify(list.items));
    router.push('/?tab=meeting&from=list');
  };

  const handleUseVenueForMeeting = (item: ListItem) => {
    // Store single venue in localStorage for meeting point pre-population
    localStorage.setItem('meetingCandidates', JSON.stringify([item]));
    router.push('/?tab=meeting&from=list');
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: list?.title,
          text: list?.description,
          url: url,
        });
      } catch (err) {
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-50 border-2 border-red-600 text-red-700 px-6 py-4 rounded mb-6">
            {error || 'List not found'}
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-black text-white font-bold uppercase hover:bg-gray-900 transition-colors border-2 border-black"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user && user.id === list.user_id;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b-2 border-black sticky top-0 bg-white z-10">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-black hover:text-gray-700 font-bold uppercase text-sm"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="p-2 border-2 border-black hover:bg-gray-100 transition-colors"
                title="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>

              <button
                onClick={handleLike}
                disabled={likeLoading}
                className={`p-2 border-2 border-black transition-colors ${
                  list.is_liked
                    ? 'bg-red-50 text-red-500 hover:bg-red-100'
                    : 'hover:bg-gray-100'
                }`}
                title={list.is_liked ? 'Unlike' : 'Like'}
              >
                <Heart className={`w-5 h-5 ${list.is_liked ? 'fill-red-500' : ''}`} />
              </button>

              {isOwner && (
                <>
                  <button
                    onClick={() => router.push(`/lists/${listId}/edit`)}
                    className="p-2 border-2 border-black hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 border-2 border-black hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* List Info */}
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-black mb-2">{list.title}</h1>
            {list.description && (
              <p className="text-gray-700 mb-3">{list.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>by <strong>{list.user_name}</strong></span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {list.item_count} {list.item_count === 1 ? 'venue' : 'venues'}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {list.like_count} {list.like_count === 1 ? 'like' : 'likes'}
              </span>
              <span className="px-2 py-1 bg-gray-100 border border-black text-xs font-bold uppercase">
                {list.category}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
        {/* Meeting Point Integration */}
        <div className="bg-blue-50 border-2 border-blue-600 p-6 rounded-lg mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-bold text-black">
              Find Meeting Point
            </h3>
          </div>
          <p className="text-sm text-gray-700 mb-4">
            Use these {list.item_count} venues to find the perfect meeting spot
            for your group.
          </p>
          <button
            onClick={handleUseForMeeting}
            className="w-full py-3 bg-blue-600 text-white font-bold uppercase hover:bg-blue-700 transition-all border-2 border-blue-600"
          >
            Find Meeting Point with This List
          </button>
        </div>

        {/* Venues List */}
        <div>
          <h2 className="text-xl font-bold text-black mb-4 uppercase">Venues</h2>
          {list.items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No venues in this list yet
            </div>
          ) : (
            <div className="space-y-4">
              {list.items.map((item, index) => (
                <ListVenueCard
                  key={item.id}
                  item={item}
                  index={index}
                  onUseForMeeting={handleUseVenueForMeeting}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
