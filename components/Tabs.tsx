'use client';

import { ReactNode, useState } from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  badge?: number;
  content: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
}

export default function Tabs({ tabs, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className="flex flex-col h-full">
      {/* Tab Headers */}
      <div className="flex border-b border-black/10 bg-white">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-[#08c605] border-b-2 border-[#08c605]'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`ml-1 px-2 py-0.5 text-xs rounded-full font-medium ${
                    activeTab === tab.id
                      ? 'bg-[#08c605] text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">{activeTabContent}</div>
    </div>
  );
}
