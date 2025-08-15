// 特殊能力データベース

import { SpecialAbility } from '@/types/tennis';

export const SPECIAL_ABILITIES: SpecialAbility[] = [
  // サーブ系
  {
    id: 'power_serve',
    name: 'パワーサーブ',
    description: 'サーブの威力が大幅に向上する',
    category: 'serve',
    rarity: 'common',
    effects: {
      serveBonus: 15,
      criticalRate: 8
    },
    isActive: true
  },
  {
    id: 'ace_master',
    name: 'エースマスター',
    description: 'サービスエースを決めやすくなる',
    category: 'serve',
    rarity: 'rare',
    effects: {
      serveBonus: 12,
      criticalRate: 15,
      successRateBonus: 10
    },
    isActive: true
  },
  {
    id: 'clutch_serve',
    name: 'クラッチサーブ',
    description: '重要な場面でのサーブが決まりやすい',
    category: 'serve',
    rarity: 'epic',
    effects: {
      serveBonus: 8,
      breakPointBonus: 20,
      setPointBonus: 15,
      matchPointBonus: 25
    },
    isActive: true
  },

  // リターン系
  {
    id: 'return_specialist',
    name: 'リターンスペシャリスト',
    description: 'リターンの精度が向上する',
    category: 'receive',
    rarity: 'common',
    effects: {
      receiveBonus: 12,
      errorReduction: 10
    },
    isActive: true
  },
  {
    id: 'break_hunter',
    name: 'ブレークハンター',
    description: 'ブレークチャンスでのリターンが強化される',
    category: 'receive',
    rarity: 'rare',
    effects: {
      receiveBonus: 8,
      breakPointBonus: 18,
      successRateBonus: 5
    },
    isActive: true
  },
  {
    id: 'counter_puncher',
    name: 'カウンターパンチャー',
    description: '劣勢時にリターンで逆転を狙う',
    category: 'receive',
    rarity: 'epic',
    effects: {
      receiveBonus: 10,
      behindBonus: 20,
      criticalRate: 12
    },
    isActive: true
  },

  // ボレー系
  {
    id: 'net_master',
    name: 'ネットマスター',
    description: 'ネットプレーが得意になる',
    category: 'volley',
    rarity: 'common',
    effects: {
      volleyBonus: 15,
      criticalRate: 6
    },
    isActive: true
  },
  {
    id: 'volley_artist',
    name: 'ボレーアーティスト',
    description: '華麗なボレーでポイントを決める',
    category: 'volley',
    rarity: 'rare',
    effects: {
      volleyBonus: 12,
      criticalRate: 18,
      successRateBonus: 8
    },
    isActive: true
  },
  {
    id: 'pressure_volley',
    name: 'プレッシャーボレー',
    description: '重要な場面でのボレーが決まりやすい',
    category: 'volley',
    rarity: 'epic',
    effects: {
      volleyBonus: 10,
      tiebreakBonus: 15,
      setPointBonus: 12,
      criticalRate: 10
    },
    isActive: true
  },

  // ストローク系
  {
    id: 'baseline_power',
    name: 'ベースラインパワー',
    description: 'ベースラインからの攻撃力が向上',
    category: 'stroke',
    rarity: 'common',
    effects: {
      strokeBonus: 12,
      criticalRate: 8
    },
    isActive: true
  },
  {
    id: 'rally_master',
    name: 'ラリーマスター',
    description: '長いラリーでの持久力が優秀',
    category: 'stroke',
    rarity: 'rare',
    effects: {
      strokeBonus: 10,
      staminaBonus: 8,
      errorReduction: 12
    },
    isActive: true
  },
  {
    id: 'winner_machine',
    name: 'ウィナーマシーン',
    description: 'ストロークでのウィナーを量産する',
    category: 'stroke',
    rarity: 'epic',
    effects: {
      strokeBonus: 15,
      criticalRate: 20,
      successRateBonus: 6
    },
    isActive: true
  },

  // メンタル系
  {
    id: 'mental_strength',
    name: 'メンタルストレングス',
    description: '精神的な強さでプレッシャーに負けない',
    category: 'mental',
    rarity: 'common',
    effects: {
      mentalBonus: 15,
      errorReduction: 8
    },
    isActive: true
  },
  {
    id: 'clutch_player',
    name: 'クラッチプレイヤー',
    description: '重要な場面で真価を発揮する',
    category: 'mental',
    rarity: 'rare',
    effects: {
      mentalBonus: 10,
      breakPointBonus: 12,
      setPointBonus: 15,
      matchPointBonus: 20
    },
    isActive: true
  },
  {
    id: 'ice_cold',
    name: 'アイスコールド',
    description: '極限の集中状態で冷静にプレーする',
    category: 'mental',
    rarity: 'legendary',
    effects: {
      mentalBonus: 20,
      errorReduction: 20,
      tiebreakBonus: 25,
      matchPointBonus: 30
    },
    isActive: true
  },

  // スタミナ系
  {
    id: 'endurance',
    name: 'エンデュランス',
    description: '持久力に優れ疲れにくい',
    category: 'stamina',
    rarity: 'common',
    effects: {
      staminaBonus: 20
    },
    isActive: true
  },
  {
    id: 'second_wind',
    name: 'セカンドウィンド',
    description: '疲労時に回復力を発揮する',
    category: 'stamina',
    rarity: 'rare',
    effects: {
      staminaBonus: 15,
      behindBonus: 8
    },
    isActive: true
  },
  {
    id: 'iron_will',
    name: 'アイアンウィル',
    description: '鉄の意志で最後まで戦い抜く',
    category: 'stamina',
    rarity: 'epic',
    effects: {
      staminaBonus: 25,
      mentalBonus: 10,
      matchPointBonus: 15
    },
    isActive: true
  }
];

// 特殊能力をランダムに選択する関数
export function getRandomAbilities(count: number = 3): SpecialAbility[] {
  const abilities = [...SPECIAL_ABILITIES];
  const selected: SpecialAbility[] = [];
  
  // レアリティ別の重み付け
  const rarityWeights: Record<string, number> = {
    common: 50,
    rare: 30,
    epic: 15,
    legendary: 5
  };
  
  for (let i = 0; i < count && abilities.length > 0; i++) {
    // レアリティに基づいた重み付け抽選
    const weightedAbilities = abilities.map(ability => ({
      ability,
      weight: rarityWeights[ability.rarity] || 10
    }));
    
    const totalWeight = weightedAbilities.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    let selectedAbility: SpecialAbility | undefined;
    for (const item of weightedAbilities) {
      random -= item.weight;
      if (random <= 0) {
        selectedAbility = item.ability;
        break;
      }
    }
    
    if (selectedAbility) {
      selected.push(selectedAbility);
      // 選択された能力を除去して重複を防ぐ
      const index = abilities.findIndex(a => a.id === selectedAbility!.id);
      if (index > -1) {
        abilities.splice(index, 1);
      }
    }
  }
  
  return selected;
}

// 特殊能力の効果を計算する関数
export function calculateAbilityEffects(
  abilities: SpecialAbility[],
  situation?: {
    isBreakPoint?: boolean;
    isSetPoint?: boolean;
    isMatchPoint?: boolean;
    isTiebreak?: boolean;
    isBehind?: boolean;
    isAhead?: boolean;
  }
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
} {
  let totalEffects = {
    serveBonus: 0,
    receiveBonus: 0,
    volleyBonus: 0,
    strokeBonus: 0,
    mentalBonus: 0,
    staminaBonus: 0,
    criticalRate: 0,
    errorReduction: 0,
    successRateBonus: 0
  };
  
  abilities.forEach(ability => {
    if (!ability.isActive) return;
    
    const effects = ability.effects;
    
    // 基本効果を適用
    totalEffects.serveBonus += effects.serveBonus || 0;
    totalEffects.receiveBonus += effects.receiveBonus || 0;
    totalEffects.volleyBonus += effects.volleyBonus || 0;
    totalEffects.strokeBonus += effects.strokeBonus || 0;
    totalEffects.mentalBonus += effects.mentalBonus || 0;
    totalEffects.staminaBonus += effects.staminaBonus || 0;
    totalEffects.criticalRate += effects.criticalRate || 0;
    totalEffects.errorReduction += effects.errorReduction || 0;
    totalEffects.successRateBonus += effects.successRateBonus || 0;
    
    // 状況別効果を適用
    if (situation) {
      if (situation.isBreakPoint && effects.breakPointBonus) {
        totalEffects.successRateBonus += effects.breakPointBonus;
      }
      if (situation.isSetPoint && effects.setPointBonus) {
        totalEffects.successRateBonus += effects.setPointBonus;
      }
      if (situation.isMatchPoint && effects.matchPointBonus) {
        totalEffects.successRateBonus += effects.matchPointBonus;
      }
      if (situation.isTiebreak && effects.tiebreakBonus) {
        totalEffects.successRateBonus += effects.tiebreakBonus;
      }
      if (situation.isBehind && effects.behindBonus) {
        totalEffects.successRateBonus += effects.behindBonus;
      }
      if (situation.isAhead && effects.leadBonus) {
        totalEffects.successRateBonus += effects.leadBonus;
      }
    }
  });
  
  return totalEffects;
}