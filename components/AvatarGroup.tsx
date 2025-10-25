'use client';

import Avatar from './Avatar';

interface AvatarGroupProps {
  names: string[];
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export default function AvatarGroup({ names, max = 3, size = 'sm', className = '' }: AvatarGroupProps) {
  const displayNames = names.slice(0, max);
  const remaining = names.length - max;

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  return (
    <div className={`flex -space-x-2 ${className}`}>
      {displayNames.map((name, index) => (
        <Avatar key={`${name}-${index}`} name={name} size={size} className="ring-2 ring-white" />
      ))}
      {remaining > 0 && (
        <div
          className={`${sizeClasses[size]} bg-gray-400 rounded-full flex items-center justify-center text-white font-semibold ring-2 ring-white`}
          title={`+${remaining} more`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
