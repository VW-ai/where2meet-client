'use client';

import { Copy, Globe } from 'lucide-react';
import { useLanguage, Language } from '@/lib/i18n';
import { useState } from 'react';

interface TopViewProps {
  eventTitle?: string;
  eventId?: string;
  token?: string;
  isHost?: boolean;
  selectedCandidate?: { name: string } | null;
  finalDecision?: string | null;
  onPublishDecision?: () => void;
  onUnpublishDecision?: () => void;
}

export default function TopView({
  eventTitle,
  eventId,
  token,
  isHost,
  selectedCandidate,
  finalDecision,
  onPublishDecision,
  onUnpublishDecision
}: TopViewProps) {
  const { language, setLanguage, t } = useLanguage();
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

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

  return (
    <div className="bg-black text-white p-3 border-b-2 border-black">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Logo + Event Title */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-white border-2 border-white flex items-center justify-center">
              <span className="text-black font-bold text-sm">W2M</span>
            </div>
          </div>

          {/* Event Title */}
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold truncate">
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
  );
}
