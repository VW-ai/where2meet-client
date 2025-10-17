'use client';

import { useTranslation } from '@/lib/i18n/LanguageProvider';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();

  return (
    <div className="flex items-center gap-1 bg-white rounded-lg border-2 border-gray-300 overflow-hidden">
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 text-sm font-medium transition-colors ${
          language === 'en'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('zh')}
        className={`px-3 py-1 text-sm font-medium transition-colors ${
          language === 'zh'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
      >
        中文
      </button>
    </div>
  );
}
