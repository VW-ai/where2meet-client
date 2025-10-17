'use client';

import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  action?: ReactNode;
  suggestions?: string[];
}

export default function EmptyState({ icon, title, message, action, suggestions }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4 max-w-xs">{message}</p>

      {suggestions && suggestions.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Try searching for:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((suggestion) => (
              <span
                key={suggestion}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                {suggestion}
              </span>
            ))}
          </div>
        </div>
      )}

      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
