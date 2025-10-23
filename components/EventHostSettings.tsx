'use client';

import { EventStatus, EventVisibility } from '@/types';

interface EventHostSettingsProps {
  visibility: EventVisibility;
  status: EventStatus;
  participantLimit?: number;
  allowVote: boolean;
  onEdit: () => void;
  onClose: () => void;
  onDelete: () => void;
}

export default function EventHostSettings({
  visibility,
  status,
  participantLimit,
  allowVote,
  onEdit,
  onClose,
  onDelete,
}: EventHostSettingsProps) {
  const getVisibilityDisplay = () => {
    switch (visibility) {
      case 'public':
        return '🌐 Public';
      case 'link_only':
        return '🔗 Link Only';
      case 'private':
        return '🔒 Private';
      default:
        return visibility;
    }
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'active':
        return '✅ Active';
      case 'closed':
        return '🔒 Closed';
      case 'full':
        return '👥 Full';
      case 'cancelled':
        return '❌ Cancelled';
      case 'completed':
        return '✓ Completed';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white border-t border-gray-300 px-8 py-6">
      <h2 className="text-xl font-bold text-black mb-4">
        Event Settings <span className="text-sm font-normal text-gray-500">(Host Only)</span>
      </h2>

      {/* Settings Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 border border-gray-200">
        <div>
          <div className="text-sm font-medium text-gray-600 mb-1">Visibility</div>
          <div className="text-base font-semibold text-black">{getVisibilityDisplay()}</div>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-600 mb-1">Status</div>
          <div className="text-base font-semibold text-black">{getStatusDisplay()}</div>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-600 mb-1">Participant Limit</div>
          <div className="text-base font-semibold text-black">
            {participantLimit || 'Unlimited'}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-600 mb-1">Voting</div>
          <div className="text-base font-semibold text-black">
            {allowVote ? '✅ Enabled' : '❌ Disabled'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onEdit}
          className="flex-1 px-4 py-2.5 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
        >
          Edit Event
        </button>
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2.5 border border-gray-300 text-black font-medium hover:border-black transition-colors"
        >
          Close Event
        </button>
        <button
          onClick={onDelete}
          className="flex-1 px-4 py-2.5 border border-red-500 text-red-600 font-medium hover:bg-red-50 transition-colors"
        >
          Delete Event
        </button>
      </div>
    </div>
  );
}
