import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How It Works - Group Meeting Planning Guide',
  description: 'Learn how Where2Meet finds fair meeting places using advanced algorithms. Step-by-step guide to finding midpoints, coordinating group locations, and discovering perfect venues halfway between addresses.',
  keywords: [
    'how to meet halfway',
    'find midpoint between locations',
    'group meeting planning guide',
    'calculate meeting point',
    'fair meeting place algorithm',
    'coordinate group location',
    'find restaurant halfway',
    'meeting planner tutorial',
  ],
  openGraph: {
    title: 'How Where2Meet Finds Perfect Group Meeting Places',
    description: 'Learn how to find fair meeting spots for groups using Welzl\'s algorithm, real-time collaboration, and smart venue search.',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How Where2Meet Works - Meeting Place Guide',
    description: 'Step-by-step guide to finding perfect group meeting places.',
  },
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
