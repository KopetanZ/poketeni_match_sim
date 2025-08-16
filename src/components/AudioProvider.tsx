'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAudio } from '@/hooks/useAudio';
import type { AudioConfig } from '@/lib/audioSystem';

interface AudioContextType {
  isInitialized: boolean;
  isLoading: boolean;
  config: AudioConfig;
  tennis: any; // テニス専用音響効果
  setVolume: (type: 'master' | 'sfx' | 'music', volume: number) => void;
  setEnabled: (enabled: boolean) => void;
  initialize: () => Promise<boolean>;
  getLoadedSounds?: () => string[];
}

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audio = useAudio();
  const [userInteracted, setUserInteracted] = useState(false);

  // ユーザーインタラクションを検知してAudio Contextを初期化
  useEffect(() => {
    const handleUserInteraction = async () => {
      if (!userInteracted) {
        setUserInteracted(true);
        await audio.initialize();
        console.log('🎵 Audio system initialized after user interaction');
        
        // イベントリスナーを削除
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('keydown', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
      }
    };

    // ユーザーインタラクションイベントを監視
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [userInteracted, audio]);

  return (
    <AudioContext.Provider value={audio}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudioContext() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudioContext must be used within AudioProvider');
  }
  return context;
}

// 音響状態表示コンポーネント（デバッグ用）
export function AudioStatus() {
  const { isInitialized, isLoading, config, getLoadedSounds } = useAudioContext();
  const [loadedSounds, setLoadedSounds] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (getLoadedSounds) {
        setLoadedSounds(getLoadedSounds());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [getLoadedSounds]);

  if (!isInitialized && !isLoading) {
    return (
      <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded text-sm">
        🔇 音響: 未初期化 (クリックで有効化)
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="fixed top-4 right-4 bg-blue-100 border border-blue-400 text-blue-800 px-3 py-2 rounded text-sm">
        🔄 音響: ロード中...
      </div>
    );
  }

  if (isInitialized) {
    return (
      <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-800 px-3 py-2 rounded text-sm">
        🔊 音響: 有効 ({loadedSounds.length}音源)
        {!config.enabled && <span className="text-red-600"> (無効)</span>}
      </div>
    );
  }

  return null;
}