import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = 'Where2Meet - Find the Perfect Meeting Place for Groups';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Open Graph Image generation
export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #EFF6FF 0%, #FEFCE8 50%, #F0FDF4 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Background decorative elements */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            opacity: 0.1,
          }}
        >
          <div
            style={{
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              position: 'absolute',
              top: '-100px',
              left: '-100px',
            }}
          />
          <div
            style={{
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
              position: 'absolute',
              bottom: '-80px',
              right: '-80px',
            }}
          />
        </div>

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
          }}
        >
          <svg
            width="120"
            height="120"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
            </defs>
            <path
              d="M50 10C35.088 10 23 22.088 23 37C23 52.5 50 90 50 90C50 90 77 52.5 77 37C77 22.088 64.912 10 50 10Z"
              fill="url(#gradient)"
              stroke="white"
              strokeWidth="4"
            />
            <circle cx="50" cy="37" r="12" fill="white" opacity="0.9" />
            <circle cx="44" cy="35" r="3.5" fill="#3B82F6" />
            <circle cx="50" cy="39" r="3.5" fill="#8B5CF6" />
            <circle cx="56" cy="35" r="3.5" fill="#EC4899" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: '80px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            marginBottom: '20px',
          }}
        >
          Where2Meet
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: 'flex',
            fontSize: '36px',
            color: '#4B5563',
            textAlign: 'center',
            maxWidth: '900px',
            lineHeight: 1.4,
          }}
        >
          Find the Perfect Meeting Place for Your Group
        </div>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            marginTop: '50px',
            gap: '60px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '40px' }}>📍</span>
            <span style={{ fontSize: '24px', color: '#6B7280' }}>Add Locations</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '40px' }}>🎯</span>
            <span style={{ fontSize: '24px', color: '#6B7280' }}>Find Venues</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '40px' }}>🗳️</span>
            <span style={{ fontSize: '24px', color: '#6B7280' }}>Vote Together</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
