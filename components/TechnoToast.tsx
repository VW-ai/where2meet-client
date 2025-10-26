'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function TechnoToast({ message, type, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-600',
          border: 'border-black',
          icon: <CheckCircle className="w-6 h-6" />,
          iconBg: 'bg-white text-green-600',
        };
      case 'error':
        return {
          bg: 'bg-red-600',
          border: 'border-black',
          icon: <XCircle className="w-6 h-6" />,
          iconBg: 'bg-white text-red-600',
        };
      case 'info':
        return {
          bg: 'bg-blue-600',
          border: 'border-black',
          icon: <Info className="w-6 h-6" />,
          iconBg: 'bg-white text-blue-600',
        };
    }
  };

  const styles = getStyles();

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-slide-down">
      <div
        className={`${styles.bg} text-white border-4 ${styles.border} shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4 p-4`}
      >
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 ${styles.iconBg} border-2 border-black flex items-center justify-center`}>
          {styles.icon}
        </div>

        {/* Message */}
        <span className="flex-1 font-bold text-sm uppercase">{message}</span>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-80 transition-opacity"
          aria-label="Close notification"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
