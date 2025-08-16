// アニメーションエンジン - タイムライン実行とアクション制御

import { AnimationController } from '@/types/animation';
import { PointResult } from '@/types/tennis';

// アニメーションパラメータ型定義
export interface AnimationParams {
  [key: string]: string | number | boolean | (string | number | boolean)[];
}

// タイムラインアクション型定義
export interface TimelineAction {
  t: number;
  action: string;
  params: AnimationParams;
}

export interface AnimationTemplate {
  point_index?: number;
  template: string;
  timeline: TimelineAction[];
}

// アニメーションエンジンクラス
export class AnimationEngine {
  private animationController: AnimationController;
  private activeTimeouts: Set<NodeJS.Timeout> = new Set();
  private onAnimationComplete?: () => void;
  private onStepChange?: (step: string) => void;
  private startTime: number = 0;

  constructor(
    animationController: AnimationController,
    onAnimationComplete?: () => void,
    onStepChange?: (step: string) => void
  ) {
    this.animationController = animationController;
    this.onAnimationComplete = onAnimationComplete;
    this.onStepChange = onStepChange;
  }

  // メインの実行関数
  async executeAnimation(template: AnimationTemplate): Promise<void> {
    this.clearActiveTimeouts();
    this.startTime = Date.now();
    
    console.log(`🎬 Starting animation: ${template.template}`);
    
    // タイムラインを時間順にソート
    const sortedTimeline = [...template.timeline].sort((a, b) => a.t - b.t);
    
    // 各アクションをスケジュール
    for (const action of sortedTimeline) {
      const adjustedDelay = action.t / this.animationController.speed;
      
      const timeout = setTimeout(() => {
        this.executeAction(action);
      }, adjustedDelay);
      
      this.activeTimeouts.add(timeout);
    }
    
    // 完了処理をスケジュール
    const totalDuration = Math.max(...sortedTimeline.map(a => a.t)) || 1000;
    const adjustedDuration = totalDuration / this.animationController.speed;
    
    const completionTimeout = setTimeout(() => {
      this.completeAnimation();
    }, adjustedDuration + 100); // 少し余裕を持たせる
    
    this.activeTimeouts.add(completionTimeout);
  }

  // 個別アクション実行
  private executeAction(action: TimelineAction): void {
    const elapsed = Date.now() - this.startTime;
    console.log(`⚡ Executing action: ${action.action} at ${elapsed}ms`, action.params);
    
    // ステップ変更を通知
    if (this.onStepChange) {
      this.onStepChange(action.action);
    }
    
    try {
      switch (action.action) {
        case 'play_trail':
          this.playTrail(action.params);
          break;
        case 'spawn_particles':
          this.spawnParticles(action.params);
          break;
        case 'play_sound':
          this.playSound(action.params);
          break;
        case 'camera_shake':
          this.cameraShake(action.params);
          break;
        case 'camera_zoom':
          this.cameraZoom(action.params);
          break;
        case 'ui_cutin':
          this.uiCutin(action.params);
          break;
        case 'ui_flash':
          this.uiFlash(action.params);
          break;
        case 'ui_score_bump':
          this.uiScoreBump(action.params);
          break;
        case 'player_highlight':
          this.playerHighlight(action.params);
          break;
        case 'player_glow':
          this.playerGlow(action.params);
          break;
        case 'player_reaction':
          this.playerReaction(action.params);
          break;
        case 'screen_pulse':
          this.screenPulse(action.params);
          break;
        case 'set_time_scale':
          this.setTimeScale(action.params);
          break;
        case 'overlay_vignette':
          this.overlayVignette(action.params);
          break;
        case 'vibrate':
          this.vibrate(action.params);
          break;
        case 'crowd_pop':
          this.crowdPop(action.params);
          break;
        case 'looped_trail_sequence':
          this.loopedTrailSequence(action.params);
          break;
        case 'cleanup_fade':
          this.cleanupFade(action.params);
          break;
        default:
          console.warn(`Unknown action: ${action.action}`);
      }
    } catch (error) {
      console.error(`Error executing action ${action.action}:`, error);
    }
  }

  // アクション実装群
  private playTrail(params: AnimationParams): void {
    const element = document.querySelector('.ball-trail');
    if (element) {
      const length = Number(params.length) || 50;
      const opacity = Number(params.opacity) || 0.8;
      const glow = params.glow || false;
      
      (element as HTMLElement).style.setProperty('--trail-length', `${length}px`);
      (element as HTMLElement).style.setProperty('--trail-opacity', `${opacity}`);
      
      if (glow) {
        element.classList.add('trail-glow');
      }
      
      element.classList.add('trail-active');
      setTimeout(() => {
        element.classList.remove('trail-active', 'trail-glow');
      }, length + 200);
    }
  }

  private spawnParticles(params: AnimationParams): void {
    const container = document.querySelector('.animation-container');
    if (!container) return;

    const type = params.type || 'sparks';
    const count = Number(params.count) || 10;
    const size = Number(params.size) || 12; // サイズを大きく
    const life = Number(params.life) || 1800; // 持続時間を3倍に延長（600→1800ms）

    // 中央から放射状に展開
    const centerX = container.clientWidth / 2;
    const centerY = container.clientHeight / 2;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = `particle particle-${type}`;
      
      // 放射状の位置計算
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const distance = 50 + Math.random() * 150;
      const startX = centerX;
      const startY = centerY;
      const endX = centerX + Math.cos(angle) * distance;
      const endY = centerY + Math.sin(angle) * distance;
      
      particle.style.cssText = `
        position: absolute;
        left: ${startX}px;
        top: ${startY}px;
        width: ${size}px;
        height: ${size}px;
        pointer-events: none;
        z-index: 100;
        border-radius: 50%;
      `;
      
      // パーティクルタイプ別スタイル（より鮮やか）
      switch (type) {
        case 'sparks':
          particle.style.background = 'radial-gradient(circle, #ffff00, #ff4400)';
          particle.style.boxShadow = '0 0 20px #ffff00';
          break;
        case 'dust':
          particle.style.background = 'radial-gradient(circle, #deb887, #8b4513)';
          particle.style.borderRadius = '30%';
          break;
        case 'debris':
          particle.style.background = 'linear-gradient(45deg, #888, #ddd)';
          particle.style.borderRadius = '20%';
          break;
      }
      
      container.appendChild(particle);
      
      // より派手なアニメーション
      particle.animate([
        { 
          transform: `translate(0px, 0px) scale(0) rotate(0deg)`, 
          opacity: 1,
          left: `${startX}px`,
          top: `${startY}px`
        },
        { 
          transform: `translate(0px, 0px) scale(1.5) rotate(180deg)`, 
          opacity: 0.9,
          left: `${startX + (endX - startX) * 0.3}px`,
          top: `${startY + (endY - startY) * 0.3}px`,
          offset: 0.3 
        },
        { 
          transform: `translate(0px, 0px) scale(1) rotate(360deg)`, 
          opacity: 0.5,
          left: `${endX}px`,
          top: `${endY}px`,
          offset: 0.8 
        },
        { 
          transform: `translate(0px, 0px) scale(0) rotate(540deg)`, 
          opacity: 0,
          left: `${endX}px`,
          top: `${endY}px`
        }
      ], {
        duration: life,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      });
      
      // クリーンアップ
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, life);
    }
  }

  private playSound(params: AnimationParams): void {
    // サウンド再生のスタブ実装
    const soundId = params.id || params.ids;
    const volume = Number(params.vol || params.vols || 0.5);
    
    console.log(`🔊 Playing sound: ${soundId} at volume ${volume}`);
    
    // Web Audio API を使った実装を将来的に追加
    // 現在はログのみ
  }

  private cameraShake(params: AnimationParams): void {
    const element = document.querySelector('.animation-container');
    if (!element) return;

    const duration = Number(params.dur) || 300; // 持続時間を3倍に延長（100→300ms）
    const intensity = Number(params.intensity) || 0.5;
    
    const maxOffset = intensity * 10; // px
    
    element.classList.add('camera-shake');
    (element as HTMLElement).style.setProperty('--shake-intensity', `${maxOffset}px`);
    
    setTimeout(() => {
      element.classList.remove('camera-shake');
    }, duration);
  }

  private cameraZoom(params: AnimationParams): void {
    const element = document.querySelector('.animation-container');
    if (!element) return;

    const target = Number(params.target) || 1.1;
    const duration = Number(params.dur) || 600; // 持続時間を3倍に延長（200→600ms）
    const ease = params.ease || 'ease-out';
    
    (element as HTMLElement).style.transition = `transform ${duration}ms ${ease}`;
    (element as HTMLElement).style.transform = `scale(${target})`;
    
    setTimeout(() => {
      (element as HTMLElement).style.transform = 'scale(1)';
    }, duration);
  }

  private uiCutin(params: AnimationParams): void {
    const text = String(params.text || 'ACTION!');
    const style = params.style || 'medium';
    const duration = Number(params.dur) || 2000; // 持続時間をさらに延長（2秒）
    
    const cutin = document.createElement('div');
    cutin.className = `ui-cutin ui-cutin-${style}`;
    cutin.textContent = text;
    
    cutin.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1000;
      font-weight: 900;
      color: white;
      text-shadow: 
        3px 3px 0px rgba(0,0,0,1),
        -3px -3px 0px rgba(0,0,0,1),
        3px -3px 0px rgba(0,0,0,1),
        -3px 3px 0px rgba(0,0,0,1),
        0px 0px 10px rgba(255,255,255,0.8);
      pointer-events: none;
      background: linear-gradient(45deg, rgba(255,215,0,0.9), rgba(255,140,0,0.9));
      padding: 20px 40px;
      border-radius: 20px;
      border: 4px solid white;
      box-shadow: 0 0 30px rgba(255,215,0,0.8);
    `;
    
    // スタイル別設定
    switch (style) {
      case 'small':
        cutin.style.fontSize = '28px';
        cutin.style.padding = '10px 20px';
        break;
      case 'medium':
        cutin.style.fontSize = '42px';
        cutin.style.padding = '15px 30px';
        break;
      case 'large':
        cutin.style.fontSize = '56px';
        cutin.style.padding = '20px 40px';
        break;
      case 'big':
        cutin.style.fontSize = '72px';
        cutin.style.padding = '25px 50px';
        break;
    }
    
    document.body.appendChild(cutin);
    
    // より派手なアニメーション
    cutin.animate([
      { 
        transform: 'translate(-50%, -50%) scale(0) rotate(-10deg)', 
        opacity: 0,
        filter: 'blur(10px)'
      },
      { 
        transform: 'translate(-50%, -50%) scale(1.3) rotate(2deg)', 
        opacity: 1,
        filter: 'blur(0px)',
        offset: 0.2 
      },
      { 
        transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', 
        opacity: 1,
        filter: 'blur(0px)',
        offset: 0.6 
      },
      { 
        transform: 'translate(-50%, -50%) scale(0.7) rotate(5deg)', 
        opacity: 0,
        filter: 'blur(5px)'
      }
    ], {
      duration: duration,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    });
    
    setTimeout(() => {
      if (cutin.parentNode) {
        cutin.parentNode.removeChild(cutin);
      }
    }, duration);
  }

  private uiFlash(params: AnimationParams): void {
    const color = params.color || 'white';
    const duration = Number(params.dur) || 600; // 持続時間を3倍に延長（200→600ms）
    
    // 全画面フラッシュエフェクト
    const flashOverlay = document.createElement('div');
    flashOverlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: ${color === 'accent' ? '#fbbf24' : color};
      opacity: 0;
      pointer-events: none;
      z-index: 45;
    `;
    
    document.body.appendChild(flashOverlay);
    
    flashOverlay.animate([
      { opacity: 0 },
      { opacity: 0.4, offset: 0.2 },
      { opacity: 0 }
    ], {
      duration: duration,
      easing: 'ease-out'
    });
    
    setTimeout(() => {
      if (flashOverlay.parentNode) {
        flashOverlay.parentNode.removeChild(flashOverlay);
      }
    }, duration);
  }

  private uiScoreBump(params: AnimationParams): void {
    const element = document.querySelector('.score-display');
    if (!element) return;

    const scale = Number(params.scale_to || params.scale) || 1.06;
    const duration = Number(params.dur) || 420; // 持続時間を3倍に延長（140→420ms）
    
    (element as HTMLElement).style.transition = `transform ${duration}ms ease-out`;
    (element as HTMLElement).style.transform = `scale(${scale})`;
    
    setTimeout(() => {
      (element as HTMLElement).style.transform = 'scale(1)';
    }, duration / 2);
  }

  private playerHighlight(params: AnimationParams): void {
    const player = params.player;
    const selector = player === 'winner' ? '.player-winner' : `.player-${player}`;
    const element = document.querySelector(selector);
    
    if (!element) return;

    const scale = Number(params.scale) || 1.05;
    const duration = Number(params.dur) || 300; // 持続時間を3倍に延長（100→300ms）
    
    element.classList.add('player-highlighted');
    (element as HTMLElement).style.transform = `scale(${scale})`;
    
    setTimeout(() => {
      element.classList.remove('player-highlighted');
      (element as HTMLElement).style.transform = 'scale(1)';
    }, duration);
  }

  private playerGlow(params: AnimationParams): void {
    const player = params.player;
    const selector = player === 'winner' ? '.player-winner' : `.player-${player}`;
    const element = document.querySelector(selector);
    
    if (!element) return;

    const color = String(params.color || 'gold');
    const duration = Number(params.dur) || 600; // 持続時間を3倍に延長（200→600ms）
    
    element.classList.add('player-glow');
    (element as HTMLElement).style.setProperty('--glow-color', color);
    
    setTimeout(() => {
      element.classList.remove('player-glow');
    }, duration);
  }

  private playerReaction(params: AnimationParams): void {
    // プレイヤーリアクション表示の実装
    console.log('Player reaction:', params.type);
  }

  private screenPulse(params: AnimationParams): void {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: white;
      opacity: ${params.alpha || 0.1};
      pointer-events: none;
      z-index: 999;
    `;
    
    document.body.appendChild(overlay);
    
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, Number(params.dur) || 150); // 持続時間を3倍に延長（50→150ms）
  }

  private setTimeScale(params: AnimationParams): void {
    // タイムスケール変更（スローモーション効果）
    const scale = params.scale || 1.0;
    const duration = params.dur || 100;
    
    console.log(`⏱️ Time scale: ${scale} for ${duration}ms`);
    // 実装は複雑なので、現在はログのみ
  }

  private overlayVignette(params: AnimationParams): void {
    // ビネット効果
    console.log('Vignette overlay:', params);
  }

  private vibrate(params: AnimationParams): void {
    if ('vibrate' in navigator) {
      const duration = Number(params.dur || params.total_dur) || 50;
      const pattern = Array.isArray(params.pattern) 
        ? (params.pattern as (string | number | boolean)[]).map(Number)
        : [duration];
      navigator.vibrate(pattern);
    }
  }

  private crowdPop(params: AnimationParams): void {
    console.log('🎉 Crowd reaction:', params.vol || 0.5);
  }

  private loopedTrailSequence(params: AnimationParams): void {
    const hits = Number(params.hits) || 5;
    const interval = Number(params.interval) || 100;
    
    for (let i = 0; i < hits; i++) {
      setTimeout(() => {
        this.playTrail({ length: 40, opacity: 0.7 });
      }, i * interval);
    }
  }

  private cleanupFade(params: AnimationParams): void {
    const duration = params.dur || 600; // 持続時間を3倍に延長（200→600ms）
    console.log(`🧹 Cleanup fade: ${duration}ms`);
  }

  // 完了処理
  private completeAnimation(): void {
    this.clearActiveTimeouts();
    console.log('🎬 Animation completed');
    
    if (this.onAnimationComplete) {
      this.onAnimationComplete();
    }
  }

  // スキップ処理
  public skipAnimation(): void {
    this.clearActiveTimeouts();
    this.completeAnimation();
  }

  // クリーンアップ
  private clearActiveTimeouts(): void {
    this.activeTimeouts.forEach(timeout => clearTimeout(timeout));
    this.activeTimeouts.clear();
  }
}

// Intensity計算関数（仕様書より）
export function calculateIntensity(
  situation: string,
  rallyLength: number,
  coachCommandUsed: boolean,
  successProbability: number
): number {
  let intensity = 0;
  
  // ScoreImportance
  if (situation.includes('break_point') || 
      situation.includes('set_point') || 
      situation.includes('match_point')) {
    intensity += 2;
  }
  
  // Coach command
  if (coachCommandUsed) {
    intensity += 1;
  }
  
  // Rally length
  if (rallyLength > 6) {
    intensity += 1;
  }
  
  // Closeness (clutch situations)
  if (Math.abs(successProbability - 0.5) < 0.12) {
    intensity += 1;
  }
  
  return Math.min(intensity, 3);
}

// テンプレート選択関数（重要なポイントのみアニメーション表示）
export function selectAnimationTemplate(
  pointResult: PointResult,
  intensity: number,
  coachCommandUsed: boolean
): string | null {
  
  // 監督介入時は常にアニメーション表示
  if (coachCommandUsed) {
    return intensity >= 2 ? 'coach_success' : 'coach_success_light';
  }
  
  // 重要なポイントのみアニメーション表示
  switch (pointResult.reason) {
    case 'ace':
      // エース（サービスエース）は常にアニメーション
      return intensity >= 3 ? 'cinematic_ace' : 'service_winner';
    case 'service_winner':
      // サービスウィナーもアニメーション
      return 'service_winner';
    case 'return_winner':
      // リターンエース・リターンウィナーはアニメーション
      return intensity >= 2 ? 'strong_finish' : 'medium_hit';
    case 'volley_winner':
    case 'stroke_winner':
      // ウィナー系は重要度の高い時のみ（intensity >= 2）
      if (intensity >= 2) return 'strong_finish';
      return null; // 重要度が低い場合はアニメーションなし
    case 'mental_break':
      // メンタルブレイクは重要度の高い時のみ
      return intensity >= 2 ? 'strong_finish' : null;
    case 'opponent_error':
      // エラーは重要度が非常に高い時のみ（intensity >= 3）
      return intensity >= 3 ? 'error_miss' : null;
    default:
      // その他の通常ポイントは重要度が最高の時のみ
      if (intensity >= 3) {
        // 非常に長いラリーの場合はアニメーション
        if (pointResult.rallyLength && pointResult.rallyLength > 10) {
          return 'long_rally_finish';
        }
        return 'strong_finish';
      }
      return null; // 通常ポイントはアニメーションなし
  }
}