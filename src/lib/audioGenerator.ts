// テスト用音響生成ユーティリティ
// 実際の音源ファイルを取得するまでの一時的な音響効果

export class AudioGenerator {
  private context: AudioContext;

  constructor(context: AudioContext) {
    this.context = context;
  }

  // ラケット打撃音生成（ポップ音）
  generateRacketHit(frequency: number = 800, duration: number = 0.1): AudioBuffer {
    const sampleRate = this.context.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // ポップ音エンベロープ（急激に減衰）
      const envelope = Math.exp(-t * 20);
      // 基本波形 + ノイズ
      const sine = Math.sin(2 * Math.PI * frequency * t);
      const noise = (Math.random() - 0.5) * 0.3;
      data[i] = (sine + noise) * envelope * 0.3;
    }

    return buffer;
  }

  // ボールバウンド音生成（低めのトーン）
  generateBallBounce(frequency: number = 400, duration: number = 0.15): AudioBuffer {
    const sampleRate = this.context.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // ゆるやかな減衰
      const envelope = Math.exp(-t * 8);
      // 低めの音 + 高調波
      const fundamental = Math.sin(2 * Math.PI * frequency * t);
      const harmonic = Math.sin(2 * Math.PI * frequency * 2 * t) * 0.3;
      data[i] = (fundamental + harmonic) * envelope * 0.4;
    }

    return buffer;
  }

  // 勝利音生成（上昇トーン）
  generateVictorySound(startFreq: number = 400, endFreq: number = 800, duration: number = 0.5): AudioBuffer {
    const sampleRate = this.context.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const progress = t / duration;
      
      // 周波数を線形に上昇
      const frequency = startFreq + (endFreq - startFreq) * progress;
      // 明るいエンベロープ
      const envelope = Math.sin(Math.PI * progress) * 0.8;
      
      const sine = Math.sin(2 * Math.PI * frequency * t);
      data[i] = sine * envelope * 0.5;
    }

    return buffer;
  }

  // 歓声音生成（ホワイトノイズベース）
  generateCrowdCheer(intensity: number = 0.5, duration: number = 1.0): AudioBuffer {
    const sampleRate = this.context.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // フェードイン・フェードアウト
      const fadeTime = 0.2;
      let envelope = 1.0;
      if (t < fadeTime) {
        envelope = t / fadeTime;
      } else if (t > duration - fadeTime) {
        envelope = (duration - t) / fadeTime;
      }

      // バンドパス的なノイズ（人の声っぽく）
      const noise = (Math.random() - 0.5) * 2;
      // 低域通過フィルタのような効果
      data[i] = noise * envelope * intensity * 0.3;
    }

    return buffer;
  }

  // UI効果音生成（クリック音）
  generateUIClick(frequency: number = 1000, duration: number = 0.05): AudioBuffer {
    const sampleRate = this.context.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 50); // 非常に短い減衰
      const sine = Math.sin(2 * Math.PI * frequency * t);
      data[i] = sine * envelope * 0.2;
    }

    return buffer;
  }
}

// テスト音源生成ヘルパー
export async function generateTestSounds(context: AudioContext): Promise<Map<string, AudioBuffer>> {
  const generator = new AudioGenerator(context);
  const sounds = new Map<string, AudioBuffer>();

  try {
    // ラケット音（3種類）
    sounds.set('racket_light', generator.generateRacketHit(600, 0.08));
    sounds.set('racket_medium', generator.generateRacketHit(800, 0.1));
    sounds.set('racket_power', generator.generateRacketHit(1000, 0.12));

    // ボール音
    sounds.set('ball_bounce', generator.generateBallBounce(350, 0.15));
    sounds.set('ball_net', generator.generateBallBounce(200, 0.1));

    // 勝利音
    sounds.set('point_won', generator.generateVictorySound(400, 600, 0.3));
    sounds.set('game_won', generator.generateVictorySound(400, 800, 0.5));
    sounds.set('winner_shot', generator.generateVictorySound(500, 1000, 0.6));
    sounds.set('ace_serve', generator.generateVictorySound(600, 1200, 0.7));

    // UI音
    sounds.set('button_click', generator.generateUIClick(1200, 0.05));
    sounds.set('intervention_success', generator.generateVictorySound(800, 1200, 0.4));

    // 観客音
    sounds.set('crowd_light', generator.generateCrowdCheer(0.3, 0.8));
    sounds.set('crowd_excited', generator.generateCrowdCheer(0.6, 1.2));
    sounds.set('crowd_roar', generator.generateCrowdCheer(0.9, 1.5));

    console.log(`🎵 Generated ${sounds.size} test sounds`);
    return sounds;
  } catch (error) {
    console.error('Failed to generate test sounds:', error);
    return sounds;
  }
}