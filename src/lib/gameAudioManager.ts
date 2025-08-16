// ゲームイベント音響管理システム
import type { PointResult, TennisPlayer } from '@/types/tennis';
import { audioSystem, TENNIS_SOUNDS } from './audioSystem';

export interface GameAudioConfig {
  enablePointSounds: boolean;
  enableCrowdReactions: boolean;
  enableRacketSounds: boolean;
  enableUIFeedback: boolean;
  crowdIntensityMultiplier: number; // 0.0 - 2.0
}

export class GameAudioManager {
  private config: GameAudioConfig;
  private lastPointWinner: 'home' | 'away' | null = null;
  private consecutiveWins = 0;

  constructor() {
    this.config = {
      enablePointSounds: true,
      enableCrowdReactions: true,
      enableRacketSounds: true,
      enableUIFeedback: true,
      crowdIntensityMultiplier: 1.0
    };
  }

  // ポイント結果に基づく音響効果再生
  playPointResultAudio(pointResult: PointResult, homePlayer: TennisPlayer, awayPlayer: TennisPlayer): void {
    if (!this.config.enablePointSounds) return;

    try {
      // 勝者判定
      const winner = pointResult.winner;
      const isGamePoint = false; // デフォルト値
      const isSetPoint = false;  // デフォルト値
      const isMatchPoint = false; // デフォルト値

      // 連続勝利カウント更新
      if (this.lastPointWinner === winner) {
        this.consecutiveWins++;
      } else {
        this.consecutiveWins = 1;
        this.lastPointWinner = winner;
      }

      // 特殊なポイントタイプの判定
      if (pointResult.reason === 'ace') {
        this.playAceSound();
      } else if (pointResult.reason === 'service_winner' || pointResult.reason === 'return_winner' || pointResult.reason === 'volley_winner' || pointResult.reason === 'stroke_winner') {
        this.playWinnerSound();
      } else if (pointResult.reason === 'opponent_error') {
        this.playErrorSound();
      } else {
        this.playRegularPointSound();
      }

      // 重要ポイントの追加効果
      if (isMatchPoint) {
        this.playMatchPointSound();
      } else if (isSetPoint) {
        this.playSetPointSound();
      } else if (isGamePoint) {
        this.playGamePointSound();
      }

      // 観客反応
      this.playCrowdReaction(pointResult, isMatchPoint, isSetPoint, isGamePoint);

      console.log(`🎵 Point audio: ${pointResult.reason} by ${winner} (consecutive: ${this.consecutiveWins})`);
    } catch (error) {
      console.error('Failed to play point result audio:', error);
    }
  }

  // エースサーブ音
  private playAceSound(): void {
    audioSystem.playSound(TENNIS_SOUNDS.ACE_SERVE, 1.0);
    // 少し遅れてパワフルなラケット音
    setTimeout(() => {
      audioSystem.playSoundWithRandomPitch(TENNIS_SOUNDS.RACKET_POWER, 0.8, 0.1);
    }, 50);
  }

  // ウィナーショット音
  private playWinnerSound(): void {
    audioSystem.playSound(TENNIS_SOUNDS.WINNER_SHOT, 1.0);
    // ラケット音も追加
    audioSystem.playSoundWithRandomPitch(TENNIS_SOUNDS.RACKET_POWER, 0.7, 0.15);
  }

  // 通常ポイント音
  private playRegularPointSound(): void {
    audioSystem.playSound(TENNIS_SOUNDS.POINT_WON, 0.8);
    // 軽いラケット音
    setTimeout(() => {
      audioSystem.playSoundWithRandomPitch(TENNIS_SOUNDS.RACKET_MEDIUM, 0.6, 0.2);
    }, 100);
  }

  // エラー音（控えめ）
  private playErrorSound(): void {
    audioSystem.playSoundWithRandomPitch(TENNIS_SOUNDS.BALL_NET, 0.5, 0.1);
  }

  // ゲームポイント音
  private playGamePointSound(): void {
    setTimeout(() => {
      audioSystem.playSound(TENNIS_SOUNDS.GAME_WON, 0.9);
    }, 200);
  }

  // セットポイント音  
  private playSetPointSound(): void {
    setTimeout(() => {
      audioSystem.playSound(TENNIS_SOUNDS.GAME_WON, 1.0);
      // 追加の勝利音
      setTimeout(() => {
        audioSystem.playSound(TENNIS_SOUNDS.WINNER_SHOT, 0.8);
      }, 300);
    }, 200);
  }

  // マッチポイント音
  private playMatchPointSound(): void {
    setTimeout(() => {
      audioSystem.playSound(TENNIS_SOUNDS.GAME_WON, 1.0);
      setTimeout(() => {
        audioSystem.playSound(TENNIS_SOUNDS.WINNER_SHOT, 1.0);
      }, 300);
      setTimeout(() => {
        audioSystem.playSound(TENNIS_SOUNDS.ACE_SERVE, 0.8);
      }, 600);
    }, 200);
  }

  // 観客反応
  private playCrowdReaction(
    pointResult: PointResult, 
    isMatchPoint: boolean, 
    isSetPoint: boolean, 
    isGamePoint: boolean
  ): void {
    if (!this.config.enableCrowdReactions) return;

    const baseDelay = 300; // ポイント音の後に再生
    let intensity: 'light' | 'excited' | 'roar' = 'light';
    let volume = 0.6 * this.config.crowdIntensityMultiplier;

    // 重要度に応じて観客反応を決定
    if (isMatchPoint) {
      intensity = 'roar';
      volume = 1.0 * this.config.crowdIntensityMultiplier;
    } else if (isSetPoint || pointResult.reason === 'ace') {
      intensity = 'excited';
      volume = 0.8 * this.config.crowdIntensityMultiplier;
    } else if (isGamePoint || (pointResult.reason === 'service_winner' || pointResult.reason === 'return_winner' || pointResult.reason === 'volley_winner' || pointResult.reason === 'stroke_winner') || this.consecutiveWins >= 3) {
      intensity = 'excited';
      volume = 0.7 * this.config.crowdIntensityMultiplier;
    }

    setTimeout(() => {
      const crowdSounds = {
        light: TENNIS_SOUNDS.CROWD_LIGHT,
        excited: TENNIS_SOUNDS.CROWD_EXCITED,
        roar: TENNIS_SOUNDS.CROWD_ROAR
      };
      audioSystem.playSound(crowdSounds[intensity], volume);
    }, baseDelay);
  }

  // ラリー中の打撃音（ラリー可視化システムとの連動用）
  playRallyHitSound(shotIntensity: number = 0.5, shotType: string = 'normal'): void {
    if (!this.config.enableRacketSounds) return;

    let soundId: string = TENNIS_SOUNDS.RACKET_MEDIUM;
    let volume = 0.6;

    // 打撃強度に応じて音を選択
    if (shotIntensity > 0.8) {
      soundId = TENNIS_SOUNDS.RACKET_POWER;
      volume = 0.8;
    } else if (shotIntensity < 0.3) {
      soundId = TENNIS_SOUNDS.RACKET_LIGHT;
      volume = 0.5;
    }

    // 特殊ショットタイプ
    if (shotType === 'serve') {
      volume += 0.1;
    } else if (shotType === 'volley') {
      soundId = TENNIS_SOUNDS.RACKET_LIGHT;
      volume = 0.7;
    }

    audioSystem.playSoundWithRandomPitch(soundId, volume, 0.15);
  }

  // ボールバウンド音
  playBallBounceSound(intensity: number = 0.5): void {
    if (!this.config.enableRacketSounds) return;
    
    const volume = Math.max(0.3, Math.min(0.8, intensity));
    audioSystem.playSoundWithRandomPitch(TENNIS_SOUNDS.BALL_BOUNCE, volume, 0.1);
  }

  // UI操作音
  playUISound(action: 'click' | 'select' | 'intervention_available' | 'intervention_success'): void {
    if (!this.config.enableUIFeedback) return;

    const soundMap = {
      click: TENNIS_SOUNDS.BUTTON_CLICK,
      select: TENNIS_SOUNDS.BUTTON_CLICK,
      intervention_available: TENNIS_SOUNDS.BUTTON_CLICK, // 後で専用音に変更
      intervention_success: TENNIS_SOUNDS.INTERVENTION_SUCCESS
    };

    const volumeMap = {
      click: 0.4,
      select: 0.5,
      intervention_available: 0.6,
      intervention_success: 0.8
    };

    audioSystem.playSound(soundMap[action], volumeMap[action]);
  }

  // エース専用音響効果
  playAceAudio(aceType: 'serve' | 'return', intensity: number = 1.0): void {
    if (!this.config.enableRacketSounds) return;
    
    console.log(`🎵 Playing ACE audio: ${aceType} with intensity ${intensity}`);
    
    // 超強力な打撃音（バスーン！）
    audioSystem.playSound(TENNIS_SOUNDS.RACKET_POWER, 1.0);
    
    // 少し遅れて衝撃音
    setTimeout(() => {
      audioSystem.playSoundWithRandomPitch(TENNIS_SOUNDS.WINNER_SHOT, 1.0, 0.05);
    }, 100);
    
    // エース専用の観客大爆発
    setTimeout(() => {
      audioSystem.playSound(TENNIS_SOUNDS.CROWD_ROAR, 1.0);
    }, 400);
    
    // 更に遅れて勝利音
    setTimeout(() => {
      audioSystem.playSound(TENNIS_SOUNDS.GAME_WON, 0.9);
    }, 800);
    
    // 特別エコー効果（3回リピート）
    for (let i = 1; i <= 3; i++) {
      setTimeout(() => {
        audioSystem.playSoundWithRandomPitch(
          aceType === 'serve' ? TENNIS_SOUNDS.ACE_SERVE : TENNIS_SOUNDS.WINNER_SHOT, 
          0.4 - i * 0.1, 
          0.2
        );
      }, 200 * i);
    }
  }

  // 監督介入結果フィードバック音響
  playInterventionResultAudio(
    success: boolean, 
    instruction: { name: string; effectiveness: string } | null, 
    message: string
  ): void {
    if (!this.config.enableUIFeedback) return;

    console.log(`🎵 Intervention result: ${success ? 'SUCCESS' : 'FAILED'} - ${message}`);

    if (success && instruction) {
      // 成功音 - 効果レベルに応じて音響を変える
      let volume = 0.8;
      let delay = 200;

      switch (instruction.effectiveness) {
        case 'emergency':
          // 緊急指示成功 - 劇的な音響効果
          audioSystem.playSound(TENNIS_SOUNDS.WINNER_SHOT, 1.0);
          setTimeout(() => {
            audioSystem.playSound(TENNIS_SOUNDS.CROWD_EXCITED, 0.9);
          }, delay);
          setTimeout(() => {
            audioSystem.playSound(TENNIS_SOUNDS.GAME_WON, 0.8);
          }, delay * 2);
          break;
          
        case 'advanced':
          // 上級指示成功 - 力強い効果音
          audioSystem.playSound(TENNIS_SOUNDS.INTERVENTION_SUCCESS, 1.0);
          setTimeout(() => {
            audioSystem.playSound(TENNIS_SOUNDS.CROWD_EXCITED, 0.7);
          }, delay);
          break;
          
        case 'risky':
          // リスキー指示成功 - ギリギリ感のある音
          audioSystem.playSound(TENNIS_SOUNDS.INTERVENTION_SUCCESS, 0.9);
          setTimeout(() => {
            audioSystem.playSoundWithRandomPitch(TENNIS_SOUNDS.CROWD_LIGHT, 0.6, 0.2);
          }, delay);
          break;
          
        case 'basic':
        default:
          // 基本指示成功 - 控えめな成功音
          audioSystem.playSound(TENNIS_SOUNDS.INTERVENTION_SUCCESS, 0.7);
          setTimeout(() => {
            audioSystem.playSound(TENNIS_SOUNDS.CROWD_LIGHT, 0.5);
          }, delay);
          break;
      }
    } else {
      // 失敗音 - 控えめな失敗フィードバック
      audioSystem.playSoundWithRandomPitch(TENNIS_SOUNDS.BALL_NET, 0.4, 0.15);
      
      // 少し遅れて解説的な音
      setTimeout(() => {
        audioSystem.playSoundWithRandomPitch(TENNIS_SOUNDS.BUTTON_CLICK, 0.3, 0.3);
      }, 300);
    }
  }

  // 設定更新
  updateConfig(newConfig: Partial<GameAudioConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🎵 Game audio config updated:', this.config);
  }

  // 設定取得
  getConfig(): GameAudioConfig {
    return { ...this.config };
  }

  // リセット（新しい試合開始時）
  reset(): void {
    this.lastPointWinner = null;
    this.consecutiveWins = 0;
    console.log('🎵 Game audio manager reset');
  }
}

// シングルトンインスタンス
export const gameAudioManager = new GameAudioManager();