import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Where2Meet - Find the Perfect Meeting Place',
  description: 'A location coordination platform to help groups find optimal meeting places',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
