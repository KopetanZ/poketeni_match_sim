// アニメーションテンプレートデータ（提供されたJSONベース）

export interface AnimationTemplateData {
  point_index?: number;
  template: string;
  timeline: Array<{
    t: number;
    action: string;
    params: Record<string, string | number | boolean | (string | number | boolean)[]>;
  }>;
}

// 提供されたJSONデータをベースにしたテンプレート
export const ANIMATION_TEMPLATE_DATA: Record<string, AnimationTemplateData> = {
  light_hit: {
    template: "light_hit",
    timeline: [
      {
        t: 0,
        action: "play_trail",
        params: {
          length: 30,
          opacity: 0.9
        }
      },
      {
        t: 0,
        action: "spawn_particles",
        params: {
          type: "dust",
          count: 6,
          size: 6,
          life: 120
        }
      },
      {
        t: 0,
        action: "play_sound",
        params: {
          id: "hit_light",
          vol: 0.45
        }
      },
      {
        t: 10,
        action: "player_highlight",
        params: {
          player: "winner",
          scale: 1.03,
          ease: "easeOutQuad",
          dur: 110
        }
      },
      {
        t: 0,
        action: "ui_score_bump",
        params: {
          scale_to: 1.06,
          dur: 140,
          ease: "easeOutCubic"
        }
      }
    ]
  },

  medium_hit: {
    template: "medium_hit",
    timeline: [
      {
        t: 0,
        action: "play_trail",
        params: {
          length: 80,
          opacity: 0.95
        }
      },
      {
        t: 0,
        action: "spawn_particles",
        params: {
          type: "sparks",
          count: 16,
          size: 10,
          life: 180
        }
      },
      {
        t: 0,
        action: "play_sound",
        params: {
          id: "whoosh_short",
          vol: 0.5
        }
      },
      {
        t: 0,
        action: "play_sound",
        params: {
          id: "hit_mid",
          vol: 0.7
        }
      },
      {
        t: 20,
        action: "camera_shake",
        params: {
          dur: 60,
          intensity: 0.6
        }
      },
      {
        t: 40,
        action: "player_glow",
        params: {
          player: "winner",
          color: "warm",
          alpha_from: 0.8,
          alpha_to: 0.0,
          dur: 180
        }
      },
      {
        t: 80,
        action: "ui_flash",
        params: {
          color: "accent",
          dur: 120
        }
      },
      {
        t: 40,
        action: "vibrate",
        params: {
          dur: 40
        }
      }
    ]
  },

  medium_hit_variant: {
    template: "medium_hit_variant",
    timeline: [
      {
        t: 0,
        action: "play_trail",
        params: {
          length: 70
        }
      },
      {
        t: 0,
        action: "spawn_particles",
        params: {
          type: "dust",
          count: 10
        }
      },
      {
        t: 30,
        action: "play_sound",
        params: {
          id: "hit_mid",
          vol: 0.8
        }
      },
      {
        t: 60,
        action: "ui_flash",
        params: {
          color: "accent",
          dur: 100
        }
      }
    ]
  },

  strong_finish: {
    template: "strong_finish",
    timeline: [
      {
        t: 0,
        action: "screen_pulse",
        params: {
          alpha: 0.06,
          dur: 30
        }
      },
      {
        t: 30,
        action: "play_trail",
        params: {
          length: 140,
          glow: true
        }
      },
      {
        t: 30,
        action: "spawn_particles",
        params: {
          type: "sparks",
          count: 24
        }
      },
      {
        t: 30,
        action: "spawn_particles",
        params: {
          type: "dust",
          count: 18
        }
      },
      {
        t: 120,
        action: "play_sound",
        params: {
          id: "impact_punch",
          vol: 1.0
        }
      },
      {
        t: 120,
        action: "play_sound",
        params: {
          id: "snap_high",
          vol: 0.8
        }
      },
      {
        t: 120,
        action: "camera_zoom",
        params: {
          target: 1.08,
          dur: 120,
          ease: "easeOutCubic"
        }
      },
      {
        t: 120,
        action: "camera_shake",
        params: {
          dur: 120,
          intensity: 0.85
        }
      },
      {
        t: 200,
        action: "ui_cutin",
        params: {
          text: "POINT!",
          style: "large",
          dur: 220
        }
      },
      {
        t: 200,
        action: "crowd_pop",
        params: {
          vol: 0.6
        }
      },
      {
        t: 260,
        action: "vibrate",
        params: {
          pattern: [40, 20],
          total_dur: 60
        }
      }
    ]
  },

  cinematic_ace: {
    template: "cinematic_ace",
    timeline: [
      {
        t: 0,
        action: "set_time_scale",
        params: {
          scale: 0.6,
          dur: 160
        }
      },
      {
        t: 0,
        action: "overlay_vignette",
        params: {
          alpha: 0.15,
          dur: 160
        }
      },
      {
        t: 160,
        action: "play_trail",
        params: {
          length: 220,
          glow: true,
          chroma_shift: true
        }
      },
      {
        t: 360,
        action: "play_sound",
        params: {
          id: "cinematic_sting_full",
          vol: 1.0
        }
      },
      {
        t: 360,
        action: "camera_zoom",
        params: {
          target: 1.12,
          dur: 200,
          ease: "easeOutQuart"
        }
      },
      {
        t: 360,
        action: "camera_shake",
        params: {
          dur: 200,
          intensity: 1.0
        }
      },
      {
        t: 520,
        action: "ui_cutin",
        params: {
          text: "ACE!",
          style: "big",
          dur: 400,
          anim_in: 300,
          anim_out: 200
        }
      },
      {
        t: 520,
        action: "play_short_bgm_snippet",
        params: {
          id: "victory_snip",
          dur: 600
        }
      },
      {
        t: 720,
        action: "set_time_scale",
        params: {
          scale: 1.0,
          dur: 120
        }
      },
      {
        t: 900,
        action: "cleanup_fade",
        params: {
          dur: 200
        }
      }
    ]
  },

  coach_success: {
    template: "coach_success",
    timeline: [
      {
        t: 0,
        action: "play_trail",
        params: {
          length: 100
        }
      },
      {
        t: 40,
        action: "play_sound",
        params: {
          id: "coach_activate",
          vol: 0.9
        }
      },
      {
        t: 160,
        action: "ui_cutin",
        params: {
          text: "COMMAND!",
          style: "medium",
          dur: 240
        }
      },
      {
        t: 260,
        action: "play_sound",
        params: {
          id: "coach_success_sting",
          vol: 1.0
        }
      },
      {
        t: 260,
        action: "camera_shake",
        params: {
          dur: 120,
          intensity: 0.7
        }
      },
      {
        t: 300,
        action: "vibrate",
        params: {
          pattern: [60, 40],
          total_dur: 100
        }
      }
    ]
  },

  coach_fail: {
    template: "coach_fail",
    timeline: [
      {
        t: 0,
        action: "play_trail",
        params: {
          length: 60
        }
      },
      {
        t: 40,
        action: "play_sound",
        params: {
          id: "coach_fail_tone",
          vol: 0.9
        }
      },
      {
        t: 120,
        action: "ui_cutin",
        params: {
          text: "FAILED",
          style: "small",
          dur: 180
        }
      },
      {
        t: 160,
        action: "vibrate",
        params: {
          dur: 80
        }
      },
      {
        t: 180,
        action: "camera_shake",
        params: {
          dur: 60,
          intensity: 0.4
        }
      }
    ]
  },

  long_rally_finish: {
    template: "long_rally_finish",
    timeline: [
      {
        t: 0,
        action: "looped_trail_sequence",
        params: {
          hits: 8,
          interval: 80
        }
      },
      {
        t: 0,
        action: "play_sound",
        params: {
          id: "rally_click_loop",
          vol: 0.35
        }
      },
      {
        t: 640,
        action: "play_sound",
        params: {
          id: "final_impact",
          vol: 1.0
        }
      },
      {
        t: 660,
        action: "spawn_particles",
        params: {
          type: "dust",
          count: 30
        }
      },
      {
        t: 700,
        action: "ui_cutin",
        params: {
          text: "LONG RALLY!",
          style: "large",
          dur: 280
        }
      },
      {
        t: 720,
        action: "camera_shake",
        params: {
          dur: 160,
          intensity: 0.8
        }
      }
    ]
  },

  service_winner: {
    template: "service_winner",
    timeline: [
      {
        t: 0,
        action: "play_trail",
        params: {
          length: 180
        }
      },
      {
        t: 40,
        action: "play_sound",
        params: {
          id: "serve_whoosh",
          vol: 0.8
        }
      },
      {
        t: 120,
        action: "play_sound",
        params: {
          id: "service_winner_sting",
          vol: 1.0
        }
      },
      {
        t: 160,
        action: "ui_cutin",
        params: {
          text: "SERVICE WINNER",
          style: "medium",
          dur: 300
        }
      },
      {
        t: 200,
        action: "camera_shake",
        params: {
          dur: 120,
          intensity: 0.7
        }
      }
    ]
  },

  error_miss: {
    template: "error_miss",
    timeline: [
      {
        t: 0,
        action: "play_trail",
        params: {
          length: 30
        }
      },
      {
        t: 60,
        action: "play_sound",
        params: {
          id: "miss_tone",
          vol: 0.9
        }
      },
      {
        t: 120,
        action: "player_reaction",
        params: {
          type: "disappointed",
          dur: 300
        }
      },
      {
        t: 200,
        action: "ui_cutin",
        params: {
          text: "ERR!",
          style: "small",
          dur: 200
        }
      }
    ]
  }
};

// テンプレート取得関数
export function getAnimationTemplate(templateName: string): AnimationTemplateData | null {
  return ANIMATION_TEMPLATE_DATA[templateName] || null;
}

// 利用可能なテンプレート一覧
export function getAvailableTemplates(): string[] {
  return Object.keys(ANIMATION_TEMPLATE_DATA);
}

// テンプレートにカスタムパラメータを適用
export function customizeTemplate(
  templateName: string, 
  customParams: Record<string, any>
): AnimationTemplateData | null {
  const template = getAnimationTemplate(templateName);
  if (!template) return null;

  // ディープコピー
  const customizedTemplate: AnimationTemplateData = JSON.parse(JSON.stringify(template));
  
  // カスタムパラメータの適用
  if (customParams.text) {
    customizedTemplate.timeline.forEach(action => {
      if (action.action === 'ui_cutin') {
        action.params.text = customParams.text;
      }
    });
  }
  
  if (customParams.speed_multiplier) {
    const multiplier = customParams.speed_multiplier;
    customizedTemplate.timeline.forEach(action => {
      action.t = Math.round(action.t / multiplier);
      if (action.params.dur && typeof action.params.dur === 'number') {
        action.params.dur = Math.round(action.params.dur / multiplier);
      }
    });
  }
  
  return customizedTemplate;
}