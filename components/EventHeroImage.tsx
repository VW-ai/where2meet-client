'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface EventHeroImageProps {
  imageUrl?: string;
  category?: string;
  status?: 'host' | 'participant' | 'guest';
}

const getCategoryPlaceholder = (category?: string): string => {
  const placeholders: Record<string, string> = {
    food: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=400&fit=crop',
    sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=400&fit=crop',
    entertainment: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=1200&h=400&fit=crop',
    work: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=400&fit=crop',
    music: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&h=400&fit=crop',
    outdoors: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=1200&h=400&fit=crop',
  };
  return placeholders[category || 'food'] || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&h=400&fit=crop';
};

const getStatusBadge = (status?: 'host' | 'participant' | 'guest') => {
  if (status === 'host') {
    return (
      <div className="px-3 py-1.5 bg-yellow-500 text-black text-sm font-bold rounded">
        HOST
      </div>
    );
  }
  if (status === 'participant') {
    return (
      <div className="px-3 py-1.5 bg-green-500 text-white text-sm font-bold rounded">
        JOINED
      </div>
    );
  }
  return null;
};

export default function EventHeroImage({ imageUrl, category, status }: EventHeroImageProps) {
  const router = useRouter();
  const displayImage = imageUrl || getCategoryPlaceholder(category);

  return (
    <div className="relative w-full h-[400px] md:h-[350px] sm:h-[250px]">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={displayImage}
          alt="Event"
          fill
          className="object-cover"
          priority
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      {/* Back Button - Top Left */}
      <button
        onClick={() => router.push('/')}
        className="absolute top-4 left-4 z-10 px-4 py-2 bg-white/90 backdrop-blur-sm text-black font-medium rounded-lg hover:bg-white transition-colors flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Feed
      </button>

      {/* Status Badge - Top Right */}
      {status && (
        <div className="absolute top-4 right-4 z-10">
          {getStatusBadge(status)}
        </div>
      )}
    </div>
  );
}
