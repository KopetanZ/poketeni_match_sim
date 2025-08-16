// React Hook for Audio System
import { useEffect, useCallback, useState } from 'react';
import { audioSystem, TENNIS_SOUNDS, type AudioConfig } from '@/lib/audioSystem';
import { generateTestSounds } from '@/lib/audioGenerator';

export function useAudio() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<AudioConfig>(audioSystem.getConfig());

  // Audio Systemの初期化
  const initialize = useCallback(async () => {
    if (isInitialized) return true;
    
    const success = await audioSystem.initialize();
    setIsInitialized(success);
    return success;
  }, [isInitialized]);

  // 音響ファイルのプリロード
  const preloadSounds = useCallback(async () => {
    if (!isInitialized) {
      console.warn('Audio system not initialized');
      return false;
    }

    setIsLoading(true);
    try {
      // まず、テスト音源を生成して使用
      console.log('🎵 Generating test sounds...');
      const context = (audioSystem as any).context;
      
      if (context) {
        const testSounds = await generateTestSounds(context);
        
        // 生成された音源をシステムに登録
        for (const [id, buffer] of testSounds) {
          const volumeMap: Record<string, number> = {
            [TENNIS_SOUNDS.RACKET_LIGHT]: 0.8,
            [TENNIS_SOUNDS.RACKET_MEDIUM]: 0.9,
            [TENNIS_SOUNDS.RACKET_POWER]: 1.0,
            [TENNIS_SOUNDS.BALL_BOUNCE]: 0.7,
            [TENNIS_SOUNDS.BALL_NET]: 0.6,
            [TENNIS_SOUNDS.POINT_WON]: 0.8,
            [TENNIS_SOUNDS.GAME_WON]: 0.9,
            [TENNIS_SOUNDS.WINNER_SHOT]: 1.0,
            [TENNIS_SOUNDS.ACE_SERVE]: 1.0,
            [TENNIS_SOUNDS.BUTTON_CLICK]: 0.5,
            [TENNIS_SOUNDS.INTERVENTION_SUCCESS]: 0.8,
            [TENNIS_SOUNDS.CROWD_LIGHT]: 0.6,
            [TENNIS_SOUNDS.CROWD_EXCITED]: 0.8,
            [TENNIS_SOUNDS.CROWD_ROAR]: 1.0
          };
          
          const volume = volumeMap[id] || 0.7;
          audioSystem.loadSoundFromBuffer(id, buffer, volume, 'sfx');
        }
        
        console.log(`🎵 Loaded ${testSounds.size} generated sounds`);
        return testSounds.size > 0;
      } else {
        console.warn('Audio context not available for sound generation');
        return false;
      }
    } catch (error) {
      console.error('Failed to preload sounds:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // 音響再生ヘルパー関数
  const playSound = useCallback((soundId: string, volume?: number) => {
    audioSystem.playSound(soundId, volume);
  }, []);

  const playSoundWithPitch = useCallback((soundId: string, volume?: number, pitchVariation?: number) => {
    audioSystem.playSoundWithRandomPitch(soundId, volume, pitchVariation);
  }, []);

  // テニス専用音響効果
  const tennisAudio = {
    // ラケット音
    playRacketHit: (intensity: 'light' | 'medium' | 'power' = 'medium') => {
      const soundMap = {
        light: TENNIS_SOUNDS.RACKET_LIGHT,
        medium: TENNIS_SOUNDS.RACKET_MEDIUM,
        power: TENNIS_SOUNDS.RACKET_POWER
      };
      playSoundWithPitch(soundMap[intensity], undefined, 0.15);
    },

    // ボール音
    playBallBounce: () => {
      playSoundWithPitch(TENNIS_SOUNDS.BALL_BOUNCE, undefined, 0.1);
    },

    playBallNet: () => {
      playSound(TENNIS_SOUNDS.BALL_NET);
    },

    // 勝利音
    playPointWon: () => {
      playSound(TENNIS_SOUNDS.POINT_WON);
    },

    playGameWon: () => {
      playSound(TENNIS_SOUNDS.GAME_WON);
    },

    playWinnerShot: () => {
      playSound(TENNIS_SOUNDS.WINNER_SHOT, 1.0);
    },

    playAceServe: () => {
      playSound(TENNIS_SOUNDS.ACE_SERVE, 1.0);
    },

    // 観客音
    playCrowdReaction: (intensity: 'light' | 'excited' | 'roar' = 'light') => {
      const soundMap = {
        light: TENNIS_SOUNDS.CROWD_LIGHT,
        excited: TENNIS_SOUNDS.CROWD_EXCITED,
        roar: TENNIS_SOUNDS.CROWD_ROAR
      };
      playSound(soundMap[intensity]);
    },

    // UI音
    playButtonClick: () => {
      playSound(TENNIS_SOUNDS.BUTTON_CLICK);
    },

    playInterventionSuccess: () => {
      playSound(TENNIS_SOUNDS.INTERVENTION_SUCCESS);
    }
  };

  // 音量調整
  const setVolume = useCallback((type: 'master' | 'sfx' | 'music', volume: number) => {
    audioSystem.setVolume(type, volume);
    setConfig(audioSystem.getConfig());
  }, []);

  // 音響有効/無効
  const setEnabled = useCallback((enabled: boolean) => {
    audioSystem.setEnabled(enabled);
    setConfig(audioSystem.getConfig());
  }, []);

  // 初期化後に音響ファイルをプリロード
  useEffect(() => {
    if (isInitialized && !isLoading) {
      preloadSounds();
    }
  }, [isInitialized, isLoading, preloadSounds]);

  return {
    // 状態
    isInitialized,
    isLoading,
    config,
    
    // 基本機能
    initialize,
    preloadSounds,
    playSound,
    playSoundWithPitch,
    
    // テニス専用
    tennis: tennisAudio,
    
    // 設定
    setVolume,
    setEnabled,
    
    // デバッグ
    getLoadedSounds: () => audioSystem.getLoadedSounds()
  };
}