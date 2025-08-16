# 音源置き換え実装ガイド

## 概要
現在のシステムはWeb Audio APIによる生成音源を使用していますが、実際の音源ファイルへの置き換えを想定した設計になっています。

## 現在の音響システム構成

### 1. 音源管理
- `src/lib/audioSystem.ts` - 基本音響システム
- `src/lib/audioGenerator.ts` - 生成音源（置き換え対象）
- `src/lib/gameAudioManager.ts` - ゲーム音響管理

### 2. 置き換え対象の音源

```typescript
// 現在の生成音源（置き換え推奨順）
const GENERATED_SOUNDS = {
  // 高優先度（頻繁に使用）
  RACKET_LIGHT: 'ラケット軽打音',
  RACKET_MEDIUM: 'ラケット中打音', 
  RACKET_POWER: 'ラケット強打音',
  BALL_BOUNCE: 'ボールバウンド音',
  BUTTON_CLICK: 'ボタンクリック音',
  
  // 中優先度（ゲーム体験向上）
  ACE_SERVE: 'エースサーブ音',
  WINNER_SHOT: 'ウィナーショット音',
  BALL_NET: 'ボールネット音',
  
  // 低優先度（雰囲気作り）
  CROWD_LIGHT: '観客軽い反応',
  CROWD_EXCITED: '観客興奮',
  CROWD_ROAR: '観客大歓声',
  GAME_WON: 'ゲーム勝利音',
  INTERVENTION_SUCCESS: '介入成功音'
};
```

## 実装手順

### Phase 1: 音源ファイル準備
```
1. 音源ファイル取得
   - 推奨形式: OGG Vorbis (.ogg)
   - 互換用: MP3 (.mp3)
   - ファイルサイズ: 50-500KB/音源
   - 長さ: 0.1-5秒

2. ディレクトリ構成
   public/
   └── audio/
       ├── sfx/          # 効果音
       ├── game/         # ゲーム音
       ├── crowd/        # 観客音
       └── ui/           # UI音
```

### Phase 2: AudioSystem修正
```typescript
// src/lib/audioAssets.ts（新規作成）
export const AUDIO_FILES = {
  RACKET_LIGHT: '/audio/sfx/racket_light.ogg',
  RACKET_MEDIUM: '/audio/sfx/racket_medium.ogg',
  RACKET_POWER: '/audio/sfx/racket_power.ogg',
  // ... 他の音源
};

// src/lib/audioSystem.ts 修正点
class AudioSystem {
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  
  // ファイル読み込み機能追加
  async loadAudioFile(id: string, url: string): Promise<void> {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context!.decodeAudioData(arrayBuffer);
      this.audioBuffers.set(id, audioBuffer);
    } catch (error) {
      console.warn(`Failed to load audio file ${url}, falling back to generated sound`);
      // 生成音源にフォールバック
    }
  }
}
```

### Phase 3: 段階的置き換え
```typescript
// src/lib/audioMigration.ts（新規作成）
export class AudioMigration {
  static async initializeAudioSources(): Promise<void> {
    const audioSystem = getAudioSystem();
    
    // 優先度順に読み込み
    for (const [id, url] of Object.entries(AUDIO_FILES)) {
      try {
        await audioSystem.loadAudioFile(id, url);
        console.log(`✅ Loaded real audio: ${id}`);
      } catch (error) {
        console.log(`⚠️ Using generated audio for: ${id}`);
        // 既存の生成音源を継続使用
      }
    }
  }
}
```

## 考慮事項

### 1. パフォーマンス
- **初回読み込み時間**: 音源ファイル数×平均ファイルサイズ
- **メモリ使用量**: 全音源を展開すると10-50MB程度
- **対策**: 遅延読み込み、重要度別プリロード

### 2. 互換性
- **ブラウザ対応**: OGG非対応ブラウザ用にMP3フォールバック
- **モバイル対応**: iOS Safari の Audio Context制限
- **ネットワーク**: 低速回線でのタイムアウト処理

### 3. ライセンス管理
```typescript
// src/lib/audioLicenses.ts
export const AUDIO_LICENSES = {
  'racket_hit.ogg': {
    source: 'Freesound.org',
    author: 'username',
    license: 'CC0',
    url: 'https://freesound.org/s/12345/'
  },
  // 各音源のライセンス情報
};
```

### 4. 設定とフォールバック
```typescript
// 音響設定
interface AudioConfig {
  useRealAudio: boolean;        // 実音源使用フラグ
  fallbackToGenerated: boolean; // 生成音源フォールバック
  preloadStrategy: 'all' | 'priority' | 'lazy';
}

// 実装例
class HybridAudioSystem {
  async playSound(soundId: string, volume: number): Promise<void> {
    // 1. 実音源を試す
    if (this.config.useRealAudio && this.hasRealAudio(soundId)) {
      return this.playRealAudio(soundId, volume);
    }
    
    // 2. 生成音源にフォールバック
    if (this.config.fallbackToGenerated) {
      return this.playGeneratedAudio(soundId, volume);
    }
    
    // 3. 無音
    console.warn(`No audio available for: ${soundId}`);
  }
}
```

## 実装タイミング

### 推奨順序
1. **UI音から開始** - 頻度高、ファイルサイズ小
2. **ラケット音** - ゲーム体験への影響大
3. **観客音** - 雰囲気向上
4. **BGM・環境音** - 最後に実装

### テスト方法
```typescript
// 音響テストスイート
describe('Audio System Migration', () => {
  test('実音源読み込み成功', async () => {
    await audioSystem.loadAudioFile('TEST_SOUND', '/test/sound.ogg');
    expect(audioSystem.hasSound('TEST_SOUND')).toBe(true);
  });
  
  test('フォールバック動作', async () => {
    // 存在しないファイルでテスト
    await audioSystem.loadAudioFile('MISSING', '/missing.ogg');
    // 生成音源が使用されることを確認
  });
});
```

## 今後の拡張性

### 1. 音響品質設定
- 高品質モード（OGG 192kbps）
- 標準モード（OGG 128kbps）  
- 軽量モード（生成音源）

### 2. 動的音源管理
- 使用頻度に基づく自動プリロード
- メモリ使用量監視と自動解放
- ユーザー設定による音源選択

### 3. カスタム音源対応
- ユーザーが独自音源をアップロード
- 音源パック機能
- コミュニティ共有システム

現在の生成音源システムは軽量で信頼性が高いため、実音源は段階的に導入し、両方のシステムを共存させることを推奨します。