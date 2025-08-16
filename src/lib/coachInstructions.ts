// 監督指示システム

import { CoachInstruction, InterventionOpportunity, InterventionSituation } from '@/types/tennis';

// 基本監督指示（10種類）
export const COACH_INSTRUCTIONS: CoachInstruction[] = [
  // 攻撃系指示
  {
    id: 'serve_and_volley',
    name: 'サーブ&ボレー',
    description: 'サーブ後すぐネットに詰めて決めに行く積極戦法',
    category: 'offensive',
    effectiveness: 'advanced',
    effects: { 
      serveBonus: 15, 
      volleyBonus: 10, 
      criticalRate: 8,
      duration: 1 
    },
    successRate: 0.65,
    successMultiplier: 1.2,
    failurePenalty: -3,
    animationType: 'aggressive_rush',
    iconPath: '/instructions/serve_volley.png'
  },
  
  {
    id: 'power_baseline',
    name: 'パワーベースライン',
    description: 'ストロークでガンガン攻めていく強気の戦法',
    category: 'offensive',
    effectiveness: 'basic',
    effects: { 
      strokeBonus: 12, 
      successRateBonus: 5,
      duration: 2 
    },
    successRate: 0.80,
    successMultiplier: 1.0,
    failurePenalty: -2,
    animationType: 'power_attack',
    iconPath: '/instructions/power_baseline.png'
  },
  
  // 守備系指示
  {
    id: 'defensive_wall',
    name: 'ディフェンシブウォール',
    description: 'とにかく返し続けて相手のミスを誘う守備戦法',
    category: 'defensive',
    effectiveness: 'basic',
    effects: { 
      receiveBonus: 15, 
      volleyBonus: 8,
      errorReduction: 20,
      duration: 2 
    },
    successRate: 0.85,
    successMultiplier: 1.0,
    failurePenalty: -1,
    animationType: 'defensive_stance',
    iconPath: '/instructions/defensive_wall.png'
  },
  
  {
    id: 'patience_game',
    name: 'ペイシェンスゲーム',
    description: '我慢強く相手のチャンスボールを待つ戦法',
    category: 'defensive',
    effectiveness: 'advanced',
    effects: { 
      receiveBonus: 10,
      strokeBonus: 8,
      mentalBonus: 5,
      duration: 2 
    },
    successRate: 0.70,
    successMultiplier: 1.1,
    failurePenalty: -2,
    animationType: 'patience_focus',
    iconPath: '/instructions/patience_game.png'
  },
  
  // メンタル系指示
  {
    id: 'mental_reset',
    name: 'メンタルリセット',
    description: '深呼吸して気持ちを落ち着ける。重要な場面で効果的',
    category: 'mental',
    effectiveness: 'basic',
    effects: { 
      mentalBonus: 12,
      errorReduction: 15,
      duration: 1 
    },
    successRate: 0.90,
    successMultiplier: 1.0,
    failurePenalty: 0,
    animationType: 'mental_calm',
    iconPath: '/instructions/mental_reset.png'
  },
  
  {
    id: 'fighting_spirit',
    name: 'ファイティングスピリット',
    description: '闘志を燃やして気迫で押し切る！リスキーだが効果大',
    category: 'mental',
    effectiveness: 'risky',
    effects: { 
      serveBonus: 10,
      strokeBonus: 10,
      mentalBonus: 8,
      criticalRate: 15,
      duration: 1 
    },
    successRate: 0.50,
    successMultiplier: 1.5,
    failurePenalty: -5,
    animationType: 'fighting_aura',
    iconPath: '/instructions/fighting_spirit.png'
  },
  
  // 戦術系指示
  {
    id: 'tempo_change',
    name: 'テンポチェンジ',
    description: '試合のリズムを変えて相手を混乱させる',
    category: 'tactical',
    effectiveness: 'advanced',
    effects: { 
      opponentPressure: 8,
      successRateBonus: 6,
      duration: 2 
    },
    successRate: 0.75,
    successMultiplier: 1.1,
    failurePenalty: -2,
    animationType: 'tempo_shift',
    iconPath: '/instructions/tempo_change.png'
  },
  
  {
    id: 'target_weakness',
    name: 'ウィークポイント狙い',
    description: '相手の弱点を集中的に攻める戦法',
    category: 'tactical',
    effectiveness: 'advanced',
    effects: { 
      strokeBonus: 8,
      volleyBonus: 8,
      criticalRate: 12,
      duration: 1 
    },
    successRate: 0.60,
    successMultiplier: 1.3,
    failurePenalty: -3,
    animationType: 'target_focus',
    iconPath: '/instructions/target_weakness.png'
  },
  
  // 緊急系指示
  {
    id: 'miracle_shot',
    name: 'ミラクルショット',
    description: '奇跡を信じて思い切ったショットを打つ！',
    category: 'emergency',
    effectiveness: 'emergency',
    effects: { 
      serveBonus: 20,
      strokeBonus: 20,
      criticalRate: 25,
      duration: 1 
    },
    successRate: 0.40,
    successMultiplier: 2.0,
    failurePenalty: -8,
    animationType: 'miracle_glow',
    iconPath: '/instructions/miracle_shot.png'
  },
  
  {
    id: 'last_stand',
    name: 'ラストスタンド',
    description: '背水の陣で全てを賭ける！絶体絶命の時のみ',
    category: 'emergency',
    effectiveness: 'emergency',
    effects: { 
      serveBonus: 15,
      receiveBonus: 15,
      volleyBonus: 15,
      strokeBonus: 15,
      mentalBonus: 10,
      duration: 1,
      situationRequirements: ['match_point_against', 'set_point_against']
    },
    successRate: 0.35,
    successMultiplier: 2.5,
    failurePenalty: -10,
    animationType: 'last_stand_aura',
    iconPath: '/instructions/last_stand.png'
  }
];

// 状況に応じた指示の重み付け
const SITUATION_WEIGHTS: Record<InterventionSituation, Record<string, number>> = {
  break_point_against: {
    offensive: 20,
    defensive: 40,
    mental: 30,
    stamina: 10,
    tactical: 15,
    emergency: 5
  },
  break_point_for: {
    offensive: 40,
    defensive: 15,
    mental: 25,
    stamina: 5,
    tactical: 30,
    emergency: 10
  },
  set_point_against: {
    offensive: 15,
    defensive: 35,
    mental: 40,
    stamina: 10,
    tactical: 20,
    emergency: 15
  },
  set_point_for: {
    offensive: 35,
    defensive: 10,
    mental: 30,
    stamina: 5,
    tactical: 25,
    emergency: 20
  },
  match_point_against: {
    offensive: 10,
    defensive: 25,
    mental: 30,
    stamina: 5,
    tactical: 15,
    emergency: 40
  },
  match_point_for: {
    offensive: 30,
    defensive: 5,
    mental: 35,
    stamina: 5,
    tactical: 20,
    emergency: 25
  },
  tiebreak: {
    offensive: 25,
    defensive: 25,
    mental: 35,
    stamina: 15,
    tactical: 20,
    emergency: 10
  },
  momentum_shift: {
    offensive: 30,
    defensive: 20,
    mental: 25,
    stamina: 10,
    tactical: 35,
    emergency: 5
  },
  stamina_low: {
    offensive: 5,
    defensive: 25,
    mental: 20,
    stamina: 40,
    tactical: 10,
    emergency: 15
  },
  mental_pressure: {
    offensive: 15,
    defensive: 20,
    mental: 45,
    stamina: 15,
    tactical: 25,
    emergency: 10
  }
};

// 監督指示プール生成
export function generateInstructionChoices(
  situation: InterventionOpportunity,
  usedInstructions: string[] = []
): CoachInstruction[] {
  
  // 使用可能な指示をフィルタリング
  let availableInstructions = COACH_INSTRUCTIONS.filter(instruction => {
    // 既に使用した指示は除外
    if (usedInstructions.includes(instruction.id)) {
      return false;
    }
    
    // 状況要件をチェック
    if (instruction.effects.situationRequirements) {
      return instruction.effects.situationRequirements.includes(situation.situation);
    }
    
    return true;
  });
  
  // 重み付けされた選択
  const weights = SITUATION_WEIGHTS[situation.situation] || {};
  const weightedInstructions = availableInstructions.map(instruction => ({
    instruction,
    weight: weights[instruction.category] || 10
  }));
  
  // 5つの指示を重み付きランダムで選択
  const selected: CoachInstruction[] = [];
  const remainingInstructions = [...weightedInstructions];
  
  for (let i = 0; i < 5 && remainingInstructions.length > 0; i++) {
    const totalWeight = remainingInstructions.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    let selectedIndex = -1;
    for (let j = 0; j < remainingInstructions.length; j++) {
      random -= remainingInstructions[j].weight;
      if (random <= 0) {
        selectedIndex = j;
        break;
      }
    }
    
    if (selectedIndex >= 0) {
      selected.push(remainingInstructions[selectedIndex].instruction);
      remainingInstructions.splice(selectedIndex, 1);
    }
  }
  
  // 足りない場合はランダムで補充
  while (selected.length < 5 && remainingInstructions.length > 0) {
    const randomIndex = Math.floor(Math.random() * remainingInstructions.length);
    selected.push(remainingInstructions[randomIndex].instruction);
    remainingInstructions.splice(randomIndex, 1);
  }
  
  return selected;
}

// 監督指示の成功判定
export function executeInstruction(instruction: CoachInstruction): {
  success: boolean;
  effectMultiplier: number;
  message: string;
} {
  const roll = Math.random();
  const success = roll < instruction.successRate;
  
  if (success) {
    return {
      success: true,
      effectMultiplier: instruction.successMultiplier,
      message: `${instruction.name}が成功！効果的な指示でした！`
    };
  } else {
    return {
      success: false,
      effectMultiplier: 0,
      message: `${instruction.name}が失敗...選手が戸惑っています。`
    };
  }
}

// 指示の効果を計算
export function calculateInstructionEffects(
  instruction: CoachInstruction,
  success: boolean,
  effectMultiplier: number
): {
  serveBonus: number;
  receiveBonus: number;
  volleyBonus: number;
  strokeBonus: number;
  mentalBonus: number;
  staminaBonus: number;
  criticalRate: number;
  errorReduction: number;
  successRateBonus: number;
  duration: number;
} {
  const effects = instruction.effects;
  
  if (!success) {
    // 失敗時はペナルティのみ
    return {
      serveBonus: 0,
      receiveBonus: 0,
      volleyBonus: 0,
      strokeBonus: 0,
      mentalBonus: instruction.failurePenalty,
      staminaBonus: 0,
      criticalRate: 0,
      errorReduction: 0,
      successRateBonus: 0,
      duration: 1
    };
  }
  
  // 成功時は効果を適用
  return {
    serveBonus: (effects.serveBonus || 0) * effectMultiplier,
    receiveBonus: (effects.receiveBonus || 0) * effectMultiplier,
    volleyBonus: (effects.volleyBonus || 0) * effectMultiplier,
    strokeBonus: (effects.strokeBonus || 0) * effectMultiplier,
    mentalBonus: (effects.mentalBonus || 0) * effectMultiplier,
    staminaBonus: (effects.staminaBonus || 0) * effectMultiplier,
    criticalRate: (effects.criticalRate || 0) * effectMultiplier,
    errorReduction: (effects.errorReduction || 0) * effectMultiplier,
    successRateBonus: (effects.successRateBonus || 0) * effectMultiplier,
    duration: effects.duration
  };
}