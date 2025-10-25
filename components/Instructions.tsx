'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

interface InstructionsProps {
  role: 'host' | 'participant' | null;
  hasLocations: boolean;
  hasCandidates: boolean;
}

interface TutorialStep {
  title: string;
  description: string;
  targetElement?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export default function Instructions({ role, hasLocations, hasCandidates }: InstructionsProps) {
  const { t, language } = useTranslation();
  const [showInstructions, setShowInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    // Check if user has dismissed instructions before
    const hasSeenInstructions = localStorage.getItem('where2meet_instructions_seen');
    if (!hasSeenInstructions) {
      setShowInstructions(true);
    }
  }, []);

  // Update highlight when step changes
  useEffect(() => {
    if (!showInstructions) return;

    const steps = getTutorialSteps();
    if (currentStep >= steps.length) return;

    const step = steps[currentStep];
    if (step.targetElement) {
      const element = document.querySelector(step.targetElement);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightRect(rect);
      } else {
        setHighlightRect(null);
      }
    } else {
      setHighlightRect(null);
    }
  }, [currentStep, showInstructions]);

  const handleDismiss = () => {
    localStorage.setItem('where2meet_instructions_seen', 'true');
    setShowInstructions(false);
    setDismissed(true);
    setCurrentStep(0);
    setHighlightRect(null);
  };

  const handleShow = () => {
    setShowInstructions(true);
    setCurrentStep(0);
  };

  const handleNext = () => {
    const steps = getTutorialSteps();
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setShowInstructions(false);
    setCurrentStep(0);
    setHighlightRect(null);
  };

  // Show help button if dismissed
  // Position much higher (bottom-48) if host to avoid overlapping with circle radius controller
  if (dismissed || (!showInstructions && localStorage.getItem('where2meet_instructions_seen'))) {
    return (
      <button
        onClick={handleShow}
        className={`fixed ${role === 'host' ? 'bottom-48' : 'bottom-48'} right-4 w-12 h-12 bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-white hover:text-black transition-all z-50 flex items-center justify-center text-xl font-bold`}
        title={language === 'zh' ? '显示说明' : 'Show instructions'}
      >
        ?
      </button>
    );
  }

  if (!showInstructions) return null;

  const getTutorialSteps = (): TutorialStep[] => {
    if (role === 'host') {
      if (!hasLocations) {
        return [
          {
            title: language === 'zh' ? 'Input 区域' : 'Input Section',
            description: language === 'zh' ? '添加你的位置来创建活动中心点' : 'Add your location to create the event center point',
            targetElement: '[data-tutorial-section="input"]',
            position: 'right',
          },
          {
            title: language === 'zh' ? '设置位置' : 'Set Location',
            description: language === 'zh' ? '输入地址、用GPS或点击地图。可选模糊位置保护隐私' : 'Type address, use GPS, or click map. Optional blur for privacy',
            targetElement: '[data-tutorial-section="input"]',
            position: 'right',
          },
          {
            title: language === 'zh' ? '搜索半径' : 'Search Radius',
            description: language === 'zh' ? '右下控制器调整搜索范围 (0.5-2km)。圆圈实时更新' : 'Bottom-right controller adjusts search area (0.5-2km). Circle updates live',
            targetElement: '.absolute.bottom-6.right-6',
            position: 'top',
          },
          {
            title: language === 'zh' ? '邀请参与者' : 'Invite Participants',
            description: language === 'zh' ? '用分享按钮发送链接。他们加入后即可搜索地点' : 'Share button sends link. Search venues once they join',
            targetElement: undefined,
            position: 'center',
          },
        ];
      } else if (!hasCandidates) {
        return [
          {
            title: language === 'zh' ? 'Search 区域' : 'Search Section',
            description: language === 'zh' ? '查找和管理候选地点。输入关键词如 "餐厅"' : 'Find and manage venues. Type keywords like "restaurants"',
            targetElement: '[data-tutorial-section="venues"]',
            position: 'right',
          },
          {
            title: language === 'zh' ? '调整范围' : 'Set Range',
            description: language === 'zh' ? '搜索前先设置半径。地图显示搜索圆圈' : 'Set radius before searching. Map shows search circle',
            targetElement: '.absolute.bottom-6.right-6',
            position: 'top',
          },
          {
            title: language === 'zh' ? 'Participants 区域' : 'Participants Section',
            description: language === 'zh' ? '查看所有人。点击名字定位地图。三角形=参与者位置' : 'See everyone. Click names to locate. Triangles = participant locations',
            targetElement: '[data-tutorial-section="participants"]',
            position: 'right',
          },
        ];
      } else {
        return [
          {
            title: language === 'zh' ? '管理结果' : 'Manage Results',
            description: language === 'zh' ? '点击地点查看详情。保存或投票' : 'Click venues for details. Save or vote',
            targetElement: '[data-tutorial-section="venues"]',
            position: 'right',
          },
          {
            title: language === 'zh' ? '参与者互动' : 'Interact',
            description: language === 'zh' ? '点击名字定位地图。切换显示控制名字' : 'Click names to center map. Toggle controls name display',
            targetElement: '[data-tutorial-section="participants"]',
            position: 'right',
          },
          {
            title: language === 'zh' ? '发布' : 'Publish',
            description: language === 'zh' ? '选择地点后点击发布按钮。所有人收到通知' : 'Select venue then hit Publish. Everyone gets notified',
            targetElement: undefined,
            position: 'center',
          },
        ];
      }
    } else {
      // Participant
      return [
        {
          title: language === 'zh' ? 'Input 区域' : 'Input Section',
          description: language === 'zh' ? '输入地址或用GPS' : 'Type address or use GPS',
          targetElement: '[data-tutorial-section="input"]',
          position: 'right',
        },
        {
          title: language === 'zh' ? 'Search 区域' : 'Search Section',
          description: language === 'zh' ? '主办方搜索后这里显示地点。投票或保存' : 'Venues appear here after host searches. Vote or save',
          targetElement: '[data-tutorial-section="venues"]',
          position: 'right',
        },
        {
          title: language === 'zh' ? 'Participants 区域' : 'Participants Section',
          description: language === 'zh' ? '查看谁加入了。点击查看位置。地图上的三角形=每个人' : 'See who joined. Click to view location. Triangles on map = people',
          targetElement: '[data-tutorial-section="participants"]',
          position: 'right',
        },
      ];
    }
  };

  const steps = getTutorialSteps();
  const currentTutorialStep = steps[currentStep];

  // Calculate tooltip position based on highlighted element
  const getTooltipPosition = () => {
    if (!highlightRect || !currentTutorialStep.position) {
      // Center position
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 20;
    const position = currentTutorialStep.position;

    switch (position) {
      case 'right':
        return {
          top: `${highlightRect.top + highlightRect.height / 2}px`,
          left: `${highlightRect.right + padding}px`,
          transform: 'translateY(-50%)',
        };
      case 'left':
        return {
          top: `${highlightRect.top + highlightRect.height / 2}px`,
          right: `${window.innerWidth - highlightRect.left + padding}px`,
          transform: 'translateY(-50%)',
        };
      case 'top':
        return {
          bottom: `${window.innerHeight - highlightRect.top + padding}px`,
          left: `${highlightRect.left + highlightRect.width / 2}px`,
          transform: 'translateX(-50%)',
        };
      case 'bottom':
        return {
          top: `${highlightRect.bottom + padding}px`,
          left: `${highlightRect.left + highlightRect.width / 2}px`,
          transform: 'translateX(-50%)',
        };
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  return (
    <>
      {/* Dark Overlay with spotlight cutout */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        <svg className="w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {highlightRect && (
                <rect
                  x={highlightRect.left - 8}
                  y={highlightRect.top - 8}
                  width={highlightRect.width + 16}
                  height={highlightRect.height + 16}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="black"
            fillOpacity="0.7"
            mask="url(#spotlight-mask)"
          />
        </svg>
      </div>

      {/* Highlight border around target element */}
      {highlightRect && (
        <div
          className="fixed border-4 border-blue-500 rounded-lg z-50 pointer-events-none animate-pulse"
          style={{
            top: `${highlightRect.top - 8}px`,
            left: `${highlightRect.left - 8}px`,
            width: `${highlightRect.width + 16}px`,
            height: `${highlightRect.height + 16}px`,
          }}
        />
      )}

      {/* Tutorial Tooltip */}
      <div
        className="fixed z-50 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 max-w-sm w-full mx-4"
        style={getTooltipPosition()}
      >
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            {/* Icon based on section */}
            {currentTutorialStep.targetElement?.includes('input') && (
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
            {currentTutorialStep.targetElement?.includes('venues') && (
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
            {currentTutorialStep.targetElement?.includes('participants') && (
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            )}
            {currentTutorialStep.targetElement?.includes('bottom-6') && (
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            )}
            {!currentTutorialStep.targetElement && (
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <h3 className="text-lg font-bold text-black">{currentTutorialStep.title}</h3>
          </div>
          <p className="text-sm text-gray-700">{currentTutorialStep.description}</p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-1 mb-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 flex-1 ${
                index === currentStep ? 'bg-black' : index < currentStep ? 'bg-gray-400' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleSkip}
            className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
          >
            {language === 'zh' ? '跳过' : 'Skip'}
          </button>
          <div className="flex-1" />
          {currentStep > 0 && (
            <button
              onClick={handlePrevious}
              className="px-4 py-2 text-sm font-bold border-2 border-black bg-white hover:bg-gray-100 transition-all"
            >
              {language === 'zh' ? '上一步' : 'Back'}
            </button>
          )}
          <button
            onClick={handleNext}
            className="px-4 py-2 text-sm font-bold border-2 border-black bg-black text-white hover:bg-gray-900 transition-all"
          >
            {currentStep < steps.length - 1
              ? language === 'zh' ? '下一步' : 'Next'
              : language === 'zh' ? '完成' : 'Finish'}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-3">
          {language === 'zh'
            ? `步骤 ${currentStep + 1} / ${steps.length}`
            : `Step ${currentStep + 1} of ${steps.length}`}
        </p>
      </div>
    </>
  );
}
