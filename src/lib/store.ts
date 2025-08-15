// Zustand状態管理ストア

import { create } from 'zustand';
import { 
  TennisPlayer, 
  MatchState, 
  MatchConfig, 
  PointResult, 
  InterventionOpportunity,
  CoachInstruction,
  MatchResult 
} from '@/types/tennis';
import { 
  initializeMatch, 
  simulatePoint, 
  applyPointResult, 
  checkInterventionOpportunity,
  applyCoachInstruction,
  DEFAULT_MATCH_CONFIG 
} from './matchEngine';
import { generateInstructionChoices } from './coachInstructions';

interface AppState {
  // プレイヤー
  homePlayer: TennisPlayer | null;
  awayPlayer: TennisPlayer | null;
  
  // 試合状態
  currentMatch: MatchState | null;
  matchHistory: PointResult[];
  
  // 監督介入
  currentIntervention: InterventionOpportunity | null;
  availableInstructions: CoachInstruction[];
  isWaitingForIntervention: boolean;
  
  // UI状態
  isMatchActive: boolean;
  isAutoPlaying: boolean;
  autoPlaySpeed: number; // ms
  autoPlayMode: 'normal' | 'to_intervention' | 'to_end'; // 自動再生モード
  
  // アクション
  setPlayers: (home: TennisPlayer, away: TennisPlayer) => void;
  startMatch: (config?: MatchConfig) => void;
  playNextPoint: () => Promise<PointResult>;
  handleIntervention: (instruction: CoachInstruction | null) => void;
  skipIntervention: () => void; // 介入をスキップ
  startAutoPlay: (mode?: 'normal' | 'to_intervention' | 'to_end') => void;
  stopAutoPlay: () => void;
  setAutoPlaySpeed: (speed: number) => void;
  resetMatch: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // 初期状態
  homePlayer: null,
  awayPlayer: null,
  currentMatch: null,
  matchHistory: [],
  currentIntervention: null,
  availableInstructions: [],
  isWaitingForIntervention: false,
  isMatchActive: false,
  isAutoPlaying: false,
  autoPlaySpeed: 2000,
  autoPlayMode: 'normal',

  // プレイヤー設定
  setPlayers: (home: TennisPlayer, away: TennisPlayer) => {
    set({ homePlayer: home, awayPlayer: away });
  },

  // 試合開始
  startMatch: (config = DEFAULT_MATCH_CONFIG) => {
    const { homePlayer, awayPlayer } = get();
    
    if (!homePlayer || !awayPlayer) {
      throw new Error('プレイヤーが設定されていません');
    }
    
    const matchState = initializeMatch(homePlayer, awayPlayer, config);
    
    set({
      currentMatch: matchState,
      matchHistory: [],
      currentIntervention: null,
      availableInstructions: [],
      isWaitingForIntervention: false,
      isMatchActive: true,
      isAutoPlaying: false
    });
  },

  // 次のポイントをプレイ
  playNextPoint: async (): Promise<PointResult> => {
    const state = get();
    
    if (!state.currentMatch || state.currentMatch.isMatchComplete) {
      throw new Error('試合が進行中ではありません');
    }
    
    // 介入待ちの場合は処理しない
    if (state.isWaitingForIntervention) {
      throw new Error('監督介入待ちです');
    }
    
    const matchState = { ...state.currentMatch };
    
    // 介入タイミングをチェック
    const intervention = checkInterventionOpportunity(matchState);
    
    if (intervention && matchState.coachBudgetRemaining > 0) {
      // 介入機会がある場合
      const instructions = generateInstructionChoices(intervention, matchState.usedInstructions);
      
      set({
        currentIntervention: intervention,
        availableInstructions: instructions,
        isWaitingForIntervention: true,
        isAutoPlaying: false // 自動再生を停止
      });
      
      // 介入待ちなので、空のポイント結果を返す
      return {
        winner: 'home',
        reason: 'ace',
        description: '監督介入待ち',
        wasInfluencedByInstruction: false,
        homeAttack: 0,
        awayAttack: 0,
        homeDefense: 0,
        awayDefense: 0,
        successRate: 0,
        roll: 0
      };
    }
    
    // 通常のポイントシミュレーション
    const pointResult = simulatePoint(matchState);
    applyPointResult(matchState, pointResult);
    
    const newHistory = [...state.matchHistory, pointResult];
    
    set({
      currentMatch: matchState,
      matchHistory: newHistory
    });
    
    // 試合終了チェック
    if (matchState.isMatchComplete) {
      set({ isMatchActive: false, isAutoPlaying: false });
    }
    
    return pointResult;
  },

  // 監督介入処理
  handleIntervention: (instruction: CoachInstruction | null) => {
    const state = get();
    
    if (!state.currentMatch || !state.isWaitingForIntervention) {
      return;
    }
    
    const matchState = { ...state.currentMatch };
    
    if (instruction) {
      // 指示を適用
      const result = applyCoachInstruction(matchState, instruction);
      console.log(result.message);
    } else {
      // nullの場合はスキップとして扱う
      // 介入回数は消費しないが、次の3ポイントは介入不可にする
      matchState.lastInterventionPoint = matchState.currentPointNumber;
    }
    
    // 介入状態を即座にクリア
    set({
      currentMatch: matchState,
      currentIntervention: null,
      availableInstructions: [],
      isWaitingForIntervention: false
    });
    
    // 介入処理後は手動でポイント実行する必要がある
    // 自動実行は削除して、ユーザーが明示的にボタンを押すか自動再生を再開する
  },

  // 介入をスキップ
  skipIntervention: () => {
    const state = get();
    
    if (!state.currentMatch || !state.isWaitingForIntervention) {
      return;
    }
    
    const matchState = { ...state.currentMatch };
    
    // 介入状態をクリアするが、介入回数は消費しない
    // 最後の介入ポイントを更新して、次の3ポイントは介入不可にする
    matchState.lastInterventionPoint = matchState.currentPointNumber;
    
    set({
      currentMatch: matchState,
      currentIntervention: null,
      availableInstructions: [],
      isWaitingForIntervention: false
    });
  },

  // 自動再生開始
  startAutoPlay: (mode: 'normal' | 'to_intervention' | 'to_end' = 'normal') => {
    const state = get();
    
    if (!state.isMatchActive || state.isWaitingForIntervention) {
      return;
    }
    
    set({ isAutoPlaying: true, autoPlayMode: mode });
    
    const playLoop = () => {
      const currentState = get();
      
      if (!currentState.isAutoPlaying || !currentState.isMatchActive) {
        return;
      }
      
      if (currentState.isWaitingForIntervention) {
        // 介入待ちの場合の処理
        if (currentState.autoPlayMode === 'to_end') {
          // 自動介入スキップして試合終了まで続行
          currentState.skipIntervention();
          setTimeout(playLoop, currentState.autoPlaySpeed);
        } else {
          // 通常モードまたは介入まで自動再生の場合は停止
          set({ isAutoPlaying: false });
        }
        return;
      }
      
      currentState.playNextPoint()
        .then(() => {
          const newState = get();
          if (newState.isAutoPlaying && newState.isMatchActive && !newState.isWaitingForIntervention) {
            setTimeout(playLoop, newState.autoPlaySpeed);
          }
        })
        .catch((error) => {
          console.error('自動再生エラー:', error);
          set({ isAutoPlaying: false });
        });
    };
    
    setTimeout(playLoop, state.autoPlaySpeed);
  },

  // 自動再生停止
  stopAutoPlay: () => {
    set({ isAutoPlaying: false });
  },

  // 自動再生速度設定
  setAutoPlaySpeed: (speed: number) => {
    set({ autoPlaySpeed: speed });
  },

  // 試合リセット
  resetMatch: () => {
    set({
      currentMatch: null,
      matchHistory: [],
      currentIntervention: null,
      availableInstructions: [],
      isWaitingForIntervention: false,
      isMatchActive: false,
      isAutoPlaying: false
    });
  }
}));