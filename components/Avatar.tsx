'use client';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

// Generate consistent color from name
function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-yellow-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-teal-500',
  ];

  // Use first character's charCode for consistent color
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

// Get initials from name
function getInitials(name: string): string {
  if (!name || name.trim() === '') return '?';

  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function Avatar({ name, src, size = 'md', className = '' }: AvatarProps) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  const colorClass = getAvatarColor(name);
  const initials = getInitials(name);

  // If image source is provided, use image
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        title={name}
        className={`${sizeClasses[size]} ${className} rounded-full object-cover`}
      />
    );
  }

  // Otherwise use initials with colored background
  return (
    <div
      className={`${sizeClasses[size]} ${colorClass} ${className} rounded-full flex items-center justify-center text-white font-semibold`}
      title={name}
    >
      {initials}
    </div>
  );
}
