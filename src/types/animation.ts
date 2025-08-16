// アニメーション関連の型定義

export type AnimationType = 
  | 'serve_ace'         // サービスエース
  | 'power_serve'       // パワーサーブ
  | 'return_winner'     // リターンウィナー
  | 'volley_smash'      // ボレースマッシュ
  | 'stroke_winner'     // ストロークウィナー
  | 'rally_epic'        // 長いラリー
  | 'mental_break'      // メンタル崩壊
  | 'comeback_moment'   // 逆転の瞬間
  | 'instruction_effect' // 監督指示効果発動
  | 'special_ability'   // 特殊能力発動
  | 'normal_point'      // 通常ポイント
  | 'error';            // エラー

export interface CameraMove {
  startPosition: { x: number; y: number; z: number };
  endPosition: { x: number; y: number; z: number };
  duration: number;
  easing?: string;
}

export interface ParticleConfig {
  type: 'spark' | 'trail' | 'explosion' | 'glow' | 'sweat';
  count: number;
  color: string;
  duration: number;
  size?: number;
  velocity?: { x: number; y: number };
}

export interface AnimationConfig {
  duration: number;           // アニメーション時間(ms)
  skipAllowed: boolean;       // スキップ可能か
  soundEffect?: string;       // 効果音ファイル名
  cameraMovement?: CameraMove; // カメラワーク
  particleEffect?: ParticleConfig; // パーティクル
  autoNext?: boolean;         // 自動で次に進むか
  pauseAfter?: number;        // 終了後の待機時間(ms)
}

export interface AnimationSequenceStep {
  type: string;
  duration: number;
  delay?: number;
  config?: Partial<AnimationConfig>;
}

export interface AnimationTemplate {
  sequence: AnimationSequenceStep[];
  totalDuration: number;
  skippable: boolean;
  category: 'point' | 'instruction' | 'result' | 'transition';
}

// ポイントアニメーションデータ
export interface PointAnimationData {
  type: AnimationType;
  template: AnimationTemplate;
  playerAnimations: {
    home: PlayerAnimationData;
    away: PlayerAnimationData;
  };
  ballAnimation?: BallAnimationData;
  effectAnimations?: EffectAnimationData[];
  resultAnimation: ResultAnimationData;
}

export interface PlayerAnimationData {
  position: { x: number; y: number };
  action: PlayerAction;
  emotion: PlayerEmotion;
  duration: number;
  particleEffect?: ParticleConfig;
}

export type PlayerAction = 
  | 'serve' | 'return' | 'volley' | 'stroke' 
  | 'run' | 'celebrate' | 'disappointed' 
  | 'focus' | 'tired' | 'angry' | 'confident';

export type PlayerEmotion = 
  | 'neutral' | 'focused' | 'excited' | 'frustrated' 
  | 'confident' | 'tired' | 'surprised' | 'victorious';

export interface BallAnimationData {
  trajectory: { x: number; y: number; time: number }[];
  speed: 'slow' | 'medium' | 'fast' | 'ultra_fast';
  spin: 'none' | 'topspin' | 'slice' | 'sidespin';
  effect?: 'normal' | 'burning' | 'electric' | 'rainbow';
}

export interface EffectAnimationData {
  type: 'impact' | 'power' | 'speed' | 'precision' | 'mental';
  position: { x: number; y: number };
  config: ParticleConfig;
}

export interface ResultAnimationData {
  message: string;
  type: 'point_won' | 'game_won' | 'set_won' | 'match_won' | 'error' | 'normal';
  duration: number;
  style: 'popup' | 'slide' | 'fade' | 'explosion';
  color?: string;
}

// 監督指示アニメーション
export interface InstructionAnimationData {
  instructionName: string;
  category: 'offensive' | 'defensive' | 'mental' | 'stamina' | 'tactical' | 'emergency';
  effect: InstructionEffectAnimation;
  playerReaction: PlayerAnimationData;
}

export interface InstructionEffectAnimation {
  type: 'aura' | 'buff' | 'focus' | 'energy' | 'strategy';
  color: string;
  intensity: number;
  duration: number;
  particles?: ParticleConfig;
}

// アニメーション制御インターface
export interface AnimationController {
  currentAnimation: PointAnimationData | null;
  isPlaying: boolean;
  canSkip: boolean;
  progress: number; // 0-1
  speed: number;    // 0.5-3.0 (倍速)
}

// アニメーション設定
export interface AnimationSettings {
  enableAnimations: boolean;
  animationSpeed: number;       // 1.0 = 通常, 2.0 = 2倍速
  skipNonCritical: boolean;     // 重要でないアニメをスキップ
  particleEffects: boolean;     // パーティクル効果の有効/無効
  soundEffects: boolean;        // 効果音の有効/無効
  cameraEffects: boolean;       // カメラエフェクトの有効/無効
  autoSkipAfter: number;        // 自動スキップまでの時間(ms, 0で無効)
}