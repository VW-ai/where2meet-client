'use client';

import { EventStatus, EventVisibility } from '@/types';

interface EventHostSettingsProps {
  visibility: EventVisibility;
  status: EventStatus;
  participantLimit?: number;
  allowVote: boolean;
  onEdit: () => void;
  onExportParticipants: () => void;
  onClose: () => void;
  onDelete: () => void;
}

export default function EventHostSettings({
  visibility,
  status,
  participantLimit,
  allowVote,
  onEdit,
  onExportParticipants,
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
    <div className="bg-white border-2 border-yellow-400 rounded-lg shadow-lg p-6 max-w-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-black flex items-center gap-2">
          👑 Event Settings
        </h3>
        <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded">
          HOST ONLY
        </span>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5 bg-yellow-50 p-3 rounded border border-yellow-200">
        <div>
          <div className="text-xs font-medium text-gray-600 mb-0.5">Visibility</div>
          <div className="text-sm font-semibold text-black">{getVisibilityDisplay()}</div>
        </div>

        <div>
          <div className="text-xs font-medium text-gray-600 mb-0.5">Status</div>
          <div className="text-sm font-semibold text-black">{getStatusDisplay()}</div>
        </div>

        <div>
          <div className="text-xs font-medium text-gray-600 mb-0.5">Limit</div>
          <div className="text-sm font-semibold text-black">
            {participantLimit || 'Unlimited'}
          </div>
        </div>

        <div>
          <div className="text-xs font-medium text-gray-600 mb-0.5">Voting</div>
          <div className="text-sm font-semibold text-black">
            {allowVote ? '✅ On' : '❌ Off'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {/* Primary Actions */}
        <button
          onClick={onEdit}
          className="w-full px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors rounded"
        >
          ✏️ Edit Event
        </button>

        <button
          onClick={onExportParticipants}
          className="w-full px-4 py-2 border border-gray-300 text-black text-sm font-medium hover:border-black transition-colors rounded"
        >
          📥 Export Participants
        </button>

        {/* Danger Actions */}
        <button
          onClick={onClose}
          className="w-full px-4 py-2 border border-gray-300 text-black text-sm font-medium hover:border-black transition-colors rounded"
        >
          🔒 Close Event
        </button>

        <button
          onClick={onDelete}
          className="w-full px-4 py-2 border border-red-500 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors rounded"
        >
          🗑️ Delete Event
        </button>
      </div>
    </div>
  );
}
