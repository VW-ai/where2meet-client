'use client';

import { useState } from 'react';

interface EventAboutProps {
  description?: string;
}

export default function EventAbout({ description }: EventAboutProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 300;

  if (!description) {
    return (
      <div className="bg-white border-b border-gray-300 px-8 py-6">
        <h2 className="text-2xl font-bold text-black mb-4">About This Event</h2>
        <p className="text-base text-gray-500 italic">No description provided</p>
      </div>
    );
  }

  const needsTruncation = description.length > maxLength;
  const displayText = needsTruncation && !isExpanded
    ? description.slice(0, maxLength) + '...'
    : description;

  return (
    <div className="bg-white border-b border-gray-300 px-8 py-6">
      <h2 className="text-2xl font-bold text-black mb-4">About This Event</h2>
      <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
        {displayText}
      </p>
      {needsTruncation && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 text-base text-black font-medium hover:underline"
        >
          {isExpanded ? 'Read less' : 'Read more'}
        </button>
      )}
    </div>
  );
}
