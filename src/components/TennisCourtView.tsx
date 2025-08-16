// 2D描画による3D風テニスコート表示システム

'use client';

import { useEffect, useRef, useState } from 'react';
import { RallySequence, RallyShot } from '@/lib/rallyGenerator';
import { TennisPlayer, DetailedPointResult } from '@/types/tennis';
import { useGameAudio } from '@/hooks/useGameAudio';

interface TennisCourtViewProps {
  rallySequence: RallySequence | null;
  homePlayer: TennisPlayer;
  awayPlayer: TennisPlayer;
  onRallyComplete?: () => void;
  isPlaying: boolean;
  setRallyPlaying?: (playing: boolean) => void;
  detailedResult?: DetailedPointResult | null; // 詳細ポイント結果
}

interface PlayerPosition {
  x: number;
  y: number;
  isMoving: boolean;
  targetX: number;
  targetY: number;
}

interface BallPosition {
  x: number;
  y: number;
  z: number; // 高さ（0-1）
  isVisible: boolean;
  trail: { x: number; y: number }[]; // ボールの軌跡
}

interface SpecialAnimation {
  type: 'net_hit' | 'out_bounce' | 'missed_ball' | 'ace_effect' | 'normal' | null;
  isActive: boolean;
  progress: number; // 0-1
  netHitPosition?: { x: number; y: number };
  outBouncePosition?: { x: number; y: number };
  ballPassPosition?: { x: number; y: number };
  acePosition?: { x: number; y: number };
  intensity?: number;
}

export default function TennisCourtView({
  rallySequence,
  homePlayer,
  awayPlayer,
  onRallyComplete,
  isPlaying,
  setRallyPlaying,
  detailedResult
}: TennisCourtViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  
  // ゲーム音響管理
  const { playRallyHit, playBallBounce, playAceAudio } = useGameAudio();
  
  const [currentShotIndex, setCurrentShotIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(true); // デバッグ用
  const [isAutoPlaying, setIsAutoPlaying] = useState(false); // 自動連続再生モード
  const pausedRef = useRef(false); // useRefで状態を管理
  const autoPlayRef = useRef(false); // 自動再生状態を管理
  const [homePosition, setHomePosition] = useState<PlayerPosition>({
    x: 0.5, y: 0.9, isMoving: false, targetX: 0.5, targetY: 0.9
  });
  const [awayPosition, setAwayPosition] = useState<PlayerPosition>({
    x: 0.5, y: 0.1, isMoving: false, targetX: 0.5, targetY: 0.1
  });
  const [ballPosition, setBallPosition] = useState<BallPosition>({
    x: 0.5, y: 0.5, z: 0, isVisible: false, trail: []
  });
  const [isTransitioning, setIsTransitioning] = useState(false); // ショット間のトランジション状態
  
  // 特殊アニメーション管理
  const [specialAnimation, setSpecialAnimation] = useState<SpecialAnimation>({
    type: null,
    isActive: false,
    progress: 0
  });
  
  // キャンバスサイズ
  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 800;
  
  // 3D風変換関数
  const convertTo3D = (x: number, y: number): { x: number; y: number } => {
    // パースペクティブ変換：奥（y=0）を狭く、手前（y=1）を広く
    const perspective = 0.3 + y * 0.7; // 0.3-1.0の範囲
    const centerX = CANVAS_WIDTH / 2;
    const transformedX = centerX + (x - 0.5) * CANVAS_WIDTH * perspective;
    const transformedY = y * CANVAS_HEIGHT;
    
    return { x: transformedX, y: transformedY };
  };
  
  // コート描画
  const drawCourt = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 背景グラデーション
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#2d5a27'); // 濃い緑（奥）
    gradient.addColorStop(1, '#4a7c59'); // 明るい緑（手前）
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // コートライン描画
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    // 外側のライン（3D変換済み）
    const corners = [
      convertTo3D(0.1, 0.05), // 左奥
      convertTo3D(0.9, 0.05), // 右奥
      convertTo3D(0.9, 0.95), // 右手前
      convertTo3D(0.1, 0.95)  // 左手前
    ];
    
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    ctx.lineTo(corners[1].x, corners[1].y);
    ctx.lineTo(corners[2].x, corners[2].y);
    ctx.lineTo(corners[3].x, corners[3].y);
    ctx.closePath();
    ctx.stroke();
    
    // ネット
    const netLeft = convertTo3D(0.1, 0.5);
    const netRight = convertTo3D(0.9, 0.5);
    
    // ネットヒット効果
    if (specialAnimation.type === 'net_hit' && specialAnimation.isActive) {
      const hitIntensity = Math.sin(specialAnimation.progress * Math.PI * 8) * 0.3;
      ctx.strokeStyle = `rgba(255, 100, 100, ${1 - specialAnimation.progress * 0.5})`;
      ctx.lineWidth = 3 + hitIntensity;
    } else {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
    }
    
    ctx.beginPath();
    ctx.moveTo(netLeft.x, netLeft.y);
    ctx.lineTo(netRight.x, netRight.y);
    ctx.stroke();
    
    // ネットの縦線（質感表現）
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ffffff';
    for (let i = 0; i <= 10; i++) {
      const x = netLeft.x + (netRight.x - netLeft.x) * (i / 10);
      const vibration = specialAnimation.type === 'net_hit' && specialAnimation.isActive ? 
        Math.sin(specialAnimation.progress * Math.PI * 12 + i) * 2 : 0;
      ctx.beginPath();
      ctx.moveTo(x, netLeft.y - 8 + vibration);
      ctx.lineTo(x, netLeft.y + 8 + vibration);
      ctx.stroke();
    }
    
    // ネットヒット時のエフェクト
    if (specialAnimation.type === 'net_hit' && specialAnimation.isActive && specialAnimation.netHitPosition) {
      const hitPos = convertTo3D(specialAnimation.netHitPosition.x, specialAnimation.netHitPosition.y);
      const sparkRadius = specialAnimation.progress * 15;
      
      ctx.strokeStyle = `rgba(255, 255, 0, ${1 - specialAnimation.progress})`;
      ctx.lineWidth = 2;
      
      // 火花エフェクト
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const sparkX = hitPos.x + Math.cos(angle) * sparkRadius;
        const sparkY = hitPos.y + Math.sin(angle) * sparkRadius;
        
        ctx.beginPath();
        ctx.moveTo(hitPos.x, hitPos.y);
        ctx.lineTo(sparkX, sparkY);
        ctx.stroke();
      }
    }
    
    // エースエフェクト
    if (specialAnimation.type === 'ace_effect' && specialAnimation.isActive && specialAnimation.acePosition) {
      const acePos = convertTo3D(specialAnimation.acePosition.x, specialAnimation.acePosition.y);
      const intensity = specialAnimation.intensity || 1.0;
      const progress = specialAnimation.progress;
      
      // 閃光エフェクト
      const flashRadius = progress * 60 * intensity;
      const flashAlpha = Math.sin(progress * Math.PI * 6) * 0.6 + 0.4; // 点滅
      
      // 放射状の光線（固定パターンでちらつき防止）
      ctx.strokeStyle = `rgba(255, 255, 100, ${flashAlpha * (1 - progress * 0.5)})`;
      ctx.lineWidth = 3;
      
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        // Math.random()を削除して固定長にする + 少しの変動はprogressで
        const rayVariation = 0.7 + 0.3 * Math.sin(progress * Math.PI * 4 + i);
        const rayLength = flashRadius * rayVariation;
        const startX = acePos.x;
        const startY = acePos.y;
        const endX = startX + Math.cos(angle) * rayLength;
        const endY = startY + Math.sin(angle) * rayLength;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
      
      // 中央の強い光
      const centerGradient = ctx.createRadialGradient(acePos.x, acePos.y, 0, acePos.x, acePos.y, flashRadius * 0.3);
      centerGradient.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
      centerGradient.addColorStop(0.5, `rgba(255, 255, 100, ${flashAlpha * 0.6})`);
      centerGradient.addColorStop(1, 'rgba(255, 255, 100, 0)');
      
      ctx.fillStyle = centerGradient;
      ctx.beginPath();
      ctx.arc(acePos.x, acePos.y, flashRadius * 0.3, 0, Math.PI * 2);
      ctx.fill();
      
      // エース文字エフェクト（後半で表示）
      if (progress > 0.4) {
        const textAlpha = Math.min((progress - 0.4) / 0.6, 1);
        const textScale = 1 + Math.sin((progress - 0.4) * Math.PI * 3) * 0.2;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${textAlpha})`;
        ctx.strokeStyle = `rgba(255, 100, 100, ${textAlpha})`;
        ctx.font = `bold ${Math.floor(36 * textScale)}px Arial`;
        ctx.textAlign = 'center';
        ctx.lineWidth = 2;
        
        const aceText = 'ACE!';
        ctx.strokeText(aceText, acePos.x, acePos.y - 40);
        ctx.fillText(aceText, acePos.x, acePos.y - 40);
      }
    }
    
    // サービスライン
    ctx.lineWidth = 2;
    const serviceLineTop = [
      convertTo3D(0.1, 0.25),
      convertTo3D(0.9, 0.25)
    ];
    const serviceLineBottom = [
      convertTo3D(0.1, 0.75),
      convertTo3D(0.9, 0.75)
    ];
    
    ctx.beginPath();
    ctx.moveTo(serviceLineTop[0].x, serviceLineTop[0].y);
    ctx.lineTo(serviceLineTop[1].x, serviceLineTop[1].y);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(serviceLineBottom[0].x, serviceLineBottom[0].y);
    ctx.lineTo(serviceLineBottom[1].x, serviceLineBottom[1].y);
    ctx.stroke();
    
    // センターライン
    const centerTop = convertTo3D(0.5, 0.25);
    const centerBottom = convertTo3D(0.5, 0.75);
    ctx.beginPath();
    ctx.moveTo(centerTop.x, centerTop.y);
    ctx.lineTo(centerBottom.x, centerBottom.y);
    ctx.stroke();
  };
  
  // プレイヤー描画
  const drawPlayer = (ctx: CanvasRenderingContext2D, player: TennisPlayer, position: PlayerPosition, isHome: boolean) => {
    const pos3d = convertTo3D(position.x, position.y);
    const scale = 0.3 + position.y * 0.7; // 遠近感
    
    // プレイヤーの影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(pos3d.x, pos3d.y + 15, 15 * scale, 8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // プレイヤー本体（円）
    const playerColor = isHome ? '#4f46e5' : '#dc2626';
    ctx.fillStyle = playerColor;
    ctx.beginPath();
    ctx.arc(pos3d.x, pos3d.y, 20 * scale, 0, Math.PI * 2);
    ctx.fill();
    
    // プレイヤー名
    ctx.fillStyle = '#ffffff';
    ctx.font = `${12 * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(player.pokemon_name, pos3d.x, pos3d.y - 30 * scale);
  };
  
  // ボール描画
  const drawBall = (ctx: CanvasRenderingContext2D, ball: BallPosition) => {
    if (!ball.isVisible) return;
    
    const pos3d = convertTo3D(ball.x, ball.y);
    const scale = 0.3 + ball.y * 0.7;
    
    // ボールの軌跡
    if (ball.trail.length > 1) {
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const firstTrail = convertTo3D(ball.trail[0].x, ball.trail[0].y);
      ctx.moveTo(firstTrail.x, firstTrail.y);
      
      for (let i = 1; i < ball.trail.length; i++) {
        const trailPos = convertTo3D(ball.trail[i].x, ball.trail[i].y);
        ctx.lineTo(trailPos.x, trailPos.y);
      }
      ctx.stroke();
    }
    
    // ボールの影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(pos3d.x, pos3d.y + 10, 8 * scale, 0, Math.PI * 2);
    ctx.fill();
    
    // ボール本体（高さを考慮）
    const ballY = pos3d.y - ball.z * 50; // 高さに応じてY座標調整
    
    // 特殊アニメーション中のボール色変更
    if (specialAnimation.type === 'out_bounce' && specialAnimation.isActive) {
      ctx.fillStyle = `rgba(255, 100, 100, ${1 - specialAnimation.progress * 0.3})`;
    } else if (specialAnimation.type === 'missed_ball' && specialAnimation.isActive) {
      ctx.fillStyle = `rgba(255, 255, 100, ${1 - specialAnimation.progress * 0.5})`;
    } else {
      ctx.fillStyle = '#ffeb3b';
    }
    
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pos3d.x, ballY, 10 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // アウト時のバウンドエフェクト
    if (specialAnimation.type === 'out_bounce' && specialAnimation.isActive && specialAnimation.outBouncePosition) {
      const bouncePos = convertTo3D(specialAnimation.outBouncePosition.x, specialAnimation.outBouncePosition.y);
      const dustRadius = specialAnimation.progress * 20;
      
      ctx.fillStyle = `rgba(139, 69, 19, ${0.7 - specialAnimation.progress * 0.7})`;
      
      // ダストクラウド
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const dustX = bouncePos.x + Math.cos(angle) * dustRadius * (0.5 + Math.random() * 0.5);
        const dustY = bouncePos.y + Math.sin(angle) * dustRadius * (0.5 + Math.random() * 0.5);
        const dustSize = (1 - specialAnimation.progress) * 3;
        
        ctx.beginPath();
        ctx.arc(dustX, dustY, dustSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };
  
  // 特殊アニメーション実行
  const executeSpecialAnimation = (type: 'net_hit' | 'out_bounce' | 'missed_ball' | 'ace_effect', params: any) => {
    setSpecialAnimation({
      type,
      isActive: true,
      progress: 0,
      ...params
    });
    
    // アニメーション実行
    const duration = type === 'ace_effect' ? 2000 : 1500; // エースは長め
    const startTime = Date.now();
    
    const animateSpecial = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      setSpecialAnimation(prev => ({
        ...prev,
        progress
      }));
      
      if (progress < 1) {
        requestAnimationFrame(animateSpecial);
      } else {
        // アニメーション完了
        setTimeout(() => {
          setSpecialAnimation({
            type: null,
            isActive: false,
            progress: 0
          });
        }, type === 'ace_effect' ? 1000 : 500); // エースは余韻長め
      }
    };
    
    animateSpecial();
  };

  // アニメーションループ
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // コート描画
    drawCourt(ctx);
    
    // プレイヤー描画
    drawPlayer(ctx, homePlayer, homePosition, true);
    drawPlayer(ctx, awayPlayer, awayPosition, false);
    
    // ボール描画
    drawBall(ctx, ballPosition);
    
    animationRef.current = requestAnimationFrame(animate);
  };
  
  // isPausedが変更されたときにrefを更新
  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  // 詳細ポイント結果による特殊アニメーション
  useEffect(() => {
    console.log('🎬 DetailedResult useEffect triggered:', {
      hasDetailedResult: !!detailedResult,
      reason: detailedResult?.detailedReason,
      rallySequence: !!rallySequence,
      isPlaying,
      rallyLength: rallySequence?.shots?.length
    });
    
    if (!detailedResult || !detailedResult.detailedReason) {
      console.log('❌ No detailed result or reason, skipping special animations');
      return;
    }
    
    const reason = detailedResult.detailedReason;
    console.log(`🎯 Processing special animation for: ${reason}`);
    
    // エース系 - 特別なボールアニメーション
    if (reason === 'ace_serve' || reason === 'service_winner') {
      console.log('⚡ Starting ACE animation sequence');
      
      // エース音響を即座に再生
      const aceType = reason === 'ace_serve' ? 'serve' : 'return';
      playAceAudio(aceType, detailedResult.intensity || 1.0);
      
      // エース用の特殊ボールアニメーション
      animateSpecialBall(
        detailedResult.ballTrajectory.startPosition,
        detailedResult.ballTrajectory.endPosition,
        'ace',
        () => {
          console.log('✅ Ace ball animation completed');
        }
      );
      
      // エース用のスペシャルエフェクト
      executeSpecialAnimation('ace_effect', {
        acePosition: detailedResult.ballTrajectory.endPosition,
        intensity: detailedResult.intensity || 1.0
      });
    }
    // ネット系アニメーション
    else if (reason === 'hit_net' || reason === 'net_cord') {
      console.log('🥅 Starting NET HIT animation sequence');
      executeSpecialAnimation('net_hit', {
        netHitPosition: detailedResult.ballTrajectory.hitNetAt || { x: 0.5, y: 0.5 }
      });
    }
    // アウト系アニメーション  
    else if (reason === 'out_baseline' || reason === 'out_sideline' || reason === 'out_long' || reason === 'out_wide') {
      console.log('💥 Starting OUT animation sequence');
      executeSpecialAnimation('out_bounce', {
        outBouncePosition: detailedResult.ballTrajectory.endPosition
      });
    }
    // みのがし系アニメーション - 特別なボールアニメーション
    else if (reason === 'missed_return' || reason === 'late_swing' || reason === 'misjudged') {
      console.log('👻 Starting MISSED BALL animation sequence');
      
      // 見逃し用の特殊ボールアニメーション（コート外まで）
      animateSpecialBall(
        detailedResult.ballTrajectory.startPosition,
        detailedResult.ballTrajectory.endPosition,
        'missed_ball',
        () => {
          console.log('✅ Missed ball animation completed');
        }
      );
      
      executeSpecialAnimation('missed_ball', {
        ballPassPosition: detailedResult.ballTrajectory.endPosition
      });
    }
    else {
      console.log(`⚠️ No special animation for reason: ${reason}`);
    }
  }, [detailedResult]);

  // isAutoPlayingが変更されたときにrefを更新
  useEffect(() => {
    autoPlayRef.current = isAutoPlaying;
  }, [isAutoPlaying]);

  // ラリーアニメーション実行
  useEffect(() => {
    console.log('🎾 Rally animation useEffect triggered:', {
      hasRallySequence: !!rallySequence,
      isPlaying,
      shotCount: rallySequence?.shots?.length,
      winReason: rallySequence?.winReason
    });
    
    if (!rallySequence || !isPlaying) {
      console.log('❌ Rally animation skipped - no sequence or not playing');
      return;
    }
    
    console.log('✅ Starting rally animation with', rallySequence.shots.length, 'shots');
    let shotIndex = 0;
    let isCompleted = false;
    
    const playNextShot = () => {
      if (isCompleted) return;
      
      // 一時停止チェック（自動再生モードでは一時停止を無視）
      if (pausedRef.current && !autoPlayRef.current) {
        setTimeout(playNextShot, 100); // 一時停止中は100ms後に再チェック
        return;
      }
      
      if (shotIndex >= rallySequence.shots.length) {
        // ラリー完了
        console.log('🏁 Rally animation completed - all shots played');
        isCompleted = true;
        if (setRallyPlaying) {
          setRallyPlaying(false);
        }
        if (onRallyComplete) {
          onRallyComplete();
        }
        return;
      }
      
      const shot = rallySequence.shots[shotIndex];
      console.log(`🎯 Playing shot ${shotIndex + 1}/${rallySequence.shots.length}:`, {
        player: shot.player,
        shotType: shot.shotType,
        power: shot.power,
        isWinner: shot.isWinner,
        isError: shot.isError
      });
      
      setCurrentShotIndex(shotIndex);
      setIsTransitioning(true);
      
      // プレイヤーの準備動作（ショット位置への移動）
      const movePlayerToShot = () => {
        if (shot.player === 'home') {
          setHomePosition(prev => ({
            ...prev,
            isMoving: true,
            targetX: shot.position.x,
            targetY: shot.position.y
          }));
        } else {
          setAwayPosition(prev => ({
            ...prev,
            isMoving: true,
            targetX: shot.position.x,
            targetY: shot.position.y
          }));
        }
        
        // プレイヤー移動完了を待ってからボールアニメーション開始
        setTimeout(() => {
          setIsTransitioning(false);
          
          // ラケット打撃音を再生（ショット開始時）
          const shotIntensity = shot.power === 'hard' ? 0.9 : shot.power === 'medium' ? 0.6 : 0.3;
          playRallyHit(shotIntensity, shot.shotType);
          
          // ボール移動（アニメーション）
          animateBallToTarget(shot.position, shot.targetPosition, () => {
            if (isCompleted) return;
            
            // ショット完了後の処理
            shotIndex++;
            
            // 非アクティブプレイヤーを待機位置に戻す
            movePlayersToWaitingPosition(shot, shotIndex < rallySequence.shots.length);
            
            // デバッグ用：各ショット後に一時停止（自動再生モードでは停止しない）
            if (!autoPlayRef.current) {
              setIsPaused(true);
              pausedRef.current = true;
            }
            
            // 次のショットの準備
            const nextShotDelay = autoPlayRef.current ? 800 : 300; // 自動再生時は少し長めの間隔
            setTimeout(() => {
              if (!isCompleted) {
                playNextShot();
              }
            }, nextShotDelay);
          });
        }, 400); // プレイヤー移動時間
      };
      
      movePlayerToShot();
    };
    
    // リセット状態（デフォルトで自動再生ON）
    setIsPaused(false);
    pausedRef.current = false;
    setIsAutoPlaying(true); // デフォルトで自動再生ON
    autoPlayRef.current = true;
    setCurrentShotIndex(0);
    
    // ラリー再生開始を通知
    if (setRallyPlaying) {
      setRallyPlaying(true);
    }
    
    // 最初のショット開始
    setTimeout(() => {
      if (!isCompleted) {
        playNextShot();
      }
    }, 1000);
    
    // クリーンアップ
    return () => {
      isCompleted = true;
    };
  }, [rallySequence, isPlaying]);
  
  // プレイヤーを待機位置に移動
  const movePlayersToWaitingPosition = (currentShot: RallyShot, hasNextShot: boolean) => {
    if (!hasNextShot) return; // 最後のショットの場合は待機位置に戻さない
    
    // ショットを打ったプレイヤーは少し下がる
    if (currentShot.player === 'home') {
      setTimeout(() => {
        setHomePosition(prev => ({
          ...prev,
          isMoving: true,
          targetX: 0.5, // 中央に戻る
          targetY: Math.min(prev.y + 0.1, 0.85) // 少し下がる
        }));
      }, 200);
    } else {
      setTimeout(() => {
        setAwayPosition(prev => ({
          ...prev,
          isMoving: true,
          targetX: 0.5, // 中央に戻る
          targetY: Math.max(prev.y - 0.1, 0.15) // 少し下がる
        }));
      }, 200);
    }
  };
  
  // ボールアニメーション（より滑らかに）
  const animateBallToTarget = (start: {x: number, y: number}, target: {x: number, y: number}, onComplete: () => void) => {
    const duration = 800; // 少し速くして自然に
    const startTime = Date.now();
    
    // 現在のボール位置から開始（前のショットからの継続）
    const actualStart = ballPosition.isVisible ? 
      { x: ballPosition.x, y: ballPosition.y } : start;
    
    setBallPosition(prev => ({ 
      ...prev, 
      isVisible: true, 
      trail: prev.trail // 既存の軌跡を保持
    }));
    
    const animateBall = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // より自然なイージング関数
      const easeProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const x = actualStart.x + (target.x - actualStart.x) * easeProgress;
      const y = actualStart.y + (target.y - actualStart.y) * easeProgress;
      
      // 弧の高さ（距離に応じて調整）
      const distance = Math.sqrt(
        Math.pow(target.x - actualStart.x, 2) + Math.pow(target.y - actualStart.y, 2)
      );
      const maxHeight = Math.min(distance * 0.8, 0.4); // 距離に応じた高さ
      const z = Math.sin(progress * Math.PI) * maxHeight;
      
      setBallPosition(prev => ({
        x, y, z,
        isVisible: true,
        trail: [...prev.trail.slice(-12), { x, y }] // 軌跡を少し長く（最大13点）
      }));
      
      if (progress < 1) {
        requestAnimationFrame(animateBall);
      } else {
        // アニメーション完了時にボールを着地位置に設定
        setBallPosition(prev => ({
          x: target.x, y: target.y, z: 0,
          isVisible: true,
          trail: [...prev.trail, { x: target.x, y: target.y }]
        }));
        
        // ボールバウンド音を再生
        const bounceIntensity = Math.min(1.0, distance * 2); // 距離に応じた音の強さ
        playBallBounce(bounceIntensity);
        
        // 少し待ってから次の処理へ
        setTimeout(onComplete, 100);
      }
    };
    
    animateBall();
  };

  // 特殊ボールアニメーション（見逃し・エース用）
  const animateSpecialBall = (
    start: {x: number, y: number}, 
    target: {x: number, y: number}, 
    type: 'missed_ball' | 'ace' | 'normal',
    onComplete: () => void
  ) => {
    const baseDuration = type === 'ace' ? 600 : 1200; // エースは速く、見逃しは長く
    const startTime = Date.now();
    
    // 見逃しの場合は最終的にコート外まで飛ばす
    let finalTarget = target;
    if (type === 'missed_ball') {
      // ターゲットを更にコート外に設定
      const extraDistance = 0.3; // 追加の距離
      const direction = { 
        x: target.x - start.x, 
        y: target.y - start.y 
      };
      const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
      if (length > 0) {
        direction.x /= length;
        direction.y /= length;
        finalTarget = {
          x: target.x + direction.x * extraDistance,
          y: target.y + direction.y * extraDistance
        };
      }
    }
    
    const actualStart = ballPosition.isVisible ? 
      { x: ballPosition.x, y: ballPosition.y } : start;
    
    setBallPosition(prev => ({ 
      ...prev, 
      isVisible: true, 
      trail: []
    }));
    
    const animateBall = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / baseDuration, 1);
      
      // エースは直線的、見逃しは放物線的
      const easeProgress = type === 'ace' ? 
        progress : // 直線的（速い）
        1 - Math.pow(1 - progress, 2); // ease-out quadratic
      
      const x = actualStart.x + (finalTarget.x - actualStart.x) * easeProgress;
      const y = actualStart.y + (finalTarget.y - actualStart.y) * easeProgress;
      
      // 弧の高さ
      const distance = Math.sqrt(
        Math.pow(finalTarget.x - actualStart.x, 2) + Math.pow(finalTarget.y - actualStart.y, 2)
      );
      
      let z = 0;
      if (type === 'ace') {
        z = Math.sin(progress * Math.PI) * Math.min(distance * 0.3, 0.2); // 低い弧
      } else if (type === 'missed_ball') {
        z = Math.sin(progress * Math.PI) * Math.min(distance * 0.6, 0.3); // 通常の弧
      } else {
        z = Math.sin(progress * Math.PI) * Math.min(distance * 0.8, 0.4);
      }
      
      setBallPosition(prev => ({
        x, y, z,
        isVisible: true,
        trail: [...prev.trail.slice(-15), { x, y }]
      }));
      
      if (progress < 1) {
        requestAnimationFrame(animateBall);
      } else {
        // 見逃しの場合は更にバウンドして外に
        if (type === 'missed_ball') {
          animateFinalBounce(finalTarget, onComplete);
        } else {
          setBallPosition(prev => ({
            x: finalTarget.x, y: finalTarget.y, z: 0,
            isVisible: true,
            trail: [...prev.trail, { x: finalTarget.x, y: finalTarget.y }]
          }));
          
          if (type !== 'ace') {
            const bounceIntensity = Math.min(1.0, distance * 2);
            playBallBounce(bounceIntensity);
          }
          
          setTimeout(onComplete, type === 'ace' ? 800 : 300); // エースは余韻を長く
        }
      }
    };
    
    animateBall();
  };

  // 見逃し時の最終バウンド（コート外へ）
  const animateFinalBounce = (bounceStart: {x: number, y: number}, onComplete: () => void) => {
    const duration = 800;
    const startTime = Date.now();
    
    // さらに外側の最終地点
    const finalExit = {
      x: bounceStart.x + (bounceStart.x - 0.5) * 0.5, // 中央から更に遠く
      y: bounceStart.y + (bounceStart.y > 0.5 ? 0.3 : -0.3) // 上下にさらに移動
    };
    
    // バウンド音を再生
    playBallBounce(0.8);
    
    const animateBounce = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeProgress = 1 - Math.pow(1 - progress, 2);
      const x = bounceStart.x + (finalExit.x - bounceStart.x) * easeProgress;
      const y = bounceStart.y + (finalExit.y - bounceStart.y) * easeProgress;
      
      // バウンド後は低い弧
      const z = Math.sin(progress * Math.PI) * 0.15;
      
      setBallPosition(prev => ({
        x, y, z,
        isVisible: progress < 0.9, // 最後は消える
        trail: [...prev.trail.slice(-10), { x, y }]
      }));
      
      if (progress < 1) {
        requestAnimationFrame(animateBounce);
      } else {
        setBallPosition(prev => ({
          ...prev,
          isVisible: false
        }));
        setTimeout(onComplete, 200);
      }
    };
    
    animateBounce();
  };
  
  // プレイヤー位置の平滑移動
  useEffect(() => {
    const movePlayer = (
      currentPos: PlayerPosition, 
      setPos: React.Dispatch<React.SetStateAction<PlayerPosition>>
    ) => {
      if (!currentPos.isMoving) return;
      
      const dx = currentPos.targetX - currentPos.x;
      const dy = currentPos.targetY - currentPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 0.01) {
        setPos(prev => ({ ...prev, isMoving: false }));
        return;
      }
      
      const speed = 0.08; // 少し速くして自然に
      setPos(prev => ({
        ...prev,
        x: prev.x + dx * speed,
        y: prev.y + dy * speed
      }));
    };
    
    const interval = setInterval(() => {
      movePlayer(homePosition, setHomePosition);
      movePlayer(awayPosition, setAwayPosition);
    }, 16); // 60fps
    
    return () => clearInterval(interval);
  }, [homePosition, awayPosition]);
  
  // アニメーションループ開始
  useEffect(() => {
    animate();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [homePosition, awayPosition, ballPosition]);
  
  return (
    <div className="tennis-court-container bg-gray-100 p-4 rounded-lg">
      <div className="court-header mb-4 text-center">
        <h3 className="text-lg font-bold">ラリー再生</h3>
        {rallySequence && (
          <p className="text-sm text-gray-600">
            {currentShotIndex + 1} / {rallySequence.totalShots} ショット - {rallySequence.winReason}
          </p>
        )}
      </div>
      
      {/* デバッグ用コントロール */}
      {showDebugInfo && (
        <div className="debug-controls mb-4 p-3 bg-yellow-100 rounded border">
          <h4 className="font-bold text-sm mb-2">🔧 デバッグコントロール</h4>
          <div className="flex gap-2 mb-2 flex-wrap">
            <button
              onClick={() => {
                const newPausedState = !isPaused;
                setIsPaused(newPausedState);
                pausedRef.current = newPausedState;
                console.log('一時停止状態変更:', newPausedState);
              }}
              className={`px-3 py-1 rounded text-sm ${
                isPaused ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
              }`}
              disabled={isAutoPlaying}
            >
              {isPaused ? '▶️ 再開' : '⏸️ 一時停止'}
            </button>
            <button
              onClick={() => {
                const newAutoPlayState = !isAutoPlaying;
                setIsAutoPlaying(newAutoPlayState);
                autoPlayRef.current = newAutoPlayState;
                
                if (newAutoPlayState) {
                  // 自動再生開始時に一時停止を解除
                  setIsPaused(false);
                  pausedRef.current = false;
                }
                console.log('自動再生状態変更:', newAutoPlayState);
              }}
              className={`px-3 py-1 rounded text-sm ${
                isAutoPlaying ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
              }`}
            >
              {isAutoPlaying ? '⏹️ 自動停止' : '🎬 自動再生'}
            </button>
            <button
              onClick={() => setShowDebugInfo(false)}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
            >
              デバッグ非表示
            </button>
          </div>
          <div className="text-xs text-gray-700">
            <p><strong>状態:</strong> {isAutoPlaying ? '自動再生中' : isPaused ? '一時停止中' : '手動再生中'}</p>
            <p><strong>現在のショット:</strong> {currentShotIndex + 1}</p>
            <p><strong>トランジション:</strong> {isTransitioning ? 'プレイヤー移動中' : 'ボールアニメーション中'}</p>
            <p><strong>ボール表示:</strong> {ballPosition.isVisible ? '表示中' : '非表示'}</p>
          </div>
        </div>
      )}
      
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border border-gray-300 rounded mx-auto block"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      
      {/* ラリー情報 */}
      {rallySequence && (
        <div className="rally-info mt-4 text-sm text-gray-600 text-center">
          <p>推定時間: {rallySequence.duration.toFixed(1)}秒</p>
          <p>勝者: {rallySequence.winner === 'home' ? homePlayer.pokemon_name : awayPlayer.pokemon_name}</p>
        </div>
      )}
      
      {/* デバッグ用：ラリーシーケンス詳細 */}
      {showDebugInfo && rallySequence && (
        <div className="debug-info mt-4 p-3 bg-blue-50 rounded border">
          <h4 className="font-bold text-sm mb-2">📊 ラリーシーケンス詳細</h4>
          <div className="text-xs space-y-1">
            <p><strong>総ショット数:</strong> {rallySequence.totalShots}</p>
            <p><strong>勝利理由:</strong> {rallySequence.winReason}</p>
            <p><strong>勝者:</strong> {rallySequence.winner}</p>
            <p><strong>推定時間:</strong> {rallySequence.duration.toFixed(1)}秒</p>
          </div>
          
          <div className="mt-3">
            <h5 className="font-semibold text-xs mb-1">ショット詳細:</h5>
            <div className="max-h-32 overflow-y-auto bg-white p-2 rounded border">
              {rallySequence.shots.map((shot, index) => (
                <div 
                  key={index} 
                  className={`text-xs p-1 rounded mb-1 ${
                    index === currentShotIndex ? 'bg-yellow-200' : 'bg-gray-50'
                  }`}
                >
                  <span className="font-mono">
                    #{shot.shotNumber} {shot.player === 'home' ? homePlayer.pokemon_name : awayPlayer.pokemon_name} - 
                    {shot.shotType} ({shot.power})
                    {shot.isWinner && ' 🏆'}
                    {shot.isError && ' ❌'}
                  </span>
                  <div className="text-gray-500">
                    位置: ({shot.position.x.toFixed(2)}, {shot.position.y.toFixed(2)}) → 
                    ({shot.targetPosition.x.toFixed(2)}, {shot.targetPosition.y.toFixed(2)})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}