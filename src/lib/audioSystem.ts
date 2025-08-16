// Tennis Game Audio System
// Web Audio API基盤システム

export interface AudioConfig {
  masterVolume: number;     // 0.0 - 1.0
  sfxVolume: number;        // 効果音音量
  musicVolume: number;      // BGM音量
  enabled: boolean;         // 音響有効/無効
}

export interface SoundEffect {
  id: string;
  buffer: AudioBuffer;
  volume: number;
  category: 'sfx' | 'music' | 'voice';
}

export class AudioSystem {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private soundLibrary: Map<string, SoundEffect> = new Map();
  private config: AudioConfig;
  private initialized = false;

  constructor() {
    this.config = {
      masterVolume: 0.7,
      sfxVolume: 0.8,
      musicVolume: 0.5,
      enabled: true
    };
  }

  // Audio Context初期化（ユーザーインタラクション後に呼び出し）
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Web Audio APIサポート確認
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        console.warn('Web Audio API not supported');
        return false;
      }

      this.context = new AudioContext();
      
      // Gain Nodeセットアップ
      this.masterGain = this.context.createGain();
      this.sfxGain = this.context.createGain();
      this.musicGain = this.context.createGain();

      // 音量設定
      this.masterGain.gain.value = this.config.masterVolume;
      this.sfxGain.gain.value = this.config.sfxVolume;
      this.musicGain.gain.value = this.config.musicVolume;

      // ルーティング設定
      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.context.destination);

      this.initialized = true;
      console.log('🔊 Audio System initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Audio System:', error);
      return false;
    }
  }

  // 音響ファイルのプリロード
  async loadSound(id: string, url: string, volume: number = 1.0, category: 'sfx' | 'music' | 'voice' = 'sfx'): Promise<boolean> {
    if (!this.context) {
      console.warn('Audio context not initialized');
      return false;
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);

      const soundEffect: SoundEffect = {
        id,
        buffer: audioBuffer,
        volume,
        category
      };

      this.soundLibrary.set(id, soundEffect);
      console.log(`🎵 Loaded sound: ${id}`);
      return true;
    } catch (error) {
      console.error(`Failed to load sound ${id}:`, error);
      return false;
    }
  }

  // AudioBufferから直接音響効果を登録
  loadSoundFromBuffer(id: string, buffer: AudioBuffer, volume: number = 1.0, category: 'sfx' | 'music' | 'voice' = 'sfx'): void {
    const soundEffect: SoundEffect = {
      id,
      buffer,
      volume,
      category
    };

    this.soundLibrary.set(id, soundEffect);
    console.log(`🎵 Loaded generated sound: ${id}`);
  }

  // 効果音再生
  playSound(id: string, volume?: number, playbackRate: number = 1.0): void {
    if (!this.config.enabled || !this.context || !this.initialized) return;

    const sound = this.soundLibrary.get(id);
    if (!sound) {
      console.warn(`Sound not found: ${id}`);
      return;
    }

    try {
      // AudioBufferSourceNode作成
      const source = this.context.createBufferSource();
      const gainNode = this.context.createGain();

      source.buffer = sound.buffer;
      source.playbackRate.value = playbackRate;

      // 音量設定
      const effectiveVolume = (volume ?? sound.volume) * this.getVolumeMultiplier(sound.category);
      gainNode.gain.value = effectiveVolume;

      // ルーティング
      source.connect(gainNode);
      gainNode.connect(this.getGainNode(sound.category));

      // 再生
      source.start(0);
      
      console.log(`🔊 Playing: ${id} (volume: ${effectiveVolume.toFixed(2)})`);
    } catch (error) {
      console.error(`Failed to play sound ${id}:`, error);
    }
  }

  // ランダムピッチで再生（同じ音の繰り返しを防ぐ）
  playSoundWithRandomPitch(id: string, volume?: number, pitchVariation: number = 0.1): void {
    const randomPitch = 1.0 + (Math.random() - 0.5) * 2 * pitchVariation;
    this.playSound(id, volume, randomPitch);
  }

  // 音量設定
  setVolume(type: 'master' | 'sfx' | 'music', volume: number): void {
    volume = Math.max(0, Math.min(1, volume)); // 0-1にクランプ

    switch (type) {
      case 'master':
        this.config.masterVolume = volume;
        if (this.masterGain) this.masterGain.gain.value = volume;
        break;
      case 'sfx':
        this.config.sfxVolume = volume;
        if (this.sfxGain) this.sfxGain.gain.value = volume;
        break;
      case 'music':
        this.config.musicVolume = volume;
        if (this.musicGain) this.musicGain.gain.value = volume;
        break;
    }
  }

  // 音響有効/無効切り替え
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (this.masterGain) {
      this.masterGain.gain.value = enabled ? this.config.masterVolume : 0;
    }
  }

  // プリロード済み音響リスト取得
  getLoadedSounds(): string[] {
    return Array.from(this.soundLibrary.keys());
  }

  // 音響設定取得
  getConfig(): AudioConfig {
    return { ...this.config };
  }

  // プライベートメソッド
  private getGainNode(category: 'sfx' | 'music' | 'voice'): GainNode {
    switch (category) {
      case 'music':
        return this.musicGain!;
      case 'sfx':
      case 'voice':
      default:
        return this.sfxGain!;
    }
  }

  private getVolumeMultiplier(category: 'sfx' | 'music' | 'voice'): number {
    switch (category) {
      case 'music':
        return this.config.musicVolume;
      case 'sfx':
      case 'voice':
      default:
        return this.config.sfxVolume;
    }
  }

  // クリーンアップ
  destroy(): void {
    if (this.context && this.context.state !== 'closed') {
      this.context.close();
    }
    this.soundLibrary.clear();
    this.initialized = false;
    console.log('🔇 Audio System destroyed');
  }
}

// シングルトンインスタンス
export const audioSystem = new AudioSystem();

// テニス専用音響効果定義
export const TENNIS_SOUNDS = {
  // ラケット打撃音
  RACKET_LIGHT: 'racket_light',
  RACKET_MEDIUM: 'racket_medium', 
  RACKET_POWER: 'racket_power',
  
  // ボール音
  BALL_BOUNCE: 'ball_bounce',
  BALL_NET: 'ball_net',
  BALL_OUT: 'ball_out',
  
  // 勝利音
  POINT_WON: 'point_won',
  GAME_WON: 'game_won',
  SET_WON: 'set_won',
  MATCH_WON: 'match_won',
  
  // 特殊効果
  ACE_SERVE: 'ace_serve',
  WINNER_SHOT: 'winner_shot',
  CRITICAL_HIT: 'critical_hit',
  
  // UI音
  BUTTON_CLICK: 'button_click',
  MENU_SELECT: 'menu_select',
  INTERVENTION_AVAILABLE: 'intervention_available',
  INTERVENTION_SUCCESS: 'intervention_success',
  
  // 観客
  CROWD_LIGHT: 'crowd_light',
  CROWD_EXCITED: 'crowd_excited',
  CROWD_ROAR: 'crowd_roar'
} as const;