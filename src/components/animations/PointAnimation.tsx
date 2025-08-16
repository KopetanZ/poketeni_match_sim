// ポイントアニメーション表示コンポーネント

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PointAnimationData, AnimationController, PlayerAction, PlayerEmotion } from '@/types/animation';

interface PointAnimationProps {
  animationData: PointAnimationData;
  onAnimationComplete: () => void;
  onSkip: () => void;
  controller: AnimationController;
  className?: string;
}

export default function PointAnimation({
  animationData,
  onAnimationComplete,
  onSkip,
  controller,
  className = ''
}: PointAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const animationRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const { template, playerAnimations, ballAnimation, effectAnimations, resultAnimation } = animationData;

  useEffect(() => {
    if (!isPlaying || currentStep >= template.sequence.length) {
      if (currentStep >= template.sequence.length) {
        onAnimationComplete();
      }
      return;
    }

    const currentSequence = template.sequence[currentStep];
    const adjustedDuration = currentSequence.duration / controller.speed;

    timeoutRef.current = setTimeout(() => {
      setCurrentStep(prev => prev + 1);
    }, adjustedDuration);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentStep, isPlaying, controller.speed, template.sequence, onAnimationComplete]);

  const handleSkip = () => {
    if (controller.canSkip && template.skippable) {
      setIsPlaying(false);
      setCurrentStep(template.sequence.length);
      onSkip();
    }
  };

  const progress = currentStep / template.sequence.length;
  const currentSequence = template.sequence[currentStep];

  return (
    <div className={`relative w-full h-full overflow-hidden bg-gradient-to-b from-sky-200 to-green-300 ${className}`}>
      {/* テニスコート背景 */}
      <TennisCourtBackground />

      {/* プレイヤーアニメーション */}
      <AnimatePresence>
        <PlayerAnimationComponent
          key="home-player"
          playerData={playerAnimations.home}
          position="home"
          currentStep={currentSequence?.type || 'idle'}
          speed={controller.speed}
        />
        <PlayerAnimationComponent
          key="away-player"
          playerData={playerAnimations.away}
          position="away"
          currentStep={currentSequence?.type || 'idle'}
          speed={controller.speed}
        />
      </AnimatePresence>

      {/* ボールアニメーション */}
      {ballAnimation && (
        <BallAnimationComponent
          ballData={ballAnimation}
          currentStep={currentSequence?.type || 'idle'}
          speed={controller.speed}
        />
      )}

      {/* エフェクトアニメーション */}
      {effectAnimations && effectAnimations.map((effect, index) => (
        <EffectAnimationComponent
          key={`effect-${index}`}
          effectData={effect}
          isActive={currentStep > index}
          speed={controller.speed}
        />
      ))}

      {/* 結果表示 */}
      {currentStep >= template.sequence.length - 1 && (
        <ResultAnimationComponent
          resultData={resultAnimation}
          speed={controller.speed}
        />
      )}

      {/* コントロールUI */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center z-20">
        {/* 進行状況バー */}
        <div className="flex-1 mx-4">
          <div className="w-full bg-black/20 rounded-full h-2">
            <motion.div
              className="bg-white h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <div className="text-white text-xs mt-1 text-center">
            {currentSequence?.type || 'Loading...'} ({Math.round(progress * 100)}%)
          </div>
        </div>

        {/* スキップボタン */}
        {controller.canSkip && template.skippable && (
          <button
            onClick={handleSkip}
            className="bg-black/50 text-white px-4 py-2 rounded-lg hover:bg-black/70 transition-colors text-sm"
          >
            スキップ
          </button>
        )}

        {/* 速度表示 */}
        <div className="bg-black/50 text-white px-2 py-1 rounded text-xs">
          {controller.speed}x
        </div>
      </div>

      {/* デバッグ情報（開発時のみ） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 right-4 bg-black/70 text-white p-2 rounded text-xs">
          <div>Type: {animationData.type}</div>
          <div>Step: {currentStep + 1}/{template.sequence.length}</div>
          <div>Current: {currentSequence?.type}</div>
          <div>Duration: {currentSequence?.duration}ms</div>
        </div>
      )}
    </div>
  );
}

// テニスコート背景コンポーネント
function TennisCourtBackground() {
  return (
    <div className="absolute inset-0">
      {/* コートベース */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-400 via-green-400 to-green-500" />
      
      {/* コートライン */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300">
        {/* 外枠 */}
        <rect
          x="50" y="50" width="300" height="200"
          fill="none" stroke="white" strokeWidth="2"
        />
        
        {/* センターライン */}
        <line x1="200" y1="50" x2="200" y2="250" stroke="white" strokeWidth="1" />
        
        {/* サービスボックス */}
        <line x1="50" y1="125" x2="350" y2="125" stroke="white" strokeWidth="1" />
        <line x1="50" y1="175" x2="350" y2="175" stroke="white" strokeWidth="1" />
        <line x1="125" y1="125" x2="125" y2="175" stroke="white" strokeWidth="1" />
        <line x1="275" y1="125" x2="275" y2="175" stroke="white" strokeWidth="1" />
        
        {/* ネット */}
        <line x1="50" y1="150" x2="350" y2="150" stroke="white" strokeWidth="3" />
      </svg>
    </div>
  );
}

// プレイヤーアニメーション
function PlayerAnimationComponent({
  playerData,
  position,
  currentStep,
  speed
}: {
  playerData: {
    action: PlayerAction;
    emotion: PlayerEmotion;
    position?: { x: number; y: number };
  };
  position: 'home' | 'away';
  currentStep: string;
  speed: number;
}) {
  const baseX = position === 'home' ? 200 : 200; // センター基準
  const baseY = position === 'home' ? 220 : 80;   // 上下のポジション

  return (
    <motion.div
      className="absolute z-10"
      initial={{ x: baseX, y: baseY, scale: 1 }}
      animate={{
        x: baseX + (playerData.position?.x || 0),
        y: baseY + (playerData.position?.y || 0),
        scale: getActionScale(playerData.action),
        rotate: getActionRotation(playerData.action)
      }}
      transition={{ duration: 0.5 / speed }}
    >
      {/* プレイヤースプライト */}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl
        ${position === 'home' ? 'bg-blue-500' : 'bg-red-500'}
        ${getEmotionBorder(playerData.emotion)}`}>
        {getActionEmoji(playerData.action)}
      </div>
      
      {/* アクションエフェクト */}
      <AnimatePresence>
        {shouldShowActionEffect(currentStep) && (
          <motion.div
            className="absolute -top-2 -left-2 w-16 h-16 pointer-events-none"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.3 / speed }}
          >
            <div className={`w-full h-full rounded-full ${getActionEffectClass(playerData.action)}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ボールアニメーション
function BallAnimationComponent({
  ballData,
  currentStep,
  speed
}: {
  ballData: any;
  currentStep: string;
  speed: number;
}) {
  if (!shouldShowBall(currentStep)) return null;

  return (
    <motion.div
      className="absolute z-15 w-4 h-4 bg-yellow-300 rounded-full shadow-lg"
      initial={{ x: 100, y: 150, scale: 1 }}
      animate={{
        x: getBallPosition(currentStep).x,
        y: getBallPosition(currentStep).y,
        scale: getBallScale(currentStep)
      }}
      transition={{ 
        duration: 0.8 / speed,
        ease: "easeOut"
      }}
    >
      {/* ボールエフェクト */}
      <div className={`absolute inset-0 rounded-full ${getBallEffect(ballData.effect)}`} />
    </motion.div>
  );
}

// エフェクトアニメーション
function EffectAnimationComponent({
  effectData,
  isActive,
  speed
}: {
  effectData: any;
  isActive: boolean;
  speed: number;
}) {
  if (!isActive) return null;

  return (
    <motion.div
      className="absolute pointer-events-none z-20"
      style={{
        left: effectData.position.x,
        top: effectData.position.y
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.5 / speed }}
    >
      <div className={`w-8 h-8 ${getEffectClass(effectData.type)}`} />
    </motion.div>
  );
}

// 結果表示アニメーション
function ResultAnimationComponent({
  resultData,
  speed
}: {
  resultData: any;
  speed: number;
}) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-30"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 / speed }}
    >
      <div className={`text-4xl font-bold text-center p-4 rounded-lg
        ${getResultStyle(resultData.type)}`}>
        {resultData.message}
      </div>
    </motion.div>
  );
}

// ヘルパー関数群
function getActionEmoji(action: any): string {
  const emojiMap: Record<string, string> = {
    serve: '🎾', return: '🔄', volley: '⚡', stroke: '💨',
    run: '🏃', celebrate: '🎉', disappointed: '😞', focus: '🎯',
    tired: '😮‍💨', angry: '😠', confident: '😤'
  };
  return emojiMap[action] || '🎾';
}

function getActionScale(action: any): number {
  const scaleMap: Record<string, number> = {
    serve: 1.2, volley: 1.3, stroke: 1.1
  };
  return scaleMap[action] || 1.0;
}

function getActionRotation(action: any): number {
  const rotationMap: Record<string, number> = {
    serve: -10, volley: -5, stroke: 10
  };
  return rotationMap[action] || 0;
}

function getEmotionBorder(emotion: any): string {
  const borderMap: Record<string, string> = {
    excited: 'ring-4 ring-yellow-400',
    frustrated: 'ring-4 ring-red-400',
    confident: 'ring-4 ring-green-400',
    tired: 'ring-4 ring-gray-400',
    surprised: 'ring-4 ring-blue-400',
    victorious: 'ring-4 ring-gold-400'
  };
  return borderMap[emotion] || '';
}

function shouldShowActionEffect(step: string): boolean {
  const effectSteps = ['serve_motion', 'volley_execution', 'winner_stroke', 'power_serve'];
  return effectSteps.some(s => step.includes(s));
}

function getActionEffectClass(action: any): string {
  const effectMap: Record<string, string> = {
    serve: 'bg-yellow-400/50 animate-ping',
    volley: 'bg-blue-400/50 animate-pulse',
    stroke: 'bg-green-400/50 animate-bounce'
  };
  return effectMap[action] || 'bg-white/30 animate-pulse';
}

function shouldShowBall(step: string): boolean {
  const ballSteps = ['ball_trajectory', 'serve_motion', 'return_execution'];
  return ballSteps.some(s => step.includes(s));
}

function getBallPosition(step: string): { x: number; y: number } {
  // 簡略版の位置計算
  if (step.includes('serve')) return { x: 200, y: 80 };
  if (step.includes('return')) return { x: 200, y: 220 };
  return { x: 200, y: 150 };
}

function getBallScale(step: string): number {
  return step.includes('trajectory') ? 1.5 : 1.0;
}

function getBallEasing(speed: string): string {
  const easingMap: Record<string, string> = {
    slow: 'easeOut',
    medium: 'easeInOut',
    fast: 'easeIn',
    ultra_fast: 'linear'
  };
  return easingMap[speed] || 'easeInOut';
}

function getBallEffect(effect: string): string {
  const effectMap: Record<string, string> = {
    burning: 'shadow-lg shadow-red-500/50',
    electric: 'shadow-lg shadow-blue-500/50',
    rainbow: 'shadow-lg shadow-purple-500/50'
  };
  return effectMap[effect] || '';
}

function getEffectClass(type: string): string {
  const effectMap: Record<string, string> = {
    impact: 'bg-orange-500 rounded-full animate-ping',
    power: 'bg-red-500 rounded-full animate-pulse',
    speed: 'bg-blue-500 rounded-full animate-bounce',
    precision: 'bg-green-500 rounded-full animate-spin'
  };
  return effectMap[type] || 'bg-white rounded-full animate-pulse';
}

function getResultStyle(type: string): string {
  const styleMap: Record<string, string> = {
    point_won: 'bg-green-500 text-white',
    game_won: 'bg-blue-500 text-white',
    set_won: 'bg-purple-500 text-white',
    match_won: 'bg-gold-500 text-white',
    error: 'bg-red-500 text-white',
    normal: 'bg-gray-500 text-white'
  };
  return styleMap[type] || 'bg-gray-500 text-white';
}