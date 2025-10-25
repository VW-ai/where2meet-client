'use client';

import { useState } from 'react';
import Avatar from './Avatar';

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isHost?: boolean;
}

interface EventParticipantsProps {
  participants: Participant[];
  participantCount: number;
  participantLimit?: number;
  isHost: boolean;
  onManage?: () => void;
}

export default function EventParticipants({
  participants,
  participantCount,
  participantLimit,
  isHost,
  onManage,
}: EventParticipantsProps) {
  return (
    <div className="bg-white border-b border-gray-300 px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-black">
          Participants ({participantCount}{participantLimit ? `/${participantLimit}` : ''})
        </h2>
        {isHost && onManage && (
          <button
            onClick={onManage}
            className="px-5 py-2.5 border border-black text-black text-base font-medium rounded hover:bg-gray-50 transition-colors"
          >
            Manage
          </button>
        )}
      </div>

      {/* Participant Grid */}
      <div className="grid grid-cols-5 lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 gap-4">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="flex flex-col items-center text-center"
          >
            <Avatar
              src={participant.avatar}
              name={participant.name}
              size="lg"
              className={participant.isHost ? 'ring-2 ring-yellow-500' : ''}
            />
            <p className="mt-2 text-base font-medium text-black truncate w-full">
              {participant.name}
              {participant.isHost && (
                <span className="block text-xs text-yellow-600 font-bold">
                  (Host)
                </span>
              )}
            </p>
          </div>
        ))}
      </div>

      {participants.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No participants yet</p>
        </div>
      )}
    </div>
  );
}
