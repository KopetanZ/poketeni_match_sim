// 監督介入モーダル

'use client';

import { useState, useEffect } from 'react';
import { InterventionOpportunity, CoachInstruction } from '@/types/tennis';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameAudio } from '@/hooks/useGameAudio';

interface InterventionModalProps {
  opportunity: InterventionOpportunity;
  instructions: CoachInstruction[];
  remainingUses: number;
  onSelect: (instruction: CoachInstruction | null) => void;
  timeLimit?: number; // 秒数
}

export default function InterventionModal({ 
  opportunity, 
  instructions, 
  remainingUses, 
  onSelect,
  timeLimit = 10 
}: InterventionModalProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [selectedInstruction, setSelectedInstruction] = useState<CoachInstruction | null>(null);
  
  // 音響管理
  const { playUISound } = useGameAudio();
  
  useEffect(() => {
    // モーダル表示時に介入機会通知音を再生
    playUISound('intervention_available');
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // 時間切れ - 介入しない
          onSelect(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [onSelect, playUISound]);
  
  const handleSelect = (instruction: CoachInstruction) => {
    playUISound('select');
    setSelectedInstruction(instruction);
  };
  
  const handleConfirm = () => {
    if (selectedInstruction) {
      playUISound('intervention_success');
    }
    onSelect(selectedInstruction);
  };
  
  const handleSkip = () => {
    playUISound('click');
    onSelect(null);
  };
  
  const getUrgencyColor = (urgency: number) => {
    if (urgency >= 90) return 'bg-red-500';
    if (urgency >= 70) return 'bg-orange-500';
    if (urgency >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };
  
  const getEffectivenessColor = (effectiveness: string) => {
    switch (effectiveness) {
      case 'basic': return 'border-green-400 bg-green-50';
      case 'advanced': return 'border-blue-400 bg-blue-50';
      case 'risky': return 'border-orange-400 bg-orange-50';
      case 'emergency': return 'border-red-400 bg-red-50';
      default: return 'border-gray-400 bg-gray-50';
    }
  };
  
  const getEffectivenessLabel = (effectiveness: string) => {
    switch (effectiveness) {
      case 'basic': return '安全';
      case 'advanced': return '効果的';
      case 'risky': return 'リスキー';
      case 'emergency': return '緊急';
      default: return '不明';
    }
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        >
          {/* ヘッダー */}
          <div className={`p-6 text-white rounded-t-lg ${getUrgencyColor(opportunity.urgency)}`}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {opportunity.type === 'crisis' ? '🚨 ピンチ！' : '⚡ チャンス！'}
                </h2>
                <p className="text-lg">{opportunity.description}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{timeLeft}</div>
                <div className="text-sm opacity-90">秒</div>
              </div>
            </div>
          </div>
          
          {/* 状況説明 */}
          <div className="p-6 bg-gray-50 border-b">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-600">緊急度: </span>
                <span className="font-semibold">{opportunity.urgency}/100</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">残り介入回数: </span>
                <span className="font-semibold text-blue-600">{remainingUses}回</span>
              </div>
            </div>
          </div>
          
          {/* 指示選択 */}
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">監督指示を選択してください</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {instructions.map(instruction => (
                <motion.div
                  key={instruction.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedInstruction?.id === instruction.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : getEffectivenessColor(instruction.effectiveness)
                  }`}
                  onClick={() => handleSelect(instruction)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg">{instruction.name}</h4>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs px-2 py-1 rounded ${
                        instruction.effectiveness === 'basic' ? 'bg-green-200 text-green-800' :
                        instruction.effectiveness === 'advanced' ? 'bg-blue-200 text-blue-800' :
                        instruction.effectiveness === 'risky' ? 'bg-orange-200 text-orange-800' :
                        'bg-red-200 text-red-800'
                      }`}>
                        {getEffectivenessLabel(instruction.effectiveness)}
                      </span>
                      <span className="text-xs text-gray-600">
                        成功率: {Math.round(instruction.successRate * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{instruction.description}</p>
                  
                  {/* 効果表示 */}
                  <div className="space-y-1">
                    {Object.entries(instruction.effects).map(([key, value]) => {
                      if (key === 'duration' || key === 'situationRequirements' || !value) return null;
                      
                      const label = getEffectLabel(key);
                      if (!label) return null;
                      
                      return (
                        <div key={key} className="flex justify-between text-xs">
                          <span>{label}:</span>
                          <span className="font-medium text-green-600">
                            {typeof value === 'number' ? (value > 0 ? `+${value}` : value) : value}
                          </span>
                        </div>
                      );
                    })}
                    <div className="flex justify-between text-xs">
                      <span>持続:</span>
                      <span className="font-medium">{instruction.effects.duration}ポイント</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* アクションボタン */}
            <div className="flex justify-between">
              <button
                onClick={handleSkip}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                介入をスキップ
                <div className="text-xs text-gray-200 mt-1">
                  (回数消費なし)
                </div>
              </button>
              
              <button
                onClick={handleConfirm}
                disabled={!selectedInstruction}
                className={`px-6 py-3 rounded-lg transition-colors ${
                  selectedInstruction
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                この指示を出す
                {selectedInstruction && (
                  <div className="text-xs text-blue-200 mt-1">
                    (残り回数-1)
                  </div>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// 効果のラベルを取得
function getEffectLabel(key: string): string | null {
  const labels: Record<string, string> = {
    serveBonus: 'サーブ',
    receiveBonus: 'リターン',
    volleyBonus: 'ボレー',
    strokeBonus: 'ストローク',
    mentalBonus: 'メンタル',
    staminaBonus: 'スタミナ',
    criticalRate: 'クリティカル率',
    errorReduction: 'エラー軽減',
    successRateBonus: '成功率',
    opponentPressure: '相手プレッシャー',
    opponentConcentrationBreak: '相手集中力削減'
  };
  
  return labels[key] || null;
}