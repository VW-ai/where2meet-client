'use client';

type EventStatus = 'planning' | 'voting' | 'finalized';

interface EventStatusBadgeProps {
  hasLocations: boolean;
  hasCandidates: boolean;
  isFinal: boolean;
}

export default function EventStatusBadge({ hasLocations, hasCandidates, isFinal }: EventStatusBadgeProps) {
  const getStatus = (): EventStatus => {
    if (isFinal) return 'finalized';
    if (hasCandidates) return 'voting';
    return 'planning';
  };

  const status = getStatus();

  const statusConfig = {
    planning: {
      label: 'Planning',
      color: 'bg-gray-500',
      icon: '📋',
    },
    voting: {
      label: 'Voting',
      color: 'bg-[#08c605]',
      icon: '🗳️',
    },
    finalized: {
      label: 'Finalized',
      color: 'bg-black',
      icon: '✅',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${config.color} text-white text-xs font-medium`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
}
