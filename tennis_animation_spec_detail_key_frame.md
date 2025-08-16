# テニス演出（アニメーション）仕様書 — 各テンプレの詳細キーフレーム表

## 概要

この文書は、テニス試合の1ポイント演出に使う各テンプレート（Light / Medium / Strong / Cinematic）の\*\*実装用キーフレーム表（ms 単位）\*\*を記述したものです。描画エンジンは simulate\_point の出力（result\_reason, intensity 等）を受け取り、各テンプレートを再生します。各キーフレームは `t` がポイント演出開始からの相対時間（ミリ秒）です。

---

# A: 各テンプレの詳細キーフレーム表（実装用）

> 共通注意
>
> - `t` は ms。すべて相対時間。\
>
> - イージングは主要トランスフォームにのみ記載（例: easeOutCubic）。\
>
> - パーティクル・トレイル等はプール化して再利用すること。\
>

### A.1 Light Hit (intensity = 0)

- **目的**: 日常のラリーや小さなヒット。軽いフィードバックでテンポを壊さない。
- **Duration**: 140 ms
- **Keyframes**:
  - t=0: play\_trail(length=30, opacity=0.9, color="white")
  - t=0: spawn\_particles(type="dust", count=6, size=6, life=120)
  - t=0: play\_sound(id="hit\_light", vol=0.45)
  - t=10: player\_highlight(player=winner, scale=1.03, ease="easeOutQuad", dur=110)
  - t=0..140: ui\_score\_bump(scale: 1.0 -> 1.06 @40ms -> 1.0 @140ms, ease="easeOutCubic")
- **Camera**: none
- **Haptics**: none
- **Notes**: 粒子は小さく短命。低負荷モードでは particles disabled。

---

### A.2 Medium Hit (intensity = 1)

- **目的**: 有利なショットや強めの返球。視覚・触覚で明瞭な手触りを与える。
- **Duration**: 260 ms
- **Keyframes**:
  - t=0: play\_trail(length=80, trail\_color="white", opacity=0.95)
  - t=0: spawn\_particles(type="sparks", count=16, size=10, life=180)
  - t=0: play\_sound(ids=["whoosh\_short","hit\_mid"], vols=[0.5,0.7])
  - t=20: camera\_shake(dur=60, intensity=0.6, ease="linear")
  - t=40: player\_glow(player=winner, color="warm", alpha:0.8 -> 0 @220ms)
  - t=80: ui\_flash(color="accent", dur=120)
  - t=40: vibrate(dur=40)
- **Camera**: light shake
- **Haptics**: short pulse
- **Notes**: trail と particles は intensity に準じて scale 可能。

---

### A.3 Strong Finish (intensity = 2)

- **目的**: 決定打や鮮烈な得点。視覚・音響を重ねて爽快感を演出。
- **Duration**: 420 ms
- **Keyframes**:
  - t=0: screen\_pulse(alpha=0.06, dur=30)
  - t=30: play\_trail(length=140, glow=true)
  - t=30: spawn\_particles(type=["sparks","dust"], counts=[24,18], life=[260,200])
  - t=120: play\_sound(ids=["impact\_punch","snap\_high"], vols=[1.0,0.8])
  - t=120: camera\_zoom(target=1.08, dur=120, ease="easeOutCubic")
  - t=120: camera\_shake(dur=120, intensity=0.85)
  - t=200: ui\_cutin(text="POINT!", style="large", dur=220)
  - t=200: crowd\_pop(vol=0.6)
  - t=260: vibrate(pattern=[40,20], total\_dur=60)
- **Camera**: zoom + strong shake
- **Haptics**: medium double pulse
- **Audio**: apply audio ducking on stinger

---

### A.4 Cinematic (intensity = 3)

- **目的**: ACE、セット/マッチ決定、コーチ指示の成功など、特別なクラッチ演出。
- **Duration**: variable 700–1200 ms (例: 900 ms)
- **Example Keyframes (900ms flow)**:
  - t=0: set\_time\_scale(scale=0.6, dur=160) // slow-in
  - t=0: overlay\_vignette(alpha=0.15, dur=160)
  - t=160: play\_trail(length=220, glow=true, chroma\_shift=true)
  - t=160: spawn\_particles(types=["sparks","debris","shine"], counts=[40,30,12], life=[400,350,600])
  - t=360: play\_sound(id="cinematic\_sting\_full", vol=1.0)
  - t=360: camera\_zoom(target=1.12, dur=200, ease="easeOutQuart")
  - t=360: camera\_shake(dur=200, intensity=1.0)
  - t=520: ui\_cutin\_big(text="ACE!" or command\_name, dur=400, anim\_in=300, anim\_out=200)
  - t=520: play\_short\_bgm\_snippet(id="victory\_snip", dur=600)
  - t=720: set\_time\_scale(scale=1.0, dur=120)
  - t=900: cleanup\_fade(dur=200)
- **Haptics**: 3-phase heavy pulses at t=360, 520, 700
- **Notes**: 事前に stinger / bgm をプリロードしレイテンシを防ぐ。頻度は抑制。

---

# B: 演出データライブラリ（JSON） — 10パターンサンプル

- 目的: 再生エンジンに投入できる `timeline` 構造のサンプル集。
- 各オブジェクトは `point_index`, `template`, `timeline` を持つ。

```json
[
  {
    "point_index": 1,
    "template": "light_hit",
    "timeline": [
      {"t":0, "action":"play_trail", "params":{"length":30}},
      {"t":0, "action":"spawn_particles", "params":{"type":"dust","count":6}},
      {"t":0, "action":"play_sound", "params":{"id":"hit_light"}},
      {"t":10, "action":"player_highlight", "params":{"player":"winner","scale":1.03,"dur":110}},
      {"t":0, "action":"ui_score_bump", "params":{"scale":1.06,"dur":140}}
    ]
  },
  {
    "point_index": 2,
    "template": "medium_hit",
    "timeline": [
      {"t":0, "action":"play_trail", "params":{"length":80}},
      {"t":0, "action":"spawn_particles", "params":{"type":"sparks","count":16}},
      {"t":0, "action":"play_sound", "params":{"id":"whoosh_short"}},
      {"t":20, "action":"camera_shake", "params":{"dur":60, "intensity":0.6}},
      {"t":40, "action":"vibrate", "params":{"dur":40}}
    ]
  },
  {
    "point_index": 3,
    "template": "medium_hit_variant",
    "timeline": [
      {"t":0, "action":"play_trail", "params":{"length":70}},
      {"t":0, "action":"spawn_particles", "params":{"type":"dust","count":10}},
      {"t":30, "action":"play_sound", "params":{"id":"hit_mid"}},
      {"t":60, "action":"ui_flash", "params":{"color":"accent","dur":100}}
    ]
  },
  {
    "point_index": 4,
    "template": "strong_finish",
    "timeline": [
      {"t":0, "action":"screen_pulse", "params":{"alpha":0.06, "dur":30}},
      {"t":30, "action":"play_trail", "params":{"length":140}},
      {"t":30, "action":"spawn_particles", "params":{"type":"sparks","count":24}},
      {"t":120, "action":"play_sound", "params":{"id":"impact_punch"}},
      {"t":120, "action":"camera_shake", "params":{"dur":120, "intensity":0.85}},
      {"t":200, "action":"ui_cutin", "params":{"text":"POINT!", "style":"large"}}
    ]
  },
  {
    "point_index": 5,
    "template": "cinematic_ace",
    "timeline": [
      {"t":0, "action":"set_time_scale", "params":{"scale":0.6, "dur":160}},
      {"t":160, "action":"play_trail", "params":{"length":220}},
      {"t":360, "action":"play_sound", "params":{"id":"cinematic_sting_full"}},
      {"t":360, "action":"camera_zoom", "params":{"target":1.12, "dur":200}},
      {"t":520, "action":"ui_cutin", "params":{"text":"ACE!", "style":"big"}}
    ]
  },
  {
    "point_index": 6,
    "template": "coach_success",
    "timeline": [
      {"t":0, "action":"play_trail", "params":{"length":100}},
      {"t":40, "action":"play_sound", "params":{"id":"coach_activate"}},
      {"t":160, "action":"ui_cutin", "params":{"text":"COMMAND!", "style":"medium"}},
      {"t":260, "action":"play_sound", "params":{"id":"coach_success_sting"}},
      {"t":260, "action":"camera_shake", "params":{"dur":120, "intensity":0.7}}
    ]
  },
  {
    "point_index": 7,
    "template": "coach_fail",
    "timeline": [
      {"t":0, "action":"play_trail", "params":{"length":60}},
      {"t":40, "action":"play_sound", "params":{"id":"coach_fail_tone"}},
      {"t":120, "action":"ui_cutin", "params":{"text":"FAILED", "style":"small"}},
      {"t":160, "action":"vibrate", "params":{"dur":80}}
    ]
  },
  {
    "point_index": 8,
    "template": "long_rally_finish",
    "timeline": [
      {"t":0, "action":"looped_trail_sequence", "params":{"hits":8, "interval":80}},
      {"t":640, "action":"play_sound", "params":{"id":"final_impact"}},
      {"t":660, "action":"spawn_particles", "params":{"type":"dust","count":30}},
      {"t":700, "action":"ui_cutin", "params":{"text":"LONG RALLY!", "style":"large"}}
    ]
  },
  {
    "point_index": 9,
    "template": "service_winner",
    "timeline": [
      {"t":0, "action":"play_trail", "params":{"length":180}},
      {"t":40, "action":"play_sound", "params":{"id":"serve_whoosh"}},
      {"t":120, "action":"play_sound", "params":{"id":"service_winner_sting"}},
      {"t":160, "action":"ui_cutin", "params":{"text":"SERVICE WINNER", "style":"medium"}}
    ]
  },
  {
    "point_index": 10,
    "template": "error_miss",
    "timeline": [
      {"t":0, "action":"play_trail", "params":{"length":30}},
      {"t":60, "action":"play_sound", "params":{"id":"miss_tone"}},
      {"t":120, "action":"player_reaction", "params":{"type":"disappointed", "dur":300}},
      {"t":200, "action":"ui_cutin", "params":{"text":"ERR!", "style":"small"}}
    ]
  }
]
```

---

# C: 実装メモ（早見）

- `timeline` を実行するスケジューラは ms 精度でアクションを dispatch する。\

- 支援アクション（looped\_trail\_sequence など）はエンジン側で展開してから実行する。\

- 音はレイヤードで再生、スティング時に短く他音を ducking する。

*end of document*

