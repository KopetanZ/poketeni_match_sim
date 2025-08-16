// 試合操作コントロール

'use client';

import { useAppStore } from '@/lib/store';
import { Play, Pause, SkipForward, RotateCcw, Settings, FastForward, Zap } from 'lucide-react';
import { useState } from 'react';
import { useGameAudio } from '@/hooks/useGameAudio';

export default function MatchControls() {
  const {
    isMatchActive,
    isAutoPlaying,
    isWaitingForIntervention,
    autoPlaySpeed,
    currentMatch,
    playNextPoint,
    startAutoPlay,
    stopAutoPlay,
    setAutoPlaySpeed,
    resetMatch,
    skipIntervention
  } = useAppStore();
  
  const [showSpeedControl, setShowSpeedControl] = useState(false);
  
  // 音響管理
  const { playUISound } = useGameAudio();
  
  const handlePlayNextPoint = async () => {
    try {
      playUISound('click');
      await playNextPoint();
    } catch (error) {
      console.error('ポイント実行エラー:', error);
    }
  };
  
  const handleStartAutoPlay = (mode: 'normal' | 'to_intervention' | 'to_end') => {
    playUISound('click');
    startAutoPlay(mode);
  };
  
  const handleStopAutoPlay = () => {
    playUISound('click');
    stopAutoPlay();
  };
  
  const handleResetMatch = () => {
    playUISound('click');
    resetMatch();
  };
  
  const handleSkipIntervention = () => {
    playUISound('click');
    skipIntervention();
  };
  
  const handleSpeedChange = (speed: number) => {
    playUISound('select');
    setAutoPlaySpeed(speed);
  };
  
  const handleToggleSpeedControl = () => {
    playUISound('click');
    setShowSpeedControl(!showSpeedControl);
  };
  
  const speedOptions = [
    { label: '高速', value: 500 },
    { label: '普通', value: 1500 },
    { label: 'ゆっくり', value: 3000 }
  ];
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* メイン操作ボタン */}
        <div className="flex gap-2">
          {isMatchActive && !isWaitingForIntervention && (
            <>
              {isAutoPlaying ? (
                <button
                  onClick={handleStopAutoPlay}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Pause size={16} />
                  一時停止
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleStartAutoPlay('normal')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Play size={16} />
                    自動再生
                  </button>
                  
                  <button
                    onClick={() => handleStartAutoPlay('to_intervention')}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <FastForward size={16} />
                    次の介入まで
                  </button>
                  
                  <button
                    onClick={() => handleStartAutoPlay('to_end')}
                    className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    <Zap size={16} />
                    試合終了まで
                  </button>
                </>
              )}
              
              <button
                onClick={handlePlayNextPoint}
                disabled={isAutoPlaying}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <SkipForward size={16} />
                次のポイント
              </button>
            </>
          )}
          
          <button
            onClick={handleResetMatch}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <RotateCcw size={16} />
            リセット
          </button>
        </div>
        
        {/* 速度設定 */}
        {isMatchActive && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSpeedControl}
              className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <Settings size={16} />
              速度
            </button>
            
            {showSpeedControl && (
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {speedOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleSpeedChange(option.value)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      autoPlaySpeed === option.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* 状態表示 */}
        <div className="flex items-center gap-4 ml-auto">
          {isWaitingForIntervention && (
            <>
              <div className="flex items-center gap-2 px-3 py-2 bg-orange-100 text-orange-800 rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                監督介入待ち
              </div>
              
              <button
                onClick={handleSkipIntervention}
                className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                介入をスキップ
              </button>
            </>
          )}
          
          {isMatchActive && currentMatch && (
            <div className="text-sm text-gray-600">
              残り介入回数: <span className="font-semibold">{currentMatch.coachBudgetRemaining}回</span>
            </div>
          )}
          
          {isAutoPlaying && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              自動再生中
            </div>
          )}
        </div>
      </div>
    </div>
  );
}