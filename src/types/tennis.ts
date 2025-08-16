// テニスシミュレータ用型定義

// ===== プレイヤー関連 =====

export interface TennisPlayer {
  id: string;
  pokemon_name: string;
  pokemon_id: number;
  
  // テニススキル
  stats: {
    serve: number;      // サーブ力 0-100
    receive: number;    // リターン力 0-100
    volley: number;     // ボレー力 0-100
    stroke: number;     // ストローク力 0-100
    mental: number;     // メンタル 0-100
    stamina: number;    // スタミナ 0-100
  };
  
  // 試合中の状態
  current_stamina: number;
  current_mental: number;
  
  // 特殊能力
  special_abilities: SpecialAbility[];
  
  // 演出用
  pokemon_sprite: string;
  types: string[];
}

// ===== 特殊能力 =====

export type AbilityCategory = 
  | 'serve'        // サーブ系
  | 'receive'      // リターン系
  | 'volley'       // ボレー系
  | 'stroke'       // ストローク系
  | 'mental'       // メンタル系
  | 'stamina';     // スタミナ系

export type AbilityRarity = 
  | 'common'       // よくある
  | 'rare'         // レア
  | 'epic'         // エピック
  | 'legendary';   // レジェンダリー

export interface SpecialAbility {
  id: string;
  name: string;
  description: string;
  category: AbilityCategory;
  rarity: AbilityRarity;
  effects: {
    // 基本能力値への影響
    serveBonus?: number;
    receiveBonus?: number;
    volleyBonus?: number;
    strokeBonus?: number;
    mentalBonus?: number;
    staminaBonus?: number;
    
    // 特殊効果
    criticalRate?: number;        // クリティカル率向上%
    errorReduction?: number;      // エラー率軽減%
    successRateBonus?: number;    // 成功率ボーナス%
    
    // 状況別効果
    breakPointBonus?: number;     // ブレークポイント時ボーナス
    setPointBonus?: number;       // セットポイント時ボーナス
    matchPointBonus?: number;     // マッチポイント時ボーナス
    tiebreakBonus?: number;       // タイブレーク時ボーナス
    behindBonus?: number;         // 劣勢時ボーナス
    leadBonus?: number;           // 優勢時ボーナス
  };
  isActive: boolean;
}

// ===== 介入システム =====

export type InterventionSituation = 
  | 'break_point_against'   // 相手のブレークポイント（ピンチ）
  | 'break_point_for'       // 自分のブレークポイント（チャンス）
  | 'set_point_against'     // 相手のセットポイント（ピンチ）
  | 'set_point_for'         // 自分のセットポイント（チャンス）
  | 'match_point_against'   // 相手のマッチポイント（ピンチ）
  | 'match_point_for'       // 自分のマッチポイント（チャンス）
  | 'tiebreak'              // タイブレーク
  | 'momentum_shift'        // 流れが変わりそうな場面
  | 'stamina_low'           // スタミナ不足の危険
  | 'mental_pressure';      // メンタル的プレッシャー

export interface InterventionOpportunity {
  type: 'crisis' | 'chance';
  situation: InterventionSituation;
  urgency: number;      // 緊急度 0-100
  description: string;
}

// ===== 監督指示 =====

export type InstructionCategory = 
  | 'offensive'      // 攻撃系
  | 'defensive'      // 守備系  
  | 'mental'         // メンタル系
  | 'stamina'        // スタミナ系
  | 'tactical'       // 戦術系
  | 'emergency';     // 緊急系

export type InstructionEffectiveness = 
  | 'basic'          // 基本効果（成功率80%）
  | 'advanced'       // 高度効果（成功率65%）
  | 'risky'          // リスキー効果（成功率50%、効果大）
  | 'emergency';     // 緊急効果（成功率40%、効果特大）

export interface CoachInstruction {
  id: string;
  name: string;
  description: string;
  category: InstructionCategory;
  effectiveness: InstructionEffectiveness;
  
  effects: {
    serveBonus?: number;
    receiveBonus?: number;
    volleyBonus?: number;
    strokeBonus?: number;
    mentalBonus?: number;
    staminaBonus?: number;
    
    criticalRate?: number;
    errorReduction?: number;
    successRateBonus?: number;
    
    opponentPressure?: number;
    opponentConcentrationBreak?: number;
    
    duration: number;         // 効果持続ポイント数（1-2）
    situationRequirements?: InterventionSituation[];
  };
  
  successRate: number;       // 基本成功率
  successMultiplier: number; // 成功時の効果倍率
  failurePenalty: number;    // 失敗時のペナルティ
  
  animationType: string;
  iconPath: string;
}

// ===== 試合進行 =====

export interface MatchConfig {
  id: string;
  setsToWin: number;              // デフォルト: 2（3セットマッチ）
  gamesPerSet: number;            // デフォルト: 6
  enableTiebreak: boolean;        // デフォルト: true
  coachBudget: number;            // デフォルト: 3（試合全体で3回まで介入可能）
  enableCoachSystem: boolean;     // デフォルト: true
  instructionPoolSize: number;    // デフォルト: 10（全指示数）
  instructionChoices: number;     // デフォルト: 5（ユーザーに提示される選択肢数）
}

export interface MatchState {
  // 基本状態
  homePlayer: TennisPlayer;
  awayPlayer: TennisPlayer;
  config: MatchConfig;
  
  // スコア
  sets: { home: number; away: number }[];
  currentSet: { home: number; away: number };
  currentGame: string; // "0-0", "15-0", "30-15", etc.
  currentServer: 'home' | 'away';
  
  // 監督介入
  coachBudgetRemaining: number;
  usedInstructions: string[];
  activeInstructionEffects: {
    instructionId: string;
    effects: any;
    remainingPoints: number;
  }[];
  lastInterventionPoint: number; // 最後に介入したポイント番号
  
  // 状態
  isMatchComplete: boolean;
  winner?: 'home' | 'away';
  currentPointNumber: number;
}

export type PointWinReason = 
  | 'ace'              // サービスエース
  | 'service_winner'   // サービスウィナー
  | 'return_winner'    // リターンウィナー
  | 'volley_winner'    // ボレーウィナー
  | 'stroke_winner'    // ストロークウィナー
  | 'opponent_error'   // 相手のエラー
  | 'mental_break';    // メンタル崩壊

export interface PointResult {
  winner: 'home' | 'away';
  reason: PointWinReason;
  description: string;
  wasInfluencedByInstruction: boolean;
  wasSpecialAbilityTriggered?: boolean;
  
  // 計算詳細
  homeAttack: number;
  awayAttack: number;
  homeDefense: number;
  awayDefense: number;
  successRate: number;
  roll: number;
  
  // アニメーション関連
  rallyLength?: number;
  isComeback?: boolean;
  intensity?: number;
  animationTemplate?: string | null;
}

export interface MatchResult {
  winner: 'home' | 'away';
  finalScore: { home: number; away: number };
  sets: { home: number; away: number }[];
  duration: number; // 分
  totalPoints: { home: number; away: number };
  interventionsUsed: number;
  mvp?: 'home' | 'away';
}