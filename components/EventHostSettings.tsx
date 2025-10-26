'use client';

import { EventStatus, EventVisibility } from '@/types';
import { Globe, Link, Lock, CheckCircle, Users, X, Check, Edit, Download, Trash2, Crown } from 'lucide-react';

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
        return (
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            Public
          </span>
        );
      case 'link_only':
        return (
          <span className="flex items-center gap-1.5">
            <Link className="w-3.5 h-3.5" />
            Link Only
          </span>
        );
      case 'private':
        return (
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            Private
          </span>
        );
      default:
        return visibility;
    }
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            Active
          </span>
        );
      case 'closed':
        return (
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            Closed
          </span>
        );
      case 'full':
        return (
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Full
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1.5">
            <X className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      default:
        return status;
    }
  };

  return (
    <div className="bg-white border-2 border-yellow-400 rounded-lg shadow-lg p-6 max-w-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-black flex items-center gap-2">
          <Crown className="w-5 h-5" />
          Event Settings
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
          <div className="text-sm font-semibold text-black flex items-center gap-1.5">
            {allowVote ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                On
              </>
            ) : (
              <>
                <X className="w-3.5 h-3.5" />
                Off
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {/* Primary Actions */}
        <button
          onClick={onEdit}
          className="w-full px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors rounded flex items-center justify-center gap-2"
        >
          <Edit className="w-4 h-4" />
          Edit Event
        </button>

        <button
          onClick={onExportParticipants}
          className="w-full px-4 py-2 border border-gray-300 text-black text-sm font-medium hover:border-black transition-colors rounded flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export Participants
        </button>

        {/* Danger Actions */}
        <button
          onClick={onClose}
          className="w-full px-4 py-2 border border-gray-300 text-black text-sm font-medium hover:border-black transition-colors rounded flex items-center justify-center gap-2"
        >
          <Lock className="w-4 h-4" />
          Close Event
        </button>

        <button
          onClick={onDelete}
          className="w-full px-4 py-2 border border-red-500 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors rounded flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete Event
        </button>
      </div>
    </div>
  );
}
