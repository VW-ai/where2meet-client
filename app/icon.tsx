import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Icon generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        {/* Map pin shape */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Map pin */}
          <path
            d="M50 10C35.088 10 23 22.088 23 37C23 52.5 50 90 50 90C50 90 77 52.5 77 37C77 22.088 64.912 10 50 10Z"
            fill="url(#gradient)"
            stroke="white"
            strokeWidth="3"
          />

          {/* Inner circle */}
          <circle cx="50" cy="37" r="12" fill="white" opacity="0.9" />

          {/* Three people dots */}
          <circle cx="44" cy="35" r="3" fill="#3B82F6" />
          <circle cx="50" cy="39" r="3" fill="#8B5CF6" />
          <circle cx="56" cy="35" r="3" fill="#EC4899" />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
