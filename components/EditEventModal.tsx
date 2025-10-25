'use client';

import { useState, useEffect } from 'react';
import { EventStatus } from '@/types';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    meeting_time: string;
    participant_limit?: number;
    status: EventStatus;
  }) => Promise<void>;
  initialData: {
    title: string;
    description?: string;
    meeting_time: string;
    participant_limit?: number;
    status: EventStatus;
  };
}

export default function EditEventModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: EditEventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [participantLimit, setParticipantLimit] = useState<number | undefined>();
  const [status, setStatus] = useState<EventStatus>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with current event data
  useEffect(() => {
    if (isOpen && initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      // Convert ISO string to datetime-local format
      const date = new Date(initialData.meeting_time);
      const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setMeetingTime(localDateTime);
      setParticipantLimit(initialData.participant_limit);
      setStatus(initialData.status);
      setError(null);
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) {
      setError('Event title is required');
      return;
    }
    if (!meetingTime) {
      setError('Meeting time is required');
      return;
    }

    // Check if meeting time is in the future
    const meetingDate = new Date(meetingTime);
    if (meetingDate <= new Date()) {
      setError('Meeting time must be in the future');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        meeting_time: meetingDate.toISOString(),
        participant_limit: participantLimit,
        status,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-300 px-6 py-4 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-black">Edit Event</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-600 hover:text-black text-2xl leading-none disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            {/* Event Title */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Weekend Brunch Meetup"
                maxLength={100}
                className="w-full px-4 py-3 text-black border border-gray-300 focus:border-black focus:outline-none"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell people what this event is about... (optional)"
                maxLength={500}
                rows={4}
                className="w-full px-4 py-3 text-black border border-gray-300 focus:border-black focus:outline-none resize-none"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">{description.length}/500</p>
            </div>

            {/* Meeting Time */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Meeting Time
              </label>
              <input
                type="datetime-local"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                className="w-full px-4 py-3 text-black border border-gray-300 focus:border-black focus:outline-none"
                disabled={isSubmitting}
              />
            </div>

            {/* Participant Limit */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Participant Limit
              </label>
              <input
                type="number"
                value={participantLimit || ''}
                onChange={(e) =>
                  setParticipantLimit(e.target.value ? parseInt(e.target.value) : undefined)
                }
                placeholder="Leave empty for unlimited"
                min={2}
                max={100}
                className="w-full px-4 py-3 text-black border border-gray-300 focus:border-black focus:outline-none"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">Optional (2-100 people)</p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Status
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    value="active"
                    checked={status === 'active'}
                    onChange={() => setStatus('active')}
                    className="mt-1"
                    disabled={isSubmitting}
                    style={{ accentColor: '#000000' }}
                  />
                  <div>
                    <div className="font-medium text-black">Active</div>
                    <div className="text-sm text-gray-600">Event is open for new participants</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    value="closed"
                    checked={status === 'closed'}
                    onChange={() => setStatus('closed')}
                    className="mt-1"
                    disabled={isSubmitting}
                    style={{ accentColor: '#000000' }}
                  />
                  <div>
                    <div className="font-medium text-black">Closed</div>
                    <div className="text-sm text-gray-600">
                      Stop accepting new participants
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 border border-red-500 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex gap-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium hover:border-black hover:text-black transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !meetingTime}
              className="flex-1 py-3 bg-black text-white font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
