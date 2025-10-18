import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

// Apple Icon generation
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)',
          borderRadius: '36px',
        }}
      >
        {/* Map pin shape */}
        <svg
          width="120"
          height="120"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Map pin - white version for contrast */}
          <path
            d="M50 10C35.088 10 23 22.088 23 37C23 52.5 50 90 50 90C50 90 77 52.5 77 37C77 22.088 64.912 10 50 10Z"
            fill="white"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
          />

          {/* Inner circle */}
          <circle cx="50" cy="37" r="12" fill="rgba(59,130,246,0.3)" />

          {/* Three people dots */}
          <circle cx="44" cy="35" r="3" fill="#3B82F6" />
          <circle cx="50" cy="39" r="3" fill="#8B5CF6" />
          <circle cx="56" cy="35" r="3" fill="#EC4899" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
