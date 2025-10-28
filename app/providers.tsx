'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/lib/i18n';
import { GoogleMapsProvider } from '@/contexts/GoogleMapsContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <GoogleMapsProvider>{children}</GoogleMapsProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
