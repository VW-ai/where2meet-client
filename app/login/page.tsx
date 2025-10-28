'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/'); // Redirect to home page after login
    } catch (err) {
      console.error('Login failed:', err);
      setError(err instanceof Error ? err.message : 'Invalid email or password');
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
          <h2 className="text-2xl font-bold text-black uppercase">Welcome Back</h2>
        </div>

        {/* Login Form */}
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-black mb-2 uppercase">
                Email
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
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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
              {isLoading ? 'LOGGING IN...' : 'LOG IN'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t-2 border-black text-center">
            <p className="text-black text-sm">
              Don't have an account?{' '}
              <Link href="/signup" className="font-bold underline hover:no-underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Continue as Guest */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-block px-6 py-3 text-black font-bold uppercase text-sm border-2 border-black bg-white hover:bg-gray-100 transition-all"
          >
            Continue as guest
          </Link>
        </div>
      </div>
    </main>
  );
}
