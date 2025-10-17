'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

interface InstructionsProps {
  role: 'host' | 'participant' | null;
  hasLocations: boolean;
  hasCandidates: boolean;
}

export default function Instructions({ role, hasLocations, hasCandidates }: InstructionsProps) {
  const { t, language } = useTranslation();
  const [showInstructions, setShowInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed instructions before
    const hasSeenInstructions = localStorage.getItem('where2meet_instructions_seen');
    if (!hasSeenInstructions) {
      setShowInstructions(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('where2meet_instructions_seen', 'true');
    setShowInstructions(false);
    setDismissed(true);
  };

  const handleShow = () => {
    setShowInstructions(true);
  };

  // Show help button if dismissed
  if (dismissed || (!showInstructions && localStorage.getItem('where2meet_instructions_seen'))) {
    return (
      <button
        onClick={handleShow}
        className="fixed bottom-4 right-4 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 flex items-center justify-center text-xl font-bold"
        title={language === 'zh' ? '显示说明' : 'Show instructions'}
      >
        ?
      </button>
    );
  }

  if (!showInstructions) return null;

  const getInstructions = () => {
    if (language === 'zh') {
      // Chinese instructions
      if (role === 'host') {
        if (!hasLocations) {
          return {
            title: '🎯 欢迎，主办方！',
            steps: [
              '1️⃣ 使用左侧面板添加参与者位置',
              '2️⃣ 输入地址或在地图上点击',
              '3️⃣ 与参与者分享加入链接',
              '4️⃣ 在"搜索"标签中搜索地点',
              '5️⃣ 投票并选择完美的聚会地点！',
            ],
          };
        } else if (!hasCandidates) {
          return {
            title: '🔍 准备查找地点',
            steps: [
              '1️⃣ 转到右侧的"搜索"标签',
              '2️⃣ 输入关键词（例如："餐厅"、"咖啡馆"）',
              '3️⃣ 点击搜索查找附近地点',
              '4️⃣ 查看并对候选地点投票',
              '5️⃣ 准备好后发布最终决定！',
            ],
          };
        } else {
          return {
            title: '✅ 一切就绪！',
            steps: [
              '🗳️ 在"搜索"标签中查看地点',
              '💜 在"自定义添加"标签中添加自定义地点',
              '📊 调整圆圈半径以便可视化',
              '✨ 准备好后发布最终决定',
            ],
          };
        }
      } else {
        // Participant
        return {
          title: '👋 欢迎，参与者！',
          steps: [
            '1️⃣ 使用左侧面板添加您的位置',
            '2️⃣ 输入您的地址或在地图上点击',
            '3️⃣ 在提示时输入您的昵称',
            '4️⃣ 等待主办方搜索地点',
            '5️⃣ 为您首选的聚会地点投票！',
          ],
        };
      }
    } else {
      // English instructions
      if (role === 'host') {
        if (!hasLocations) {
          return {
            title: '🎯 Welcome, Host!',
            steps: [
              '1️⃣ Add participant locations using the left panel',
              '2️⃣ Type addresses or click on the map',
              '3️⃣ Share the join link with participants',
              '4️⃣ Search for venues in the Search tab',
              '5️⃣ Vote and select the perfect meeting spot!',
            ],
          };
        } else if (!hasCandidates) {
          return {
            title: '🔍 Ready to Find Venues',
            steps: [
              '1️⃣ Go to the "Search" tab on the right',
              '2️⃣ Enter a keyword (e.g., "restaurants", "cafes")',
              '3️⃣ Click Search to find nearby venues',
              '4️⃣ Review and vote on candidates',
              '5️⃣ Publish your final decision when ready!',
            ],
          };
        } else {
          return {
            title: '✅ You\'re All Set!',
            steps: [
              '🗳️ Review venues in the Search tab',
              '💜 Add custom venues in the Custom Add tab',
              '📊 Adjust the circle radius for visualization',
              '✨ Publish final decision when ready',
            ],
          };
        }
      } else {
        // Participant
        return {
          title: '👋 Welcome, Participant!',
          steps: [
            '1️⃣ Add your location using the left panel',
            '2️⃣ Type your address or click on the map',
            '3️⃣ Enter your nickname when prompted',
            '4️⃣ Wait for the host to search for venues',
            '5️⃣ Vote on your preferred meeting spot!',
          ],
        };
      }
    }
  };

  const instructions = getInstructions();

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-50" onClick={handleDismiss} />

      {/* Instructions Panel */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{instructions.title}</h2>
        </div>

        <div className="space-y-3 mb-6">
          {instructions.steps.map((step, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-gray-800">{step}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {language === 'zh' ? '明白了！' : 'Got it!'}
          </button>
          <button
            onClick={() => setShowInstructions(false)}
            className="px-4 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            {language === 'zh' ? '稍后' : 'Later'}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-3">
          {language === 'zh'
            ? '点击右下角的 ? 按钮可再次显示此说明'
            : 'Click the ? button in the bottom-right to show this again'}
        </p>
      </div>
    </>
  );
}
