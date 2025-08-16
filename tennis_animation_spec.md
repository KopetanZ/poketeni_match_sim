# テニス演出（アニメーション）仕様書

## 目的

この仕様書は、テニス試合シミュレーションにおける\*\*1ポイントのグラフィカル演出（アニメーション／SFX／ハプティクス）\*\*を詳細に定義します。シミュレーション結果を先行して受け取り、後追いで再生する方式を前提に、場面ごとのメリハリ（軽・中・強・シネマティック）を作り、ユーザーの爽快感（Game Feel／Juice）を最大化しつつ疲労や煩雑さを防ぐ設計を目指します。

---

## 要約（キーポイント）

- **結果先行再生**：サーバー側のシミュレーションが「勝者・ラリー長・勝ち筋・intensity」を返し、描画はそれに基づくテンプレ再生のみ行う。結果の一貫性を担保。
- **演出のレイヤ化**：コア（ボール/選手）・パーティクル・カメラ・UIカットイン・サウンド・ハプティクスを分離して組合せる。
- **メリハリ（Intensity）管理**：自動算出ルールで演出強度を 0..3 に分類（0=Light,1=Medium,2=Strong,3=Cinematic）。派手演出は重要局面のみに限定。
- **パフォーマンス配慮**：プール化・低品質モード・音のダッキング等で軽量化。

---

## 1. シミュレーション→演出インターフェース

シミュ側（simulate\_point）が返すべき最小データ：

```json
{
  "point_index": 123,
  "server": "A",
  "winner": "A",
  "rally_length": 7,
  "result_reason": "long_rally_finish", // values: ace, service_winner, volley_finish, long_rally_finish, forced_error
  "intensity": 2, // 0..3
  "coach_command_used": "Serve & Volley" || null,
  "stat_snapshots": {"before": {...}, "after": {...}}
}
```

**描画側はこのオブジェクトを受け取り、**``** と **``** からテンプレートを選んで再生する。**

---

## 2. 演出レイヤと役割

1. **コアアニメーション（必須）**
   - ボールの軌跡（position, speed, trail）
   - 選手の簡易モーション（打つ、素早くステップ、前進など）
   - 必ず再生（結果の可視化）
2. **パーティクル／エフェクト（任意）**
   - ヒットのスパーク、砂埃、スピードライン
   - intensity に応じて粒数・サイズを変える
3. **カメラ操作**
   - 軽いパン/ズーム/シェイク（短時間）でインパクトを強化
4. **UIカットイン／テキスト**
   - 指示発動やACE等で短く表示（300–600ms）
5. **サウンド**
   - ヒット音（レイヤード）、スティング（重要時）、観客反応（小）
6. **ハプティクス（モバイル）**
   - 重要時のみ短振動（50–120ms）、通常は無効化可能

---

## 3. Intensity（演出強度）の決定ルール

自動で intensity を算出する簡易式（実装例）：

```
intensity = clamp( base + SI + coach + rally + closeness, 0, 3 )

where
  base = 0
  SI (ScoreImportance) = 2 if (break/set/match point) else 0
  coach = 1 if coach_command_used else 0
  rally = 1 if rally_length > 6 else 0
  closeness = 1 if abs(P_success - 0.5) < 0.12 (クラッチ) else 0
```

- `P_success` はシミュレーション内の勝率指標（攻撃側の計算上の有利度）
- このルールはプロトタイプ。数値はチューニング可能

---

## 4. テンプレート（プリセット）一覧とタイムライン

以下はテンプレートごとの\*\*時間軸（ms）\*\*付き実装指示。各キーフレームは相対時間。

### 4.1 Light Hit（通常ショット） — intensity 0

- Duration: 140ms
- Timeline:
  - 0ms: ボールトレイル短（30ms tail）再生、ヒットパーティクル small spawn (6)
  - 0–30ms: 軽いヒット音（layered: high\_snap 0.8, low\_impact 0.2）
  - 0–140ms: UI score small bump（scale 1.0→1.06→1.0）
- Camera: none
- Haptics: none

### 4.2 Medium Hit（強打/有利なショット） — intensity 1

- Duration: 260ms
- Timeline:
  - 0ms: ボールトレイル長め（60–100ms tail）、中粒パーティクル spawn (16)
  - 0–20ms: short whoosh
  - 20–80ms: impact sound (mid punch) + light camera shake (duration 60ms, intensity 0.6)
  - 80–260ms: small glow on winner player -> fade
  - UI: score flash (colour flash 120ms)
- Haptics: short pulse 40ms on winner device

### 4.3 Strong Finish（決定打） — intensity 2

- Duration: 420ms
- Timeline:
  - 0ms: pre-anticipation flash (30ms) — 画面が一瞬暗転で注目
  - 30–120ms: long trail (120ms)、particle layers ×2（sparks + dust）
  - 120–200ms: impact stinger (low punch + high snap), camera shake (120ms) + slight zoom (1.08)
  - 200–420ms: result reveal: large UI badge（"Point!"）カットイン
  - 200–420ms: crowd pop (scaled by importance)
- Haptics: double pulse (60ms + 40ms)

### 4.4 Cinematic（クラッチ／ACE／コマンド成功） — intensity 3

- Duration: 700–1200ms（状況により可変）
- Timeline:
  - 0ms: slow-in (0.6x) 160ms — 軽いスローモーションで緊張感
  - 160–360ms: long trail + multiple particle layers（heavy）
  - 360–520ms: massive impact stinger (orchestral/ brass + cinematic sting)、camera zoom 1.12、shake 200ms
  - 520–900ms: カットイン（"ACE!" / コマンド名） & score reveal animation
  - 900–1200ms: 短いBGMフレーズ or sting fade out
- Haptics: 3フェイズ振動（重め）

---

## 5. カットイン／UIの運用ルール

- **トリガー**: coach command 使用時、ACE、セット/マッチ決定、明確なクラッチ（intensity 3）時のみ表示。
- **頻度制御**: 1マッチ中にカットインは 3〜6 回に制限（ユーザー設定で制限可能）。
- **デザイン**: 短く、アニメは 300–600ms、色はチームカラーに準じる。音量は SFX をダッキングして優先的に鳴らす。

---

## 6. サウンド設計（実践指示）

- ヒット音は **レイヤード**：low\_impact (sub) + high\_snap (presence) + whoosh (velocity) 。各レイヤーのボリュームは intensity に比例して上げる。
- **スティング**（重要時用）: 短い楽器フレーズ（100–400ms）を用意。頻度は稀に。
- **観客音**: 小さめの "pop" をポイント時に鳴らす。セット/マッチ決定時はフルの歓声を流す。
- **ダッキング**: スティング再生時は他のSFXを 60–80% に抑える。

推奨フォーマット: Web/モバイルは OGG/MP3（短い）、WAV（高品質）を併用。ミドルウェア：Wwise/FMOD（可能なら）。

---

## 7. パフォーマンス設計と実装注意点

- **エフェクトプール**: パーティクル、トレイル、スプライトは使い回す（プール化）
- **バッチ処理**: GPU スプライトはできるだけバッチで描画
- **低品質モード**: パーティクル数・シェーダを削減、カメラ演出OFF、ハプティクスOFF
- **オーディオ負荷**: レイヤごとの再生ポリシー（同時音数上限）を設ける
- **メモリ**: アセットプリロードとキャッシュでロード遅延を禁止

---

## 8. 演出データ仕様（JSON） — 再生エンジン向け

例: 一つのポイントに紐づく演出スクリプト（再生側は timeline を逐次実行）

```json
{
  "point_index": 12,
  "template": "strong_finish",
  "timeline": [
    {"t": 0, "action": "play_trail", "params": {"length": 120}},
    {"t": 120, "action": "spawn_particles", "params": {"type": "sparks", "count": 30}},
    {"t": 120, "action": "play_sound", "params": {"id": "impact_punch"}},
    {"t": 140, "action": "camera_shake", "params": {"duration": 120, "intensity": 0.7}},
    {"t": 200, "action": "ui_cutin", "params": {"text": "POINT!", "style": "big"}}
  ]
}
```

- `t` は ms（ポイント再生開始からの相対時間）。
- `action` の種類: play\_trail, spawn\_particles, play\_sound, camera\_shake, ui\_cutin, score\_update, vibrate

---

## 9. 低負荷／Accessibility オプション

- 低品質: particleCount ×0.25、cameraShake = false、trailLength ×0.5、haptics off
- 無音モード: SFX 全オフ（字幕と UI アニメで代替）
- 色弱対応: 色以外（形・アイコン）で重要表現を補助

---

## 10. テスト計画

1. 技術テスト: 各テンプレを 30fps 以上で描画できるか確認（PC/Mobile）
2. ユーザーテスト: 5–10 人で A/B テスト（Light vs Medium 多用）を実施し、「心地よさ」「うるささ」を評価する
3. バランステスト: シミュ結果（intensity分布）を解析し、演出の発生頻度が想定内か確認

---

## 11. 開発マイルストーン（実装優先度）

1. シミュ側に `intensity` を実装してログに含める（必須）
2. 描画エンジンに timeline 実行器を実装（action dispatcher）
3. Light/Medium テンプレの実装とプロファイル測定
4. Strong/Cinematic の完成と UX テスト
5. 低負荷／Accessibility 機能の整備

---

## 12. 参考資料（読み物・概念）

- "Game Feel"（Steve Swink） — 操作感・演出の理論
- "Juice" 論（Gaffer on Games 等） — 小さなアニメでの快感設計
- NN/g のモーションUX（アニメーションは控えめに・意味のある使い方）

---
