'use client';

import { useState } from 'react';
import Avatar from './Avatar';

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isHost: boolean;
}

interface ManageParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  onRemoveParticipant: (participantId: string) => Promise<void>;
}

export default function ManageParticipantsModal({
  isOpen,
  onClose,
  participants,
  onRemoveParticipant,
}: ManageParticipantsModalProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (participantId: string, participantName: string) => {
    if (!confirm(`Remove ${participantName} from this event? Their votes and suggestions will be removed.`)) {
      return;
    }

    setRemovingId(participantId);
    try {
      await onRemoveParticipant(participantId);
    } catch (err) {
      console.error('Failed to remove participant:', err);
    } finally {
      setRemovingId(null);
    }
  };

  if (!isOpen) return null;

  // Separate host from other participants
  const host = participants.find((p) => p.isHost);
  const otherParticipants = participants.filter((p) => !p.isHost);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-300 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-black">
            Manage Participants ({participants.length})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-black text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Host Section */}
          {host && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-600 uppercase mb-3">
                Host
              </h3>
              <div className="flex items-center gap-4 p-4 bg-yellow-50 border border-yellow-200">
                <Avatar
                  name={host.name}
                  src={host.avatar}
                  size="lg"
                  className="ring-2 ring-yellow-500"
                />
                <div className="flex-1">
                  <div className="font-semibold text-black">{host.name}</div>
                  <div className="text-sm text-yellow-700 font-medium">Event Organizer</div>
                </div>
                <div className="text-sm text-gray-500 italic">Cannot be removed</div>
              </div>
            </div>
          )}

          {/* Participants Section */}
          {otherParticipants.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase mb-3">
                Participants ({otherParticipants.length})
              </h3>
              <div className="space-y-2">
                {otherParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-4 p-4 border border-gray-300 hover:border-gray-400 transition-colors"
                  >
                    <Avatar
                      name={participant.name}
                      src={participant.avatar}
                      size="lg"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-black">{participant.name}</div>
                      <div className="text-sm text-gray-600">Participant</div>
                    </div>
                    <button
                      onClick={() => handleRemove(participant.id, participant.name)}
                      disabled={removingId === participant.id}
                      className="px-4 py-2 text-sm border border-red-500 text-red-600 font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {removingId === participant.id ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No other participants yet</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-300 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full py-3 bg-black text-white font-semibold hover:bg-gray-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
