// テニス試合エンジン

import { 
  TennisPlayer, 
  MatchState, 
  MatchConfig, 
  PointResult, 
  PointWinReason,
  InterventionOpportunity,
  InterventionSituation,
  CoachInstruction,
  MatchResult
} from '@/types/tennis';
import { calculateAbilityEffects } from './specialAbilities';
import { calculateInstructionEffects, executeInstruction } from './coachInstructions';

// デフォルト試合設定
export const DEFAULT_MATCH_CONFIG: MatchConfig = {
  id: 'default',
  setsToWin: 2,              // 3セットマッチ
  gamesPerSet: 6,            // 6ゲーム先取
  enableTiebreak: true,      // タイブレーク有効
  coachBudget: 3,            // 3回まで介入可能
  enableCoachSystem: true,   // 監督システム有効
  instructionPoolSize: 10,   // 全指示数
  instructionChoices: 5      // 提示選択肢数
};

// 試合状態初期化
export function initializeMatch(
  homePlayer: TennisPlayer,
  awayPlayer: TennisPlayer,
  config: MatchConfig = DEFAULT_MATCH_CONFIG
): MatchState {
  return {
    homePlayer,
    awayPlayer,
    config,
    sets: [],
    currentSet: { home: 0, away: 0 },
    currentGame: "0-0",
    currentServer: 'home',
    coachBudgetRemaining: config.coachBudget,
    usedInstructions: [],
    activeInstructionEffects: [],
    lastInterventionPoint: -10, // 初期値は-10で介入なしとする
    isMatchComplete: false,
    currentPointNumber: 0
  };
}

// 介入タイミング判定
export function checkInterventionOpportunity(matchState: MatchState): InterventionOpportunity | null {
  const { currentSet, currentGame, currentServer, currentPointNumber, lastInterventionPoint } = matchState;
  
  // 最後の介入から3ポイント経過していない場合は介入不可
  if (currentPointNumber - lastInterventionPoint < 3) {
    return null;
  }
  
  // ブレークポイント判定
  if (isBreakPoint(matchState)) {
    const isServerBreakPoint = currentServer === 'home' ? 
      currentSet.away > currentSet.home : 
      currentSet.home > currentSet.away;
    
    return {
      type: isServerBreakPoint ? 'crisis' : 'chance',
      situation: isServerBreakPoint ? 'break_point_against' : 'break_point_for',
      urgency: 80,
      description: 'ブレークポイント！重要な場面です'
    };
  }
  
  // セットポイント判定
  if (isSetPoint(matchState)) {
    const homeNeedsOneGame = currentSet.home === matchState.config.gamesPerSet - 1;
    const awayNeedsOneGame = currentSet.away === matchState.config.gamesPerSet - 1;
    
    if (homeNeedsOneGame && currentServer === 'home') {
      return {
        type: 'chance',
        situation: 'set_point_for',
        urgency: 90,
        description: 'セットポイント！このセットを取れます'
      };
    } else if (awayNeedsOneGame && currentServer === 'away') {
      return {
        type: 'crisis',
        situation: 'set_point_against',
        urgency: 90,
        description: 'セットポイント！相手にセットを取られそうです'
      };
    }
  }
  
  // マッチポイント判定
  if (isMatchPoint(matchState)) {
    const homeSets = matchState.sets.filter(set => set.home > set.away).length;
    const awaySets = matchState.sets.filter(set => set.away > set.home).length;
    const setsToWin = matchState.config.setsToWin;
    
    if (homeSets === setsToWin - 1 && isSetPoint(matchState) && currentServer === 'home') {
      return {
        type: 'chance',
        situation: 'match_point_for',
        urgency: 100,
        description: 'マッチポイント！勝利まであと1ポイント！'
      };
    } else if (awaySets === setsToWin - 1 && isSetPoint(matchState) && currentServer === 'away') {
      return {
        type: 'crisis',
        situation: 'match_point_against',
        urgency: 100,
        description: 'マッチポイント！負けまであと1ポイント！'
      };
    }
  }
  
  // タイブレーク判定
  if (isTiebreak(matchState)) {
    return {
      type: 'chance',
      situation: 'tiebreak',
      urgency: 75,
      description: 'タイブレーク！集中してください'
    };
  }
  
  // スタミナ低下判定
  const homeStaminaPercentage = matchState.homePlayer.current_stamina / matchState.homePlayer.stats.stamina;
  const awayStaminaPercentage = matchState.awayPlayer.current_stamina / matchState.awayPlayer.stats.stamina;
  
  if (homeStaminaPercentage < 0.3 || awayStaminaPercentage < 0.3) {
    return {
      type: 'crisis',
      situation: 'stamina_low',
      urgency: 60,
      description: 'スタミナが心配です。体力を温存しましょう'
    };
  }
  
  // 流れの変化判定（3ポイント連続で失点など）
  // TODO: ポイント履歴を追跡して実装
  
  return null;
}

// ポイントシミュレーション
export function simulatePoint(matchState: MatchState): PointResult {
  const server = matchState.currentServer === 'home' ? matchState.homePlayer : matchState.awayPlayer;
  const receiver = matchState.currentServer === 'home' ? matchState.awayPlayer : matchState.homePlayer;
  
  // 特殊能力効果を計算
  const serverAbilityEffects = calculateAbilityEffects(
    server.special_abilities,
    {
      isBreakPoint: isBreakPoint(matchState),
      isSetPoint: isSetPoint(matchState),
      isMatchPoint: isMatchPoint(matchState),
      isTiebreak: isTiebreak(matchState)
    }
  );
  
  const receiverAbilityEffects = calculateAbilityEffects(
    receiver.special_abilities,
    {
      isBreakPoint: isBreakPoint(matchState),
      isSetPoint: isSetPoint(matchState),
      isMatchPoint: isMatchPoint(matchState),
      isTiebreak: isTiebreak(matchState)
    }
  );
  
  // 監督指示効果を計算
  let instructionBonus = { 
    serveBonus: 0, receiveBonus: 0, volleyBonus: 0, strokeBonus: 0, 
    mentalBonus: 0, staminaBonus: 0, criticalRate: 0, errorReduction: 0, successRateBonus: 0 
  };
  
  let wasInfluencedByInstruction = false;
  
  // アクティブな監督指示効果を適用
  matchState.activeInstructionEffects.forEach(effect => {
    if (effect.remainingPoints > 0) {
      wasInfluencedByInstruction = true;
      Object.keys(effect.effects).forEach(key => {
        if (key in instructionBonus) {
          (instructionBonus as any)[key] += effect.effects[key] || 0;
        }
      });
    }
  });
  
  // 攻撃力・守備力を計算
  const homeAttack = server === matchState.homePlayer ? 
    server.stats.serve + serverAbilityEffects.serveBonus + instructionBonus.serveBonus :
    receiver.stats.receive + receiverAbilityEffects.receiveBonus + instructionBonus.receiveBonus;
    
  const awayAttack = server === matchState.awayPlayer ? 
    server.stats.serve + serverAbilityEffects.serveBonus + instructionBonus.serveBonus :
    receiver.stats.receive + receiverAbilityEffects.receiveBonus + instructionBonus.receiveBonus;
  
  const homeDefense = server === matchState.homePlayer ? 
    receiver.stats.receive + receiverAbilityEffects.receiveBonus :
    server.stats.serve + serverAbilityEffects.serveBonus;
    
  const awayDefense = server === matchState.awayPlayer ? 
    receiver.stats.receive + receiverAbilityEffects.receiveBonus :
    server.stats.serve + serverAbilityEffects.serveBonus;
  
  // 成功確率計算
  const attackPower = matchState.currentServer === 'home' ? homeAttack : awayAttack;
  const defensePower = matchState.currentServer === 'home' ? awayDefense : homeDefense;
  
  // スタミナ・メンタル影響
  const staminaEffect = (100 - server.current_stamina) * 0.0005;
  const mentalEffect = (server.current_mental - 50) * 0.0008;
  
  // 最終成功確率
  let successRate = 0.50 + (attackPower - defensePower) * 0.0075 + mentalEffect - staminaEffect;
  successRate += (instructionBonus.successRateBonus || 0) * 0.01;
  successRate += (serverAbilityEffects.successRateBonus || 0) * 0.01;
  successRate = Math.max(0.05, Math.min(0.95, successRate));
  
  // ランダム判定
  const roll = Math.random();
  const serverWins = roll < successRate;
  
  // 勝者決定
  const winner = serverWins ? matchState.currentServer : (matchState.currentServer === 'home' ? 'away' : 'home');
  
  // 勝因決定
  let reason: PointWinReason;
  let description: string;
  
  const criticalRate = (serverAbilityEffects.criticalRate + instructionBonus.criticalRate) * 0.01;
  const isCritical = Math.random() < criticalRate;
  
  if (serverWins) {
    if (isCritical && roll < successRate * 0.3) {
      reason = 'ace';
      description = `${server.pokemon_name}の強烈なサービスエース！`;
    } else if (isCritical) {
      reason = 'service_winner';
      description = `${server.pokemon_name}のサービスウィナー！`;
    } else {
      reason = 'stroke_winner';
      description = `${server.pokemon_name}がラリーを制した！`;
    }
  } else {
    const errorRate = 0.15 - (receiverAbilityEffects.errorReduction + instructionBonus.errorReduction) * 0.01;
    if (Math.random() < errorRate) {
      reason = 'opponent_error';
      description = `${server.pokemon_name}のミス。${receiver.pokemon_name}がポイント獲得！`;
    } else if (isCritical) {
      reason = 'return_winner';
      description = `${receiver.pokemon_name}の見事なリターンウィナー！`;
    } else {
      reason = 'stroke_winner';
      description = `${receiver.pokemon_name}がラリーで競り勝った！`;
    }
  }
  
  return {
    winner,
    reason,
    description,
    wasInfluencedByInstruction,
    homeAttack,
    awayAttack,
    homeDefense,
    awayDefense,
    successRate,
    roll
  };
}

// ポイント結果適用
export function applyPointResult(matchState: MatchState, pointResult: PointResult): void {
  // スコア更新
  updateScore(matchState, pointResult.winner);
  
  // スタミナ・メンタル更新
  updatePlayerCondition(matchState, pointResult);
  
  // 監督指示効果の持続時間を減らす
  updateInstructionEffects(matchState);
  
  // サーバー交代判定
  updateServer(matchState);
  
  // ポイント番号更新
  matchState.currentPointNumber++;
}

// スコア更新
function updateScore(matchState: MatchState, winner: 'home' | 'away'): void {
  const scores = ['0', '15', '30', '40'];
  const [homeScore, awayScore] = matchState.currentGame.split('-');
  let homePoints = scores.indexOf(homeScore);
  let awayPoints = scores.indexOf(awayScore);
  
  if (winner === 'home') {
    homePoints++;
  } else {
    awayPoints++;
  }
  
  // デュース・アドバンテージ処理
  if (homePoints >= 3 && awayPoints >= 3) {
    if (homePoints === awayPoints) {
      matchState.currentGame = "40-40"; // デュース
    } else if (homePoints > awayPoints) {
      matchState.currentGame = "Ad-40"; // ホームアドバンテージ
    } else {
      matchState.currentGame = "40-Ad"; // アウェイアドバンテージ
    }
  } else if ((homePoints >= 4 && homePoints > awayPoints + 1) || 
             (awayPoints >= 4 && awayPoints > homePoints + 1)) {
    // ゲーム終了
    if (homePoints > awayPoints) {
      matchState.currentSet.home++;
    } else {
      matchState.currentSet.away++;
    }
    matchState.currentGame = "0-0";
    
    // セット終了判定
    checkSetComplete(matchState);
  } else {
    // 通常スコア
    matchState.currentGame = `${scores[homePoints] || '40'}-${scores[awayPoints] || '40'}`;
  }
}

// セット完了判定
function checkSetComplete(matchState: MatchState): void {
  const { home, away } = matchState.currentSet;
  const gamesPerSet = matchState.config.gamesPerSet;
  
  if ((home >= gamesPerSet && home - away >= 2) || 
      (away >= gamesPerSet && away - home >= 2)) {
    // セット終了
    matchState.sets.push({ ...matchState.currentSet });
    matchState.currentSet = { home: 0, away: 0 };
    
    // マッチ終了判定
    checkMatchComplete(matchState);
  }
}

// マッチ完了判定
function checkMatchComplete(matchState: MatchState): void {
  const homeSets = matchState.sets.filter(set => set.home > set.away).length;
  const awaySets = matchState.sets.filter(set => set.away > set.home).length;
  const setsToWin = matchState.config.setsToWin;
  
  if (homeSets >= setsToWin) {
    matchState.isMatchComplete = true;
    matchState.winner = 'home';
  } else if (awaySets >= setsToWin) {
    matchState.isMatchComplete = true;
    matchState.winner = 'away';
  }
}

// プレイヤー状態更新
function updatePlayerCondition(matchState: MatchState, pointResult: PointResult): void {
  // スタミナ消費
  const staminaLoss = 1 + (Math.random() * 2);
  matchState.homePlayer.current_stamina = Math.max(0, matchState.homePlayer.current_stamina - staminaLoss);
  matchState.awayPlayer.current_stamina = Math.max(0, matchState.awayPlayer.current_stamina - staminaLoss);
  
  // メンタル変化
  const mentalGain = 3;
  const mentalLoss = 4;
  
  if (pointResult.winner === 'home') {
    matchState.homePlayer.current_mental = Math.min(100, matchState.homePlayer.current_mental + mentalGain);
    matchState.awayPlayer.current_mental = Math.max(0, matchState.awayPlayer.current_mental - mentalLoss);
  } else {
    matchState.awayPlayer.current_mental = Math.min(100, matchState.awayPlayer.current_mental + mentalGain);
    matchState.homePlayer.current_mental = Math.max(0, matchState.homePlayer.current_mental - mentalLoss);
  }
}

// 監督指示効果更新
function updateInstructionEffects(matchState: MatchState): void {
  matchState.activeInstructionEffects = matchState.activeInstructionEffects
    .map(effect => ({
      ...effect,
      remainingPoints: effect.remainingPoints - 1
    }))
    .filter(effect => effect.remainingPoints > 0);
}

// サーバー更新
function updateServer(matchState: MatchState): void {
  // ゲーム終了時にサーバー交代
  if (matchState.currentGame === "0-0") {
    matchState.currentServer = matchState.currentServer === 'home' ? 'away' : 'home';
  }
}

// 監督指示適用
export function applyCoachInstruction(
  matchState: MatchState,
  instruction: CoachInstruction
): { success: boolean; message: string } {
  const result = executeInstruction(instruction);
  const effects = calculateInstructionEffects(instruction, result.success, result.effectMultiplier);
  
  if (result.success) {
    // 効果を追加
    matchState.activeInstructionEffects.push({
      instructionId: instruction.id,
      effects,
      remainingPoints: effects.duration
    });
  }
  
  // 使用済み指示に追加
  matchState.usedInstructions.push(instruction.id);
  matchState.coachBudgetRemaining--;
  
  // 最後の介入ポイントを記録
  matchState.lastInterventionPoint = matchState.currentPointNumber;
  
  return {
    success: result.success,
    message: result.message
  };
}

// 判定ヘルパー関数
export function isBreakPoint(matchState: MatchState): boolean {
  const game = matchState.currentGame;
  const [homeScore, awayScore] = game.split('-');
  
  // サーバーが負けそうな状況
  if (matchState.currentServer === 'home') {
    return awayScore === '40' && homeScore !== '40' && homeScore !== 'Ad';
  } else {
    return homeScore === '40' && awayScore !== '40' && awayScore !== 'Ad';
  }
}

export function isSetPoint(matchState: MatchState): boolean {
  const { home, away } = matchState.currentSet;
  const gamesPerSet = matchState.config.gamesPerSet;
  
  return (home === gamesPerSet - 1 || away === gamesPerSet - 1) && 
         Math.abs(home - away) <= 1;
}

export function isMatchPoint(matchState: MatchState): boolean {
  const homeSets = matchState.sets.filter(set => set.home > set.away).length;
  const awaySets = matchState.sets.filter(set => set.away > set.home).length;
  const setsToWin = matchState.config.setsToWin;
  
  return (homeSets === setsToWin - 1 || awaySets === setsToWin - 1) && isSetPoint(matchState);
}

export function isTiebreak(matchState: MatchState): boolean {
  const { home, away } = matchState.currentSet;
  const gamesPerSet = matchState.config.gamesPerSet;
  
  return matchState.config.enableTiebreak && home === gamesPerSet && away === gamesPerSet;
}