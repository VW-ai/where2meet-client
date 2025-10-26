'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-black mb-4">500</h1>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Something went wrong!
            </h2>
            <p className="text-gray-600 mb-8">
              {error.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => reset()}
              className="inline-block px-6 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
