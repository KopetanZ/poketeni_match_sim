'use client';

import React, { useState } from 'react';
import { useAudioContext } from './AudioProvider';

export function AudioControls() {
  const { config, setVolume, setEnabled, tennis } = useAudioContext();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg">
      {/* 音響コントロールボタン */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3 flex items-center gap-2 hover:bg-gray-50 rounded-lg"
      >
        <span className="text-xl">{config.enabled ? '🔊' : '🔇'}</span>
        <span className="text-sm font-medium">音響設定</span>
        <span className="text-xs text-gray-500">
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>

      {/* 詳細設定パネル */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4 w-64">
          {/* 音響有効/無効 */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">音響有効</label>
            <button
              onClick={() => setEnabled(!config.enabled)}
              className={`w-12 h-6 rounded-full transition-colors ${
                config.enabled ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  config.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* マスター音量 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">マスター音量</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.masterVolume}
              onChange={(e) => setVolume('master', parseFloat(e.target.value))}
              className="w-full"
              disabled={!config.enabled}
            />
            <div className="text-xs text-gray-500 text-right">
              {Math.round(config.masterVolume * 100)}%
            </div>
          </div>

          {/* 効果音音量 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">効果音音量</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.sfxVolume}
              onChange={(e) => setVolume('sfx', parseFloat(e.target.value))}
              className="w-full"
              disabled={!config.enabled}
            />
            <div className="text-xs text-gray-500 text-right">
              {Math.round(config.sfxVolume * 100)}%
            </div>
          </div>

          {/* BGM音量 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">BGM音量</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.musicVolume}
              onChange={(e) => setVolume('music', parseFloat(e.target.value))}
              className="w-full"
              disabled={!config.enabled}
            />
            <div className="text-xs text-gray-500 text-right">
              {Math.round(config.musicVolume * 100)}%
            </div>
          </div>

          {/* テスト音響 */}
          <div className="border-t border-gray-200 pt-3 space-y-2">
            <div className="text-sm font-medium mb-2">音響テスト</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => tennis?.playRacketHit('light')}
                className="p-2 bg-blue-100 hover:bg-blue-200 rounded"
                disabled={!config.enabled}
              >
                🎾 軽打
              </button>
              <button
                onClick={() => tennis?.playRacketHit('power')}
                className="p-2 bg-red-100 hover:bg-red-200 rounded"
                disabled={!config.enabled}
              >
                🎾 強打
              </button>
              <button
                onClick={() => tennis?.playBallBounce()}
                className="p-2 bg-green-100 hover:bg-green-200 rounded"
                disabled={!config.enabled}
              >
                ⚽ バウンド
              </button>
              <button
                onClick={() => tennis?.playWinnerShot()}
                className="p-2 bg-yellow-100 hover:bg-yellow-200 rounded"
                disabled={!config.enabled}
              >
                🏆 ウィナー
              </button>
              <button
                onClick={() => tennis?.playCrowdReaction('excited')}
                className="p-2 bg-purple-100 hover:bg-purple-200 rounded col-span-2"
                disabled={!config.enabled}
              >
                👏 観客歓声
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}