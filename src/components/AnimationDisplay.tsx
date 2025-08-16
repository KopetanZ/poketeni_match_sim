// アニメーション表示コンポーネント

'use client';

import { useState, useEffect } from 'react';
import { AnimationEngine } from '@/lib/animationEngine';
import { getAnimationTemplate } from '@/lib/animationTemplateData';
import { PointResult } from '@/types/tennis';
import { AnimationController } from '@/types/animation';

interface AnimationDisplayProps {
  pointResult: PointResult | null;
  onAnimationComplete: () => void;
  isEnabled: boolean;
}

export default function AnimationDisplay({ 
  pointResult, 
  onAnimationComplete, 
  isEnabled 
}: AnimationDisplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationEngine, setAnimationEngine] = useState<AnimationEngine | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('');
  
  // アニメーションコントローラー（速度をさらに遅くして見やすく）
  const animationController: AnimationController = {
    currentAnimation: null,
    isPlaying: isPlaying,
    canSkip: true,
    progress: 0,
    speed: 0.15 // 0.15倍速で約3倍の時間をかける
  };

  useEffect(() => {
    if (!pointResult || !isEnabled || !pointResult.animationTemplate) {
      // アニメーションテンプレートがない場合は即座に完了
      if (pointResult && !pointResult.animationTemplate) {
        onAnimationComplete();
      }
      return;
    }

    const template = getAnimationTemplate(pointResult.animationTemplate);
    if (!template) {
      console.warn(`Animation template not found: ${pointResult.animationTemplate}`);
      onAnimationComplete();
      return;
    }

    // カスタマイズされたテンプレート生成
    const customTemplate = {
      ...template,
      timeline: template.timeline.map(action => {
        // UIカットインのテキストをカスタマイズ
        if (action.action === 'ui_cutin') {
          let text = action.params.text;
          
          switch (pointResult.reason) {
            case 'ace':
              text = 'ACE!';
              break;
            case 'service_winner':
              text = 'SERVICE WINNER!';
              break;
            case 'return_winner':
              text = 'RETURN WINNER!';
              break;
            case 'volley_winner':
              text = 'VOLLEY WINNER!';
              break;
            case 'stroke_winner':
              text = 'WINNER!';
              break;
            case 'opponent_error':
              text = 'ERROR!';
              break;
            default:
              text = 'POINT!';
          }
          
          return {
            ...action,
            params: { ...action.params, text }
          };
        }
        return action;
      })
    };

    setIsPlaying(true);
    
    const engine = new AnimationEngine(
      animationController, 
      () => {
        setIsPlaying(false);
        setCurrentStep('');
        onAnimationComplete();
      },
      (step: string) => {
        setCurrentStep(step);
      }
    );
    
    setAnimationEngine(engine);
    engine.executeAnimation(customTemplate);

  }, [pointResult, isEnabled, onAnimationComplete]);

  const handleSkip = () => {
    if (animationEngine && animationController.canSkip) {
      animationEngine.skipAnimation();
    }
  };

  if (!isEnabled || !pointResult || !pointResult.animationTemplate) {
    return null;
  }

  return (
    <div className="animation-display">
      {/* 背景オーバーレイは削除 */}

      {/* アニメーション用のオーバーレイコンテナ */}
      <div className="animation-container fixed inset-0 pointer-events-none z-40">
        {/* ボールトレイル用の要素 */}
        <div className="ball-trail absolute inset-0" />
        
        {/* プレイヤー要素のマーカー（アニメーション対象） */}
        <div className="player-winner absolute" />
        <div className="player-home absolute" />
        <div className="player-away absolute" />
        
        {/* 中央フラッシュエフェクト */}
        <div className="center-flash absolute inset-0 flex items-center justify-center" />
      </div>

      {/* デバッグ表示は削除 */}

      {/* スキップボタン */}
      {isPlaying && animationController.canSkip && (
        <button
          onClick={handleSkip}
          className="fixed bottom-4 right-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg hover:bg-opacity-70 transition-colors z-50 pointer-events-auto"
        >
          スキップ
        </button>
      )}
    </div>
  );
}

// ステップ表示名の変換
function getStepDisplayName(step: string): string {
  const stepNames: Record<string, string> = {
    'play_trail': '🌟 トレイル効果',
    'spawn_particles': '✨ パーティクル生成',
    'play_sound': '🔊 効果音再生',
    'camera_shake': '📱 カメラシェイク',
    'camera_zoom': '🔍 カメラズーム',
    'ui_cutin': '📢 カットイン表示',
    'ui_flash': '⚡ フラッシュ効果',
    'ui_score_bump': '📊 スコア演出',
    'player_highlight': '👤 プレイヤー強調',
    'player_glow': '✨ プレイヤー発光',
    'screen_pulse': '💥 画面パルス',
    'vibrate': '📳 振動効果',
    'crowd_pop': '👏 観客反応'
  };
  
  return stepNames[step] || step;
}