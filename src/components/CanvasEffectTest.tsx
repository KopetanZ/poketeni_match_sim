'use client';

import { useEffect, useRef, useState } from 'react';

interface SpecialAnimation {
  type: 'net_hit' | 'net_cord' | 'ace_effect' | null;
  isActive: boolean;
  progress: number;
  netHitPosition?: { x: number; y: number };
  acePosition?: { x: number; y: number };
}

export default function CanvasEffectTest() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  
  const [specialAnimation, setSpecialAnimation] = useState<SpecialAnimation>({
    type: null,
    isActive: false,
    progress: 0
  });

  // 3D座標変換（簡易版）
  const convertTo3D = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    return {
      x: x * canvas.width,
      y: y * canvas.height
    };
  };

  // コート描画（簡易版）
  const drawCourt = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 背景クリア
    ctx.fillStyle = '#0d7377';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ネット描画
    const netY = canvas.height / 2;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, netY);
    ctx.lineTo(canvas.width, netY);
    ctx.stroke();

    // ネット関連エフェクト
    if ((specialAnimation.type === 'net_hit' || specialAnimation.type === 'net_cord') && specialAnimation.isActive && specialAnimation.netHitPosition) {
      console.log(`🔧 Drawing net effect:`, { 
        type: specialAnimation.type, 
        isActive: specialAnimation.isActive, 
        progress: specialAnimation.progress,
        netHitPosition: specialAnimation.netHitPosition 
      });

      const hitPos = convertTo3D(specialAnimation.netHitPosition.x, specialAnimation.netHitPosition.y);
      const sparkRadius = specialAnimation.progress * 30;
      
      if (specialAnimation.type === 'net_hit') {
        // ネットイン：黄色い火花エフェクト
        ctx.strokeStyle = `rgba(255, 255, 0, ${1 - specialAnimation.progress})`;
        ctx.lineWidth = 3;
        
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
        
        // "NET!" テキスト
        if (specialAnimation.progress > 0.3) {
          const textAlpha = Math.min((specialAnimation.progress - 0.3) / 0.7, 1);
          ctx.fillStyle = `rgba(255, 100, 100, ${textAlpha})`;
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('NET!', hitPos.x, hitPos.y - 40);
        }
      } else if (specialAnimation.type === 'net_cord') {
        // ネットコード：青い波紋エフェクト
        ctx.strokeStyle = `rgba(100, 200, 255, ${1 - specialAnimation.progress})`;
        ctx.lineWidth = 2;
        
        // 光の波紋
        for (let i = 0; i < 3; i++) {
          const radius = sparkRadius * (0.5 + i * 0.3);
          ctx.beginPath();
          ctx.arc(hitPos.x, hitPos.y, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // "NET CORD!" テキスト
        if (specialAnimation.progress > 0.3) {
          const textAlpha = Math.min((specialAnimation.progress - 0.3) / 0.7, 1);
          ctx.fillStyle = `rgba(100, 150, 255, ${textAlpha})`;
          ctx.font = 'bold 20px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('NET CORD!', hitPos.x, hitPos.y - 40);
        }
      }
    } else if (specialAnimation.type === 'net_hit' || specialAnimation.type === 'net_cord') {
      // 条件が満たされない場合のデバッグ
      console.log(`🔧 Net effect NOT drawing:`, { 
        type: specialAnimation.type, 
        isActive: specialAnimation.isActive, 
        hasNetHitPosition: !!specialAnimation.netHitPosition,
        netHitPosition: specialAnimation.netHitPosition
      });
    }

    // エースエフェクト
    if (specialAnimation.type === 'ace_effect' && specialAnimation.isActive && specialAnimation.acePosition) {
      console.log(`🔧 Drawing ace effect:`, { progress: specialAnimation.progress });
      
      const acePos = convertTo3D(specialAnimation.acePosition.x, specialAnimation.acePosition.y);
      const progress = specialAnimation.progress;
      
      // 閃光エフェクト
      const flashRadius = progress * 80;
      const flashAlpha = Math.sin(progress * Math.PI * 6) * 0.6 + 0.4;
      
      ctx.strokeStyle = `rgba(255, 255, 100, ${flashAlpha * (1 - progress * 0.5)})`;
      ctx.lineWidth = 4;
      
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const rayLength = flashRadius * (0.7 + 0.3 * Math.sin(progress * Math.PI * 4 + i));
        const endX = acePos.x + Math.cos(angle) * rayLength;
        const endY = acePos.y + Math.sin(angle) * rayLength;
        
        ctx.beginPath();
        ctx.moveTo(acePos.x, acePos.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
      
      // "ACE!" テキスト
      if (progress > 0.2) {
        const textAlpha = Math.min((progress - 0.2) / 0.8, 1);
        ctx.fillStyle = `rgba(255, 255, 100, ${textAlpha})`;
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ACE!', acePos.x, acePos.y - 50);
      }
    }
  };

  // アニメーションループ
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('❌ Test Canvas not found');
      animationRef.current = requestAnimationFrame(animate);
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('❌ Test Canvas context not found');
      animationRef.current = requestAnimationFrame(animate);
      return;
    }
    
    // 描画実行
    drawCourt(ctx);
    
    animationRef.current = requestAnimationFrame(animate);
  };

  // 特殊アニメーション実行
  const executeSpecialAnimation = (type: 'net_hit' | 'net_cord' | 'ace_effect', params: any) => {
    console.log(`🎬 Test: executeSpecialAnimation called:`, { type, params });
    
    setSpecialAnimation({
      type,
      isActive: true,
      progress: 0,
      ...params
    });
    
    const duration = type === 'ace_effect' ? 2000 : 1500;
    const startTime = Date.now();
    
    const animateSpecial = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      console.log(`🔧 Test Animation progress:`, { type, elapsed, duration, progress });
      
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
          console.log(`✅ Test Special animation completed: ${type}`);
        }, 500);
      }
    };
    
    animateSpecial();
  };

  // コンポーネントマウント時にアニメーション開始
  useEffect(() => {
    console.log('🎬 Test: Starting canvas animation loop');
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // テスト用ボタン
  const testNetHit = () => {
    console.log('🎬 Test: Testing NET HIT');
    executeSpecialAnimation('net_hit', {
      netHitPosition: { x: 0.5, y: 0.5 }
    });
  };

  const testNetCord = () => {
    console.log('🎬 Test: Testing NET CORD');
    executeSpecialAnimation('net_cord', {
      netHitPosition: { x: 0.5, y: 0.5 }
    });
  };

  const testAce = () => {
    console.log('🎬 Test: Testing ACE');
    executeSpecialAnimation('ace_effect', {
      acePosition: { x: 0.3, y: 0.7 }
    });
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
      <h3 className="text-xl font-bold text-white mb-4">🧪 Canvas Effect Test</h3>
      
      <canvas
        ref={canvasRef}
        width={400}
        height={300}
        className="border border-white/30 rounded mb-4 block"
        style={{ background: '#0d7377' }}
      />
      
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={testNetHit}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
        >
          🥅 Test Net Hit
        </button>
        
        <button
          onClick={testNetCord}
          className="px-4 py-2 bg-red-400 text-white rounded-lg hover:bg-red-500 transition-colors text-sm"
        >
          🎾 Test Net Cord
        </button>
        
        <button
          onClick={testAce}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
        >
          ⚡ Test Ace
        </button>
      </div>
      
      <div className="mt-4 text-white/70 text-sm">
        <p>Current Animation: {specialAnimation.type || 'None'}</p>
        <p>Active: {specialAnimation.isActive ? 'Yes' : 'No'}</p>
        <p>Progress: {(specialAnimation.progress * 100).toFixed(1)}%</p>
      </div>
    </div>
  );
}