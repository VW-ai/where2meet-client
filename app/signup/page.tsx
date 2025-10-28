'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await signup(email, password, name || undefined);
      router.push('/'); // Redirect to home page after signup
    } catch (err) {
      console.error('Signup failed:', err);
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4 hover:opacity-80 transition-opacity">
            <Logo theme="light" size="lg" />
          </Link>
          <h2 className="text-2xl font-bold text-black uppercase">Create Your Account</h2>
        </div>

        {/* Signup Form */}
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-black mb-2 uppercase">
                Name <span className="text-gray-500 font-normal text-xs">(Optional)</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 text-black bg-white border-2 border-black focus:border-black outline-none placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-black mb-2 uppercase">
                Email *
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 text-black bg-white border-2 border-black focus:border-black outline-none placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-black mb-2 uppercase">
                Password *
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
                className="w-full px-4 py-3 text-black bg-white border-2 border-black focus:border-black outline-none placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-black mb-2 uppercase">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
                className="w-full px-4 py-3 text-black bg-white border-2 border-black focus:border-black outline-none placeholder:text-gray-400"
              />
            </div>

            {error && (
              <div className="p-3 bg-white border-2 border-red-600 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-black text-white font-bold uppercase border-2 border-black hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t-2 border-black text-center">
            <p className="text-black text-sm">
              Already have an account?{' '}
              <Link href="/login" className="font-bold underline hover:no-underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
