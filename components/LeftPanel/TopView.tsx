'use client';

import { Copy, Globe } from 'lucide-react';
import { useLanguage, Language } from '@/lib/i18n';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

interface TopViewProps {
  eventTitle?: string;
  eventId?: string;
  token?: string;
  isHost?: boolean;
  selectedCandidate?: { name: string } | null;
  finalDecision?: string | null;
  onPublishDecision?: () => void;
  onUnpublishDecision?: () => void;
  isJoined?: boolean;
}

export default function TopView({
  eventTitle,
  eventId,
  token,
  isHost,
  selectedCandidate,
  finalDecision,
  onPublishDecision,
  onUnpublishDecision,
  isJoined
}: TopViewProps) {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);

  const handleCopyLink = async () => {
    if (!eventId) return;

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const joinLink = token
      ? `${baseUrl}/event?id=${eventId}&token=${token}`
      : `${baseUrl}/event?id=${eventId}`;

    try {
      await navigator.clipboard.writeText(joinLink);
      setCopyFeedback(t.joinLinkCopied);
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      setCopyFeedback('Failed to copy link');
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  };

  const toggleLanguage = () => {
    const newLang: Language = language === 'en' ? 'zh' : 'en';
    setLanguage(newLang);
  };

  const handleLogoClick = () => {
    // Show confirmation modal if user has joined the event
    if (isJoined) {
      setShowHomeConfirm(true);
    } else {
      // If not joined, go directly to home
      router.push('/');
    }
  };

  const confirmGoHome = () => {
    router.push('/');
  };

  return (
    <>
      <div className="bg-black text-white p-3 border-b-2 border-black">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Logo + Event Title */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Logo - Clickable */}
            <button
              onClick={handleLogoClick}
              className="flex-shrink-0 hover:opacity-80 transition-opacity"
              title="Return to Home"
            >
              <Logo size="sm" showText={false} theme="dark" />
            </button>

          {/* Event Title */}
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold uppercase truncate">
              {eventTitle || t.eventTitle}
            </h2>
          </div>
        </div>

        {/* Right: Language Switcher + Copy Link */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="p-2 border-2 border-white hover:bg-white hover:text-black transition-all group relative"
            title={language === 'en' ? 'Switch to 中文' : 'Switch to English'}
          >
            <Globe className="w-4 h-4" />
            <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-white text-black px-1 border border-black">
              {language.toUpperCase()}
            </span>
          </button>

          {/* Copy Link Button */}
          {eventId && (
            <div className="relative">
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 border-2 border-white hover:bg-white hover:text-black transition-all font-bold text-xs flex items-center gap-1.5"
                title={t.copyLink}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{t.copyLink}</span>
              </button>

              {/* Copy Feedback Toast */}
              {copyFeedback && (
                <div className="absolute top-full right-0 mt-2 px-2 py-1 bg-white text-black text-xs font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap z-50">
                  {copyFeedback}
                </div>
              )}
            </div>
          )}

          {/* Publish/Unpublish Decision Button (Host only) */}
          {isHost && (
            <>
              {/* Publish button - show when no decision and venue selected */}
              {selectedCandidate && !finalDecision && onPublishDecision && (
                <button
                  onClick={onPublishDecision}
                  className="px-3 py-2 border-2 border-white bg-white text-black hover:bg-black hover:text-white transition-all font-bold text-xs uppercase"
                  title={t.publishDecision}
                >
                  {t.publishDecision}
                </button>
              )}

              {/* Unpublish button - show when decision is published */}
              {finalDecision && onUnpublishDecision && (
                <button
                  onClick={onUnpublishDecision}
                  className="px-3 py-2 border-2 border-white bg-black text-white hover:bg-white hover:text-black transition-all font-bold text-xs uppercase"
                  title="Unpublish Decision"
                >
                  Unpublish
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>

      {/* Home Confirmation Modal */}
      {showHomeConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={() => setShowHomeConfirm(false)}>
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-black text-white px-6 py-4 border-b-4 border-black">
              <h3 className="text-base sm:text-lg font-bold uppercase">Return to Home?</h3>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <p className="text-sm text-black mb-4 font-bold">
                {isHost
                  ? "You are the host of this event."
                  : "You are currently participating in this event."
                }
              </p>
              <p className="text-sm text-black mb-6">
                {isHost
                  ? "Leaving this page won't affect the event, but you'll need the event link to return. Make sure you've copied the join link if you want to come back."
                  : "If you leave, you won't be able to rejoin with the same participant ID. To participate again, you'll need to join as a new participant using the event link."
                }
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowHomeConfirm(false)}
                  className="flex-1 px-4 py-3 border-2 border-black bg-white text-black hover:bg-gray-100 transition-all font-bold text-sm uppercase"
                >
                  Stay
                </button>
                <button
                  onClick={confirmGoHome}
                  className="flex-1 px-4 py-3 border-2 border-black bg-black text-white hover:bg-gray-900 transition-all font-bold text-sm uppercase"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
