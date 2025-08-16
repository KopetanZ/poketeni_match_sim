// アニメーションテンプレート定義
import { AnimationType, AnimationTemplate, PointAnimationData } from '@/types/animation';

export const ANIMATION_TEMPLATES: Record<AnimationType, AnimationTemplate> = {
  serve_ace: {
    sequence: [
      { type: 'player_focus', duration: 500 },
      { type: 'serve_motion', duration: 800 },
      { type: 'ball_trajectory_fast', duration: 600 },
      { type: 'opponent_unable_react', duration: 400 },
      { type: 'ace_celebration', duration: 1000 }
    ],
    totalDuration: 3300,
    skippable: true,
    category: 'point'
  },

  power_serve: {
    sequence: [
      { type: 'player_power_up', duration: 600 },
      { type: 'powerful_serve_motion', duration: 1000 },
      { type: 'ball_trajectory_power', duration: 700 },
      { type: 'opponent_struggle', duration: 500 },
      { type: 'power_result', duration: 800 }
    ],
    totalDuration: 3600,
    skippable: true,
    category: 'point'
  },

  return_winner: {
    sequence: [
      { type: 'incoming_serve', duration: 600 },
      { type: 'player_reaction_fast', duration: 400 },
      { type: 'return_execution', duration: 600 },
      { type: 'ball_trajectory_winner', duration: 800 },
      { type: 'server_surprised', duration: 400 },
      { type: 'winner_celebration', duration: 800 }
    ],
    totalDuration: 3600,
    skippable: true,
    category: 'point'
  },

  volley_smash: {
    sequence: [
      { type: 'rally_buildup', duration: 1200 },
      { type: 'net_approach', duration: 600 },
      { type: 'setup_perfect', duration: 400 },
      { type: 'volley_smash_execution', duration: 500 },
      { type: 'ball_smash_trajectory', duration: 600 },
      { type: 'smash_celebration', duration: 1000 }
    ],
    totalDuration: 4300,
    skippable: true,
    category: 'point'
  },

  stroke_winner: {
    sequence: [
      { type: 'rally_exchange', duration: 1500 },
      { type: 'player_positioning', duration: 500 },
      { type: 'stroke_preparation', duration: 400 },
      { type: 'winner_stroke', duration: 600 },
      { type: 'ball_winner_trajectory', duration: 800 },
      { type: 'stroke_celebration', duration: 800 }
    ],
    totalDuration: 4600,
    skippable: true,
    category: 'point'
  },

  rally_epic: {
    sequence: [
      { type: 'rally_start', duration: 800 },
      { type: 'rally_exchange_long', duration: 2000 },
      { type: 'rally_intensity_rise', duration: 1000 },
      { type: 'rally_climax', duration: 800 },
      { type: 'rally_conclusion', duration: 1000 },
      { type: 'exhaustion_show', duration: 600 }
    ],
    totalDuration: 6200,
    skippable: true,
    category: 'point'
  },

  mental_break: {
    sequence: [
      { type: 'pressure_buildup', duration: 1000 },
      { type: 'player_stress_show', duration: 800 },
      { type: 'execution_fail', duration: 600 },
      { type: 'mental_collapse_effect', duration: 800 },
      { type: 'opponent_advantage', duration: 500 },
      { type: 'recovery_attempt', duration: 700 }
    ],
    totalDuration: 4400,
    skippable: true,
    category: 'point'
  },

  comeback_moment: {
    sequence: [
      { type: 'desperate_situation', duration: 800 },
      { type: 'player_determination', duration: 1000 },
      { type: 'comeback_execution', duration: 1200 },
      { type: 'crowd_reaction', duration: 600 },
      { type: 'momentum_shift', duration: 800 },
      { type: 'comeback_celebration', duration: 1200 }
    ],
    totalDuration: 5600,
    skippable: false, // 重要なシーンなのでスキップ不可
    category: 'point'
  },

  instruction_effect: {
    sequence: [
      { type: 'coach_signal', duration: 500 },
      { type: 'player_acknowledgment', duration: 400 },
      { type: 'instruction_aura', duration: 1000 },
      { type: 'stat_boost_effect', duration: 800 },
      { type: 'player_confidence', duration: 600 }
    ],
    totalDuration: 3300,
    skippable: true,
    category: 'instruction'
  },

  special_ability: {
    sequence: [
      { type: 'ability_trigger', duration: 600 },
      { type: 'special_aura', duration: 1000 },
      { type: 'ability_execution', duration: 1200 },
      { type: 'special_effect', duration: 800 },
      { type: 'ability_result', duration: 800 }
    ],
    totalDuration: 4400,
    skippable: true,
    category: 'point'
  },

  normal_point: {
    sequence: [
      { type: 'standard_serve', duration: 600 },
      { type: 'standard_return', duration: 500 },
      { type: 'short_rally', duration: 800 },
      { type: 'point_conclusion', duration: 400 }
    ],
    totalDuration: 2300,
    skippable: true,
    category: 'point'
  },

  error: {
    sequence: [
      { type: 'setup_normal', duration: 400 },
      { type: 'execution_mistake', duration: 600 },
      { type: 'error_effect', duration: 500 },
      { type: 'player_frustration', duration: 600 },
      { type: 'error_recovery', duration: 400 }
    ],
    totalDuration: 2500,
    skippable: true,
    category: 'point'
  }
};

// アニメーション選択ロジック
export function selectAnimationType(
  pointResult: any, // PointResult型
  wasInfluencedByInstruction: boolean,
  isSpecialAbilityTriggered: boolean
): AnimationType {
  
  // 監督指示効果がある場合
  if (wasInfluencedByInstruction) {
    return 'instruction_effect';
  }
  
  // 特殊能力発動の場合
  if (isSpecialAbilityTriggered) {
    return 'special_ability';
  }
  
  // ポイント結果に基づく選択
  switch (pointResult.reason) {
    case 'ace':
      return 'serve_ace';
    case 'service_winner':
      return 'power_serve';
    case 'return_winner':
      return 'return_winner';
    case 'volley_winner':
      return 'volley_smash';
    case 'stroke_winner':
      return 'stroke_winner';
    case 'mental_break':
      return 'mental_break';
    case 'opponent_error':
      return 'error';
    default:
      // ラリーの長さやポイントの重要度で判定
      if (pointResult.rallyLength > 8) {
        return 'rally_epic';
      }
      
      // 逆転的な状況判定（簡略版）
      if (pointResult.isComeback) {
        return 'comeback_moment';
      }
      
      return 'normal_point';
  }
}

// アニメーション速度調整
export function adjustAnimationForSpeed(
  template: AnimationTemplate, 
  speedMultiplier: number
): AnimationTemplate {
  return {
    ...template,
    sequence: template.sequence.map(step => ({
      ...step,
      duration: Math.max(100, step.duration / speedMultiplier) // 最小100ms
    })),
    totalDuration: template.totalDuration / speedMultiplier
  };
}

// 重要度に基づくスキップ可能性判定
export function shouldForcePlay(animationType: AnimationType, situation: string): boolean {
  const criticalAnimations: AnimationType[] = ['comeback_moment', 'mental_break'];
  const criticalSituations = ['match_point', 'set_point', 'break_point'];
  
  return criticalAnimations.includes(animationType) || 
         criticalSituations.some(s => situation.includes(s));
}