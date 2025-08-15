// 試合履歴表示

'use client';

import { PointResult } from '@/types/tennis';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface MatchHistoryProps {
  history: PointResult[];
  maxItems?: number;
}

export default function MatchHistory({ history, maxItems = 10 }: MatchHistoryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const recentHistory = history.slice(-maxItems);
  
  // 新しいポイントが追加されたときに自動スクロール
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history.length]);
  
  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'ace': return '⚡';
      case 'service_winner': return '🎯';
      case 'return_winner': return '🔄';
      case 'volley_winner': return '🏐';
      case 'stroke_winner': return '🎾';
      case 'opponent_error': return '❌';
      case 'mental_break': return '💔';
      default: return '🎾';
    }
  };
  
  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'ace': return 'エース';
      case 'service_winner': return 'サービスウィナー';
      case 'return_winner': return 'リターンウィナー';
      case 'volley_winner': return 'ボレーウィナー';
      case 'stroke_winner': return 'ストロークウィナー';
      case 'opponent_error': return '相手ミス';
      case 'mental_break': return 'メンタル崩壊';
      default: return 'その他';
    }
  };
  
  if (recentHistory.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">ポイント履歴</h3>
        <div className="text-center text-gray-500 py-8">
          まだポイントがありません
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">ポイント履歴</h3>
      
      <div 
        ref={containerRef}
        className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300"
      >
        {recentHistory.map((point, index) => (
          <motion.div
            key={history.length - recentHistory.length + index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`p-3 rounded-lg border-l-4 ${
              point.winner === 'home' 
                ? 'bg-blue-50 border-l-blue-500' 
                : 'bg-red-50 border-l-red-500'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getReasonIcon(point.reason)}</span>
                <span className="font-semibold">
                  ポイント #{history.length - recentHistory.length + index + 1}
                </span>
                {point.wasInfluencedByInstruction && (
                  <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                    監督指示
                  </span>
                )}
              </div>
              <span className={`text-sm font-medium ${
                point.winner === 'home' ? 'text-blue-600' : 'text-red-600'
              }`}>
                {point.winner === 'home' ? 'HOME' : 'AWAY'}
              </span>
            </div>
            
            <div className="text-sm text-gray-700 mb-2">
              {point.description}
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{getReasonLabel(point.reason)}</span>
              <span>成功率: {Math.round(point.successRate * 100)}%</span>
            </div>
            
            {/* 詳細統計（展開可能にする場合） */}
            <details className="mt-2">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                詳細統計
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">攻撃力:</span>
                  <span className="ml-1 font-mono">
                    {point.winner === 'home' ? point.homeAttack : point.awayAttack}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">守備力:</span>
                  <span className="ml-1 font-mono">
                    {point.winner === 'home' ? point.awayDefense : point.homeDefense}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">判定値:</span>
                  <span className="ml-1 font-mono">{point.roll.toFixed(3)}</span>
                </div>
                <div>
                  <span className="text-gray-500">必要値:</span>
                  <span className="ml-1 font-mono">{point.successRate.toFixed(3)}</span>
                </div>
              </div>
            </details>
          </motion.div>
        ))}
      </div>
      
      {history.length > maxItems && (
        <div className="mt-4 text-center">
          <span className="text-sm text-gray-500">
            最新 {maxItems} ポイントを表示中（全 {history.length} ポイント）
          </span>
        </div>
      )}
    </div>
  );
}