'use client';

import ConfirmDialog from './ConfirmDialog';

interface JoinEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  eventTitle: string;
  isLoading?: boolean;
}

export default function JoinEventDialog({
  isOpen,
  onClose,
  onConfirm,
  eventTitle,
  isLoading = false,
}: JoinEventDialogProps) {
  const message = (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <span className="text-green-600 font-bold">✓</span>
          <span>Suggest meeting venues</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-green-600 font-bold">✓</span>
          <span>Vote on venue options</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-green-600 font-bold">✓</span>
          <span>See other participants</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-green-600 font-bold">✓</span>
          <span>Chat with the group (coming soon)</span>
        </div>
      </div>
      <p className="text-sm text-gray-600 border-t pt-3">
        The host can see your profile.
      </p>
    </div>
  );

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Join ${eventTitle}?`}
      message={message}
      confirmText="Join Event"
      cancelText="Cancel"
      confirmVariant="default"
      isLoading={isLoading}
    />
  );
}
