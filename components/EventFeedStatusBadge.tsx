import { EventStatus } from '@/types';

interface EventFeedStatusBadgeProps {
  status: EventStatus | 'host' | 'joined';
  className?: string;
}

export default function EventFeedStatusBadge({ status, className = '' }: EventFeedStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'full':
        return {
          label: 'FULL',
          className: 'bg-gray-200 text-gray-700 border-gray-400'
        };
      case 'closed':
        return {
          label: 'CLOSED',
          className: 'bg-gray-200 text-gray-600 border-gray-400'
        };
      case 'past':
        return {
          label: 'PAST',
          className: 'bg-gray-100 text-gray-500 border-gray-300'
        };
      case 'host':
        return {
          label: 'HOST',
          className: 'bg-black text-white border-black'
        };
      case 'joined':
        return {
          label: '✓',
          className: 'bg-white text-black border-black'
        };
      case 'active':
      default:
        return null;
    }
  };

  const config = getStatusConfig();

  if (!config) return null;

  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-bold border ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
}
