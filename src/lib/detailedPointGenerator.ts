// 詳細ポイント結果生成システム
import type { 
  TennisPlayer, 
  PointResult, 
  DetailedPointResult, 
  DetailedPointEndReason, 
  PointResultCategory,
  PlayerAction
} from '@/types/tennis';

export class DetailedPointGenerator {
  
  // デバッグ用：強制的に特殊アニメーションを生成するフラグ
  private static debugForceSpecialAnimation: DetailedPointEndReason | null = null;
  private static debugCounter = 0;
  
  // デバッグ用：特殊アニメーションを強制的に生成
  static setDebugForceAnimation(reason: DetailedPointEndReason | null) {
    this.debugForceSpecialAnimation = reason;
    console.log('🔧 Debug: Force animation set to:', reason);
  }
  
  // 基本的なPointResultから詳細なDetailedPointResultを生成
  static generateDetailedResult(
    basicResult: PointResult,
    homePlayer: TennisPlayer,
    awayPlayer: TennisPlayer,
    isServe: boolean = false
  ): DetailedPointResult {
    
    const category = this.categorizePoint(basicResult);
    const detailedReason = this.determineDetailedReason(basicResult, category, isServe);
    const ballTrajectory = this.generateBallTrajectory(detailedReason, basicResult.winner);
    const playerActions = this.generatePlayerActions(detailedReason, basicResult.winner, homePlayer, awayPlayer);
    
    const result = {
      winner: basicResult.winner,
      category,
      detailedReason,
      description: this.generateDescription(detailedReason, basicResult.winner),
      ballTrajectory,
      playerActions,
      intensity: this.calculateIntensity(basicResult),
      dramaticEffect: this.selectDramaticEffect(detailedReason, basicResult),
      audioEffect: this.selectAudioEffects(detailedReason)
    };
    
    console.log('🎬 Generated detailed point result:', {
      reason: detailedReason,
      category,
      winner: basicResult.winner,
      trajectory: ballTrajectory,
      hasNetHit: !!(ballTrajectory as any).hitNetAt
    });
    
    return result;
  }
  
  // ポイントのカテゴリ分類
  private static categorizePoint(result: PointResult): PointResultCategory {
    // 既存のreasonから推測
    if (result.reason === 'ace') {
      return 'ace';
    }
    
    // 攻撃力と成功率で判定
    const isWinnerAttackSuperior = result.homeAttack > result.awayAttack ? 
      result.winner === 'home' : result.winner === 'away';
    
    if (result.successRate > 0.8 && isWinnerAttackSuperior) {
      return 'winner';
    } else if (result.successRate < 0.3) {
      return 'unforced_error';
    } else if (result.successRate < 0.6) {
      return 'forced_error';
    } else {
      return 'winner';
    }
  }
  
  // 詳細終了理由の決定
  private static determineDetailedReason(
    result: PointResult, 
    category: PointResultCategory,
    isServe: boolean
  ): DetailedPointEndReason {
    
    // デバッグ用：強制的に特定のアニメーションを生成
    if (this.debugForceSpecialAnimation) {
      const forced = this.debugForceSpecialAnimation;
      this.debugCounter++;
      console.log(`🔧 Debug: Forcing animation ${this.debugCounter}: ${forced}`);
      
      // 3回強制生成したら自動リセット
      if (this.debugCounter >= 3) {
        this.debugForceSpecialAnimation = null;
        this.debugCounter = 0;
        console.log('🔧 Debug: Auto-reset after 3 forced animations');
      }
      
      return forced;
    }
    
    const random = Math.random();
    
    // エースの場合
    if (category === 'ace' || isServe && random < 0.15) {
      return random < 0.8 ? 'ace_serve' : 'service_winner';
    }
    
    // カテゴリ別の詳細理由決定
    switch (category) {
      case 'winner':
        return this.selectWinnerReason(result);
        
      case 'unforced_error':
        return this.selectUnforcedErrorReason();
        
      case 'forced_error':
        return this.selectForcedErrorReason();
        
      case 'double_fault':
        return 'double_fault';
        
      default:
        return 'clean_winner';
    }
  }
  
  private static selectWinnerReason(result: PointResult): DetailedPointEndReason {
    const random = Math.random();
    const intensity = result.intensity || 0.5;
    
    if (intensity > 0.8) {
      // 劇的な決定打
      const dramaticWinners: DetailedPointEndReason[] = ['clean_winner', 'passing_shot', 'volley_winner'];
      return dramaticWinners[Math.floor(random * dramaticWinners.length)];
    } else {
      // 通常の決定打
      const normalWinners: DetailedPointEndReason[] = ['clean_winner', 'drop_shot', 'lob_winner'];
      return normalWinners[Math.floor(random * normalWinners.length)];
    }
  }
  
  private static selectUnforcedErrorReason(): DetailedPointEndReason {
    const errorReasons: DetailedPointEndReason[] = [
      'hit_net', 'out_baseline', 'out_sideline', 'out_long', 'out_wide'
    ];
    
    // ネットエラーを少し高めに設定（テスト用）
    const weights = [0.35, 0.25, 0.15, 0.15, 0.1]; // ネットが多め
    return this.weightedRandom(errorReasons, weights);
  }
  
  private static selectForcedErrorReason(): DetailedPointEndReason {
    const forcedReasons: DetailedPointEndReason[] = [
      'missed_return', 'late_swing', 'overwhelmed', 'misjudged'
    ];
    
    const weights = [0.3, 0.25, 0.25, 0.2];
    return this.weightedRandom(forcedReasons, weights);
  }
  
  // 重み付きランダム選択
  private static weightedRandom<T>(items: T[], weights: number[]): T {
    const random = Math.random();
    let sum = 0;
    
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (random < sum) {
        return items[i];
      }
    }
    
    return items[items.length - 1];
  }
  
  // ボール軌道生成
  private static generateBallTrajectory(reason: DetailedPointEndReason, winner: 'home' | 'away') {
    const trajectory = {
      startPosition: { x: 0.5, y: winner === 'home' ? 0.8 : 0.2 },
      endPosition: { x: 0.5, y: winner === 'home' ? 0.2 : 0.8 },
      maxHeight: 0.3,
      speed: 1.0
    };
    
    // 理由別の軌道調整
    switch (reason) {
      case 'hit_net':
      case 'net_cord':
        trajectory.endPosition = { x: 0.5, y: 0.5 }; // ネット位置
        trajectory.maxHeight = 0.1;
        return { ...trajectory, hitNetAt: { x: 0.5, y: 0.5 } };
        
      case 'out_baseline':
      case 'out_long':
        trajectory.endPosition.y = winner === 'home' ? -0.1 : 1.1; // コート外
        trajectory.maxHeight = 0.4;
        trajectory.speed = 1.2;
        break;
        
      case 'out_sideline':
      case 'out_wide':
        trajectory.endPosition.x = Math.random() < 0.5 ? -0.1 : 1.1; // サイド外
        trajectory.maxHeight = 0.25;
        break;
        
      case 'missed_return':
      case 'late_swing':
        // ボールがプレイヤーを通り過ぎる
        trajectory.endPosition.y = winner === 'away' ? 0.9 : 0.1;
        trajectory.speed = 0.8;
        break;
        
      case 'drop_shot':
        trajectory.endPosition.y = winner === 'home' ? 0.3 : 0.7;
        trajectory.maxHeight = 0.15;
        trajectory.speed = 0.6;
        break;
        
      case 'lob_winner':
        trajectory.maxHeight = 0.8;
        trajectory.speed = 0.7;
        break;
        
      case 'ace_serve':
      case 'service_winner':
        trajectory.speed = 1.5;
        trajectory.endPosition.x = 0.3 + Math.random() * 0.4; // サービスエリア内
        break;
    }
    
    return trajectory;
  }
  
  // プレイヤーアクション生成
  private static generatePlayerActions(
    reason: DetailedPointEndReason,
    winner: 'home' | 'away',
    homePlayer: TennisPlayer,
    awayPlayer: TennisPlayer
  ) {
    const homeAction: PlayerAction = {
      type: 'stroke',
      success: winner === 'home',
      reactionTime: 300 + Math.random() * 200,
      position: { x: 0.5, y: 0.8 },
      targetPosition: { x: 0.5, y: 0.8 },
      movementType: 'normal'
    };
    
    const awayAction: PlayerAction = {
      type: 'stroke',
      success: winner === 'away',
      reactionTime: 300 + Math.random() * 200,
      position: { x: 0.5, y: 0.2 },
      targetPosition: { x: 0.5, y: 0.2 },
      movementType: 'normal'
    };
    
    // 理由別のアクション調整
    switch (reason) {
      case 'missed_return':
      case 'late_swing':
        const missingPlayer = winner === 'home' ? awayAction : homeAction;
        missingPlayer.success = false;
        missingPlayer.reactionTime += 200;
        missingPlayer.movementType = 'stretch';
        break;
        
      case 'overwhelmed':
        const overwhelmedPlayer = winner === 'home' ? awayAction : homeAction;
        overwhelmedPlayer.movementType = 'defensive';
        overwhelmedPlayer.reactionTime += 150;
        break;
        
      case 'passing_shot':
        const passingPlayer = winner === 'home' ? homeAction : awayAction;
        passingPlayer.type = 'stroke';
        passingPlayer.movementType = 'rush';
        break;
        
      case 'volley_winner':
        const volleyPlayer = winner === 'home' ? homeAction : awayAction;
        volleyPlayer.type = 'volley';
        volleyPlayer.position.y = volleyPlayer.position.y > 0.5 ? 0.6 : 0.4;
        break;
        
      case 'drop_shot':
        const dropPlayer = winner === 'home' ? homeAction : awayAction;
        dropPlayer.type = 'drop';
        dropPlayer.movementType = 'normal';
        break;
        
      case 'ace_serve':
      case 'service_winner':
        const servingPlayer = winner === 'home' ? homeAction : awayAction;
        servingPlayer.type = 'serve';
        servingPlayer.reactionTime = 100;
        break;
    }
    
    return {
      homePlayer: homeAction,
      awayPlayer: awayAction
    };
  }
  
  // 説明文生成
  private static generateDescription(reason: DetailedPointEndReason, winner: 'home' | 'away'): string {
    const descriptions: Record<DetailedPointEndReason, string> = {
      // ネット系
      'net_cord': 'ボールがネットコードに当たった',
      'hit_net': 'ボールがネットにかかった',
      'touch_net': 'ネットタッチ',
      
      // アウト系
      'out_baseline': 'ベースラインオーバー',
      'out_sideline': 'サイドラインアウト',
      'out_long': 'ロングアウト',
      'out_wide': 'ワイドアウト',
      
      // ミス系
      'missed_return': 'リターンミス',
      'late_swing': 'スイングが遅れた',
      'misjudged': 'タイミングを見誤った',
      'overwhelmed': '相手のプレッシャーに屈した',
      
      // 決定打系
      'clean_winner': 'クリーンウィナー',
      'passing_shot': '鮮やかなパッシングショット',
      'drop_shot': '絶妙なドロップショット',
      'lob_winner': '美しいロブウィナー',
      'volley_winner': '決定的なボレー',
      'ace_serve': 'エースサーブ！',
      'service_winner': 'サービスウィナー',
      
      // 特殊
      'double_fault': 'ダブルフォルト',
      'foot_fault': 'フットフォルト',
      'time_violation': '時間切れ'
    };
    
    return descriptions[reason] || 'ポイント終了';
  }
  
  // 強度計算
  private static calculateIntensity(result: PointResult): number {
    let intensity = 0.5;
    
    // ラリー長さで調整
    if (result.rallyLength) {
      intensity += Math.min(result.rallyLength * 0.1, 0.3);
    }
    
    // 成功率で調整（ギリギリほど劇的）
    if (result.successRate < 0.3 || result.successRate > 0.9) {
      intensity += 0.2;
    }
    
    // カムバックで調整
    if (result.isComeback) {
      intensity += 0.3;
    }
    
    return Math.min(intensity, 1.0);
  }
  
  // 演出効果選択
  private static selectDramaticEffect(
    reason: DetailedPointEndReason, 
    result: PointResult
  ): 'slow_motion' | 'freeze_frame' | 'zoom_in' | undefined {
    
    const intensity = result.intensity || 0.5;
    
    if (intensity < 0.6) return undefined;
    
    switch (reason) {
      case 'ace_serve':
      case 'clean_winner':
        return 'slow_motion';
        
      case 'passing_shot':
      case 'volley_winner':
        return 'zoom_in';
        
      case 'hit_net':
      case 'out_baseline':
        return 'freeze_frame';
        
      default:
        return Math.random() < 0.3 ? 'slow_motion' : undefined;
    }
  }
  
  // 音響効果選択
  private static selectAudioEffects(reason: DetailedPointEndReason): string[] {
    const effects: Record<DetailedPointEndReason, string[]> = {
      'ace_serve': ['ace_serve', 'crowd_roar'],
      'clean_winner': ['winner_shot', 'crowd_excited'],
      'hit_net': ['ball_net'],
      'out_baseline': ['ball_bounce_hard'],
      'missed_return': ['racket_whiff'],
      'passing_shot': ['winner_shot', 'crowd_excited'],
      'volley_winner': ['volley_hit', 'crowd_light'],
      'service_winner': ['service_winner', 'crowd_roar'],
      'double_fault': ['double_fault', 'crowd_disappointed'],
      'net_cord': ['ball_net', 'crowd_surprised'],
      'touch_net': ['ball_net'],
      'out_sideline': ['ball_bounce_hard'],
      'out_long': ['ball_bounce_hard'],
      'out_wide': ['ball_bounce_hard'],
      'late_swing': ['racket_whiff'],
      'misjudged': ['racket_whiff'],
      'overwhelmed': ['racket_whiff'],
      'drop_shot': ['drop_shot', 'crowd_excited'],
      'lob_winner': ['lob_shot', 'crowd_excited'],
      'foot_fault': ['foot_fault', 'crowd_disappointed'],
      'time_violation': ['time_violation', 'crowd_disappointed']
    };
    
    return effects[reason] || ['point_end'];
  }
}