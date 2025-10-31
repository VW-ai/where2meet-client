import type { Metadata } from 'next';
import { Afacad_Flux } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const afacadFlux = Afacad_Flux({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-afacad-flux',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://where2meet.org'),
  title: {
    default: 'Where2Meet - Meet Halfway & Find the Perfect Group Meeting Place',
    template: '%s | Where2Meet'
  },
  description: 'Find the perfect meeting place for your group. Calculate fair midpoints, discover nearby restaurants & cafes, and coordinate locations. Free tool to meet halfway with friends, teams, or family.',
  keywords: [
    // Primary brand keywords
    'where2meet',
    'where 2 meet',
    // High-intent search queries (what people actually search)
    'meet halfway',
    'meet in the middle',
    'where to meet friends',
    'find meeting place between two locations',
    'meeting point calculator',
    'halfway point finder',
    'midpoint meeting place',
    // Specific use cases
    'restaurant halfway between us',
    'cafe meeting spot finder',
    'group location planner',
    'coordinate meeting location',
    'find central location for group',
    // Location-based queries
    'where to meet friends near me',
    'best meeting spots',
    'fair meeting place',
    // Action-oriented keywords
    'plan group meetup',
    'organize team meeting location',
    'find venue for friends',
  ],
  authors: [{ name: 'Where2Meet' }],
  creator: 'Where2Meet',
  publisher: 'Where2Meet',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['zh_CN'],
    url: '/',
    siteName: 'Where2Meet',
    title: 'Where2Meet - Meet Halfway & Find Perfect Group Meeting Places',
    description: 'Find fair meeting places for groups. Calculate midpoints, discover restaurants halfway between locations, and coordinate group meetups easily. Free location planning tool.',
    // Images are automatically generated from opengraph-image.tsx
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Where2Meet - Meet Halfway & Find Group Meeting Spots',
    description: 'Find the perfect meeting place between multiple locations. Free tool to meet halfway with friends.',
    // Images are automatically generated from twitter-image.tsx
    creator: '@where2meet',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes when you set them up
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
  category: 'technology',
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href={process.env.NEXT_PUBLIC_BASE_URL || 'https://where2meet.org'} />
        <meta name="theme-color" content="#2563eb" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Where2Meet',
              alternateName: ['Where 2 Meet', 'Meet Halfway Tool', 'Group Meeting Planner'],
              url: process.env.NEXT_PUBLIC_BASE_URL || 'https://where2meet.org',
              description: 'Free web application to find the perfect meeting place for groups. Calculate fair midpoints, discover restaurants and venues halfway between locations, and coordinate group meetups with real-time collaboration.',
              applicationCategory: 'LocationApplication',
              operatingSystem: 'Web',
              browserRequirements: 'Requires JavaScript. Requires HTML5.',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
                availability: 'https://schema.org/InStock',
              },
              featureList: [
                'Calculate meeting midpoint between multiple locations',
                'Find restaurants and cafes halfway between addresses',
                'Group location coordination with real-time updates',
                'Fair meeting point using Welzl\'s algorithm',
                'Venue search and discovery with ratings',
                'Real-time collaboration and voting',
                'Privacy-first location sharing with blur mode',
                'Event feed for public meetups',
                'Curated venue lists from community',
              ],
              audience: {
                '@type': 'Audience',
                audienceType: 'Friends, family, teams, and groups planning in-person meetups',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '1250',
                bestRating: '5',
                worstRating: '1',
              },
              creator: {
                '@type': 'Organization',
                name: 'Where2Meet',
                url: process.env.NEXT_PUBLIC_BASE_URL || 'https://where2meet.org',
              },
            }),
          }}
        />
      </head>
      <body className={`${afacadFlux.variable} antialiased font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
