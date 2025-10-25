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
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://where2meet.app'),
  title: {
    default: 'Where2Meet - Find the Perfect Meeting Place for Groups',
    template: '%s | Where2Meet'
  },
  description: 'Where2Meet helps groups find the perfect meeting place. Coordinate locations, discover nearby venues, and meet in the middle. Free group location planning tool for restaurants, cafes, and meeting spots.',
  keywords: [
    'where2meet',
    'where 2 meet',
    'meet in the middle',
    'meeting place finder',
    'group location planner',
    'find meeting spot',
    'coordinate meeting location',
    'meet halfway',
    'group meetup planner',
    'restaurant finder for groups',
    'venue finder',
    'location coordination',
    'midpoint meeting',
    'group planning tool',
    'meeting location app',
    'where to meet friends',
    'find central location',
    'group gathering place'
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
    title: 'Where2Meet - Find the Perfect Meeting Place for Groups',
    description: 'Coordinate group locations and discover the perfect meeting place. Where2Meet helps friends, teams, and groups find optimal meeting spots.',
    // Images are automatically generated from opengraph-image.tsx
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Where2Meet - Find the Perfect Meeting Place',
    description: 'Coordinate group locations and discover the perfect meeting place.',
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
        <link rel="canonical" href={process.env.NEXT_PUBLIC_BASE_URL || 'https://where2meet.app'} />
        <meta name="theme-color" content="#2563eb" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Where2Meet',
              alternateName: 'Where 2 Meet',
              url: process.env.NEXT_PUBLIC_BASE_URL || 'https://where2meet.app',
              description: 'Where2Meet helps groups find the perfect meeting place. Coordinate locations, discover nearby venues, and meet in the middle.',
              applicationCategory: 'LocationApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              featureList: [
                'Group location coordination',
                'Midpoint calculation',
                'Venue search and discovery',
                'Real-time collaboration',
                'Privacy-first location sharing',
                'Restaurant and cafe finder',
                'Meeting place recommendations',
              ],
              audience: {
                '@type': 'Audience',
                audienceType: 'Friends, teams, and groups planning meetups',
              },
            }),
          }}
        />
      </head>
      <body className={`${afacadFlux.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
