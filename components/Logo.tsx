'use client';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: 'text-base' },
    md: { icon: 32, text: 'text-xl' },
    lg: { icon: 40, text: 'text-2xl' },
  };

  const { icon, text } = sizes[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Logo Icon - Pin with people meeting */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Map pin shape */}
        <path
          d="M50 10C35.088 10 23 22.088 23 37C23 52.5 50 90 50 90C50 90 77 52.5 77 37C77 22.088 64.912 10 50 10Z"
          fill="url(#gradient)"
          stroke="white"
          strokeWidth="3"
        />

        {/* Inner circle - meeting point */}
        <circle cx="50" cy="37" r="12" fill="white" opacity="0.9" />

        {/* Three people dots in the center */}
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

      {/* Logo Text */}
      {showText && (
        <span className={`font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent ${text}`}>
          Where2Meet
        </span>
      )}
    </div>
  );
}
