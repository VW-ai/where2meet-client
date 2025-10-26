'use client';

import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  theme?: 'light' | 'dark';
}

export default function Logo({ size = 'md', showText = true, className = '', theme = 'light' }: LogoProps) {
  const sizes = {
    sm: { height: 32, text: 'text-sm' },
    md: { height: 40, text: 'text-base' },
    lg: { height: 48, text: 'text-lg' },
  };

  const { height, text } = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Image */}
      <Image
        src="/images/logo.png"
        alt="Where2Meet Logo"
        width={height}
        height={height}
        className="flex-shrink-0"
        priority
      />

      {/* Logo Text */}
      {showText && (
        <span className={`font-bold uppercase ${
          theme === 'dark'
            ? 'text-white'
            : 'text-black'
        } ${text}`}>
          Where2Meet
        </span>
      )}
    </div>
  );
}
