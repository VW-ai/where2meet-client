'use client';

import ConfirmDialog from './ConfirmDialog';

interface LeaveEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function LeaveEventDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: LeaveEventDialogProps) {
  const message = (
    <div className="space-y-3">
      <p>Are you sure you want to leave?</p>
      <div className="bg-yellow-50 border border-yellow-200 p-3 flex gap-2">
        <span className="text-yellow-600 text-lg flex-shrink-0">⚠️</span>
        <span className="text-yellow-800 text-sm">
          Your votes and venue suggestions will be removed.
        </span>
      </div>
    </div>
  );

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Leave Event?"
      message={message}
      confirmText="Leave Event"
      cancelText="Cancel"
      confirmVariant="danger"
      isLoading={isLoading}
    />
  );
}
