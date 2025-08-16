// ゲーム音響管理フック
import { useCallback, useEffect } from 'react';
import { gameAudioManager, type GameAudioConfig } from '@/lib/gameAudioManager';
import { useAudioContext } from '@/components/AudioProvider';
import type { PointResult, TennisPlayer } from '@/types/tennis';

export function useGameAudio() {
  const { isInitialized } = useAudioContext();

  // ポイント結果音響再生
  const playPointAudio = useCallback((
    pointResult: PointResult, 
    homePlayer: TennisPlayer, 
    awayPlayer: TennisPlayer
  ) => {
    if (!isInitialized) return;
    gameAudioManager.playPointResultAudio(pointResult, homePlayer, awayPlayer);
  }, [isInitialized]);

  // ラリー打撃音再生
  const playRallyHit = useCallback((intensity?: number, shotType?: string) => {
    if (!isInitialized) return;
    gameAudioManager.playRallyHitSound(intensity, shotType);
  }, [isInitialized]);

  // ボールバウンド音再生
  const playBallBounce = useCallback((intensity?: number) => {
    if (!isInitialized) return;
    gameAudioManager.playBallBounceSound(intensity);
  }, [isInitialized]);

  // UI操作音再生
  const playUISound = useCallback((action: 'click' | 'select' | 'intervention_available' | 'intervention_success') => {
    if (!isInitialized) return;
    gameAudioManager.playUISound(action);
  }, [isInitialized]);

  // 監督介入結果音響再生
  const playInterventionResultAudio = useCallback((
    success: boolean, 
    instruction: { name: string; effectiveness: string } | null, 
    message: string
  ) => {
    if (!isInitialized) return;
    gameAudioManager.playInterventionResultAudio(success, instruction, message);
  }, [isInitialized]);

  // エース音響再生
  const playAceAudio = useCallback((aceType: 'serve' | 'return', intensity?: number) => {
    if (!isInitialized) return;
    gameAudioManager.playAceAudio(aceType, intensity);
  }, [isInitialized]);

  // 設定更新
  const updateAudioConfig = useCallback((config: Partial<GameAudioConfig>) => {
    gameAudioManager.updateConfig(config);
  }, []);

  // 設定取得
  const getAudioConfig = useCallback(() => {
    return gameAudioManager.getConfig();
  }, []);

  // リセット
  const resetAudio = useCallback(() => {
    gameAudioManager.reset();
  }, []);

  // 新しい試合開始時にリセット
  useEffect(() => {
    return () => {
      // コンポーネントアンマウント時にクリーンアップ
    };
  }, []);

  return {
    // 音響再生
    playPointAudio,
    playRallyHit,
    playBallBounce,
    playUISound,
    playInterventionResultAudio,
    playAceAudio,
    
    // 設定管理
    updateAudioConfig,
    getAudioConfig,
    
    // ユーティリティ
    resetAudio,
    isReady: isInitialized
  };
}