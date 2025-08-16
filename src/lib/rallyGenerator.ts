// ラリーシーケンス生成システム
// ポイント結果から逆算して、どのようなラリーが展開されたかを生成

import { PointResult, TennisPlayer } from '@/types/tennis';

// ラリーの1ショット情報
export interface RallyShot {
  shotNumber: number;
  player: 'home' | 'away';
  shotType: 'serve' | 'return' | 'groundstroke' | 'volley' | 'smash' | 'dropshot';
  position: { x: number; y: number }; // コート上の位置（0-1の相対座標）
  targetPosition: { x: number; y: number }; // ボールの着地予定位置
  power: 'light' | 'medium' | 'hard' | 'winner'; // ショット強度
  isWinner: boolean; // このショットでポイント決着か
  isError: boolean; // このショットでエラーか
}

// 生成されたラリーシーケンス
export interface RallySequence {
  shots: RallyShot[];
  totalShots: number;
  winner: 'home' | 'away';
  winReason: string;
  duration: number; // 推定ラリー時間（秒）
}

// コート座標システム（0-1の相対座標）
const COURT_POSITIONS = {
  // プレイヤー基本位置
  HOME_BASELINE: { x: 0.5, y: 0.9 },
  AWAY_BASELINE: { x: 0.5, y: 0.1 },
  HOME_NET: { x: 0.5, y: 0.65 },
  AWAY_NET: { x: 0.5, y: 0.35 },
  
  // サーブ位置
  HOME_SERVE_RIGHT: { x: 0.6, y: 0.9 },
  HOME_SERVE_LEFT: { x: 0.4, y: 0.9 },
  AWAY_SERVE_RIGHT: { x: 0.4, y: 0.1 },
  AWAY_SERVE_LEFT: { x: 0.6, y: 0.1 },
  
  // サービスボックス
  HOME_SERVICE_RIGHT: { x: 0.6, y: 0.6 },
  HOME_SERVICE_LEFT: { x: 0.4, y: 0.6 },
  AWAY_SERVICE_RIGHT: { x: 0.4, y: 0.4 },
  AWAY_SERVICE_LEFT: { x: 0.6, y: 0.4 },
  
  // コート端
  LEFT_SIDE: { x: 0.2, y: 0.5 },
  RIGHT_SIDE: { x: 0.8, y: 0.5 },
};

/**
 * ポイント結果からラリーシーケンスを生成
 */
export function generateRallySequence(
  pointResult: PointResult,
  homePlayer: TennisPlayer,
  awayPlayer: TennisPlayer,
  server: 'home' | 'away',
  isDeuce: boolean = false
): RallySequence {
  const shots: RallyShot[] = [];
  
  // ラリー長の決定（既存のrallyLengthがあればそれを使用、なければ勝敗理由から推定）
  const rallyLength = pointResult.rallyLength || estimateRallyLength(pointResult.reason);
  
  // 最初のショット（サーブ）を生成
  const serveShot = generateServeShot(server, pointResult.reason, isDeuce);
  shots.push(serveShot);
  
  // エース・サービスウィナーの場合はサーブのみ
  if (pointResult.reason === 'ace' || pointResult.reason === 'service_winner') {
    serveShot.isWinner = true;
    serveShot.power = 'winner';
    
    return {
      shots,
      totalShots: 1,
      winner: pointResult.winner,
      winReason: getRallyWinReason(pointResult.reason),
      duration: 2.0 // エースは短時間
    };
  }
  
  // リターンを生成
  if (rallyLength > 1) {
    const returnShot = generateReturnShot(server, pointResult.reason);
    shots.push(returnShot);
    
    // リターンエース・リターンウィナーの場合
    if (pointResult.reason === 'return_winner') {
      returnShot.isWinner = true;
      returnShot.power = 'winner';
      
      return {
        shots,
        totalShots: 2,
        winner: pointResult.winner,
        winReason: getRallyWinReason(pointResult.reason),
        duration: 4.0
      };
    }
  }
  
  // 残りのラリーショットを生成
  for (let i = 3; i <= rallyLength; i++) {
    const currentPlayer = shots[shots.length - 1].player === 'home' ? 'away' : 'home';
    const isLastShot = i === rallyLength;
    const shot = generateRallyShot(i, currentPlayer, pointResult, isLastShot, shots);
    shots.push(shot);
  }
  
  // 推定ラリー時間の計算（ショット数 × 平均間隔）
  const estimatedDuration = rallyLength * 1.5 + Math.random() * 2;
  
  return {
    shots,
    totalShots: rallyLength,
    winner: pointResult.winner,
    winReason: getRallyWinReason(pointResult.reason),
    duration: estimatedDuration
  };
}

/**
 * 勝敗理由からラリー長を推定
 */
function estimateRallyLength(reason: string): number {
  switch (reason) {
    case 'ace':
    case 'service_winner':
      return 1;
    case 'return_winner':
      return 2;
    case 'volley_winner':
      return 3 + Math.floor(Math.random() * 3); // 3-5ショット
    case 'stroke_winner':
      return 4 + Math.floor(Math.random() * 6); // 4-9ショット
    case 'opponent_error':
      return 3 + Math.floor(Math.random() * 8); // 3-10ショット
    case 'mental_break':
      return 6 + Math.floor(Math.random() * 8); // 6-13ショット（長めのラリー）
    default:
      return 3 + Math.floor(Math.random() * 5); // 3-7ショット
  }
}

/**
 * サーブショットを生成
 */
function generateServeShot(server: 'home' | 'away', reason: string, isDeuce: boolean): RallyShot {
  // サーブ位置の決定
  const isFirstServe = Math.random() > 0.2; // 80%の確率でファーストサーブ
  const serveSide = isDeuce ? 'right' : 'left';
  
  let servePosition: { x: number; y: number };
  let targetPosition: { x: number; y: number };
  
  if (server === 'home') {
    servePosition = serveSide === 'right' ? COURT_POSITIONS.HOME_SERVE_RIGHT : COURT_POSITIONS.HOME_SERVE_LEFT;
    targetPosition = serveSide === 'right' ? COURT_POSITIONS.AWAY_SERVICE_RIGHT : COURT_POSITIONS.AWAY_SERVICE_LEFT;
  } else {
    servePosition = serveSide === 'right' ? COURT_POSITIONS.AWAY_SERVE_RIGHT : COURT_POSITIONS.AWAY_SERVE_LEFT;
    targetPosition = serveSide === 'right' ? COURT_POSITIONS.HOME_SERVICE_RIGHT : COURT_POSITIONS.HOME_SERVICE_LEFT;
  }
  
  // ターゲットに少しランダム性を加える
  targetPosition = {
    x: targetPosition.x + (Math.random() - 0.5) * 0.1,
    y: targetPosition.y + (Math.random() - 0.5) * 0.05
  };
  
  return {
    shotNumber: 1,
    player: server,
    shotType: 'serve',
    position: servePosition,
    targetPosition,
    power: isFirstServe ? 'hard' : 'medium',
    isWinner: false, // 後で設定
    isError: false
  };
}

/**
 * リターンショットを生成
 */
function generateReturnShot(server: 'home' | 'away', reason: string): RallyShot {
  const returner = server === 'home' ? 'away' : 'home';
  
  // リターン位置（サービスボックス付近）
  const returnPosition = returner === 'home' ? 
    { x: 0.5 + (Math.random() - 0.5) * 0.2, y: 0.7 } :
    { x: 0.5 + (Math.random() - 0.5) * 0.2, y: 0.3 };
  
  // リターンターゲット（相手コート）
  const targetPosition = returner === 'home' ?
    { x: 0.3 + Math.random() * 0.4, y: 0.2 + Math.random() * 0.3 } :
    { x: 0.3 + Math.random() * 0.4, y: 0.5 + Math.random() * 0.3 };
  
  return {
    shotNumber: 2,
    player: returner,
    shotType: 'return',
    position: returnPosition,
    targetPosition,
    power: 'medium',
    isWinner: false,
    isError: false
  };
}

/**
 * ラリー中のショットを生成
 */
function generateRallyShot(
  shotNumber: number,
  player: 'home' | 'away',
  pointResult: PointResult,
  isLastShot: boolean,
  previousShots: RallyShot[]
): RallyShot {
  const lastShot = previousShots[previousShots.length - 1];
  
  // 前のショットの着地点付近からプレイ
  let position = {
    x: lastShot.targetPosition.x + (Math.random() - 0.5) * 0.1,
    y: player === 'home' ? 
      Math.max(0.6, lastShot.targetPosition.y + 0.2) : 
      Math.min(0.4, lastShot.targetPosition.y - 0.2)
  };
  
  // ネットプレイの判定
  const isNetPlay = shotNumber > 3 && Math.random() < 0.15; // 15%の確率でネット前進
  if (isNetPlay) {
    position.y = player === 'home' ? 0.65 : 0.35;
  }
  
  // ショットタイプの決定
  let shotType: RallyShot['shotType'] = 'groundstroke';
  if (isNetPlay) {
    shotType = Math.random() < 0.7 ? 'volley' : 'smash';
  } else if (shotNumber > 5 && Math.random() < 0.1) {
    shotType = 'dropshot';
  }
  
  // ターゲット位置の決定
  let targetPosition: { x: number; y: number };
  
  if (isLastShot) {
    // 最後のショット：勝敗理由に基づいてターゲット決定
    targetPosition = generateWinningTarget(player, pointResult.reason, shotType);
  } else {
    // 通常のラリーショット
    targetPosition = generateRallyTarget(player, shotType, shotNumber);
  }
  
  // パワーレベルの決定
  let power: RallyShot['power'] = 'medium';
  if (isLastShot && pointResult.winner === player) {
    power = 'winner';
  } else if (shotNumber > 6) {
    power = Math.random() < 0.3 ? 'hard' : 'medium';
  }
  
  return {
    shotNumber,
    player,
    shotType,
    position,
    targetPosition,
    power,
    isWinner: isLastShot && pointResult.winner === player,
    isError: isLastShot && pointResult.winner !== player
  };
}

/**
 * 勝利ショットのターゲット位置を生成
 */
function generateWinningTarget(player: 'home' | 'away', reason: string, shotType: string): { x: number; y: number } {
  const opponentSide = player === 'home' ? 'away' : 'home';
  
  switch (reason) {
    case 'volley_winner':
      // ボレーウィナー：ネット近くの鋭角
      return {
        x: Math.random() < 0.5 ? 0.2 : 0.8,
        y: opponentSide === 'home' ? 0.8 : 0.2
      };
    case 'stroke_winner':
      // ストロークウィナー：コート端
      return {
        x: Math.random() < 0.5 ? 0.15 : 0.85,
        y: opponentSide === 'home' ? 0.7 + Math.random() * 0.2 : 0.1 + Math.random() * 0.2
      };
    case 'opponent_error':
      // 相手エラー：アウトまたはネット
      if (Math.random() < 0.5) {
        // アウト
        return {
          x: Math.random() < 0.5 ? -0.1 : 1.1,
          y: 0.2 + Math.random() * 0.6
        };
      } else {
        // ネット
        return {
          x: 0.3 + Math.random() * 0.4,
          y: 0.5
        };
      }
    default:
      // 通常のウィナー
      return {
        x: 0.2 + Math.random() * 0.6,
        y: opponentSide === 'home' ? 0.8 : 0.2
      };
  }
}

/**
 * 通常ラリーのターゲット位置を生成
 */
function generateRallyTarget(player: 'home' | 'away', shotType: string, shotNumber: number): { x: number; y: number } {
  const opponentSide = player === 'home' ? 'away' : 'home';
  
  if (shotType === 'dropshot') {
    // ドロップショット：ネット近く
    return {
      x: 0.4 + Math.random() * 0.2,
      y: opponentSide === 'home' ? 0.7 : 0.3
    };
  }
  
  // 通常のショット：相手コートのランダム位置
  return {
    x: 0.25 + Math.random() * 0.5,
    y: opponentSide === 'home' ? 0.6 + Math.random() * 0.3 : 0.1 + Math.random() * 0.3
  };
}

/**
 * 勝敗理由の日本語変換
 */
function getRallyWinReason(reason: string): string {
  const reasons: Record<string, string> = {
    'ace': 'サービスエース',
    'service_winner': 'サービスウィナー',
    'return_winner': 'リターンウィナー',
    'volley_winner': 'ボレーウィナー',
    'stroke_winner': 'ストロークウィナー',
    'opponent_error': '相手のエラー',
    'mental_break': 'メンタルブレイク'
  };
  
  return reasons[reason] || 'ポイント獲得';
}