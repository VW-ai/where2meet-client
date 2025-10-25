'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { api } from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, logout, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    setName(user.name || '');
    setBio(user.bio || '');
    setAvatar(user.avatar || '');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: any = {};

      // Only send fields that should be updated
      if (name !== (user.name || '')) {
        updateData.name = name || undefined;
      }
      if (bio !== (user.bio || '')) {
        updateData.bio = bio;  // Allow empty string to clear bio
      }
      if (avatar !== (user.avatar || '')) {
        updateData.avatar = avatar || undefined;
      }

      console.log('Updating user with data:', updateData);

      await api.updateCurrentUser(token, updateData);
      await refreshUser();

      setSuccess('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-white">
      <Header user={user} onLogout={logout} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black mb-2">Profile</h1>
          <p className="text-base sm:text-lg text-gray-600">Manage your account settings</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center mb-4 sm:mb-6">
            <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full bg-gray-200 mb-4 overflow-hidden flex items-center justify-center">
              {avatar ? (
                <img src={avatar} alt={name || 'User'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-3xl sm:text-4xl md:text-5xl font-bold">
                    {(name || user.email)?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label htmlFor="email" className="block text-base sm:text-lg font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={user.email}
              disabled
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base sm:text-lg border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-sm sm:text-base text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-base sm:text-lg font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base sm:text-lg text-black border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-base sm:text-lg font-medium text-gray-700 mb-2">
              Bio / Description
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people about yourself... (This will be shown when you host events)"
              maxLength={500}
              rows={4}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base sm:text-lg text-black border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black resize-none"
            />
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              {bio.length}/500 characters · This will be displayed when you host events
            </p>
          </div>

          {/* Avatar URL */}
          <div>
            <label htmlFor="avatar" className="block text-base sm:text-lg font-medium text-gray-700 mb-2">
              Avatar URL
            </label>
            <input
              type="url"
              id="avatar"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base sm:text-lg text-black border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black"
            />
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              Paste a URL to an image (e.g., from Imgur, Gravatar, or any public image URL)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-base sm:text-lg">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 text-base sm:text-lg">{success}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:flex-1 px-5 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg border border-gray-300 text-black font-medium rounded-lg hover:border-black transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Account Info */}
        <div className="mt-8 sm:mt-12 pt-5 sm:pt-6 border-t border-gray-300">
          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-3 sm:mb-4">Account Information</h2>
          <div className="space-y-2 sm:space-y-3 text-base sm:text-lg">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="text-gray-600">User ID:</span>
              <span className="text-black font-mono break-all">{user.id}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="text-gray-600">Member since:</span>
              <span className="text-black">
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
