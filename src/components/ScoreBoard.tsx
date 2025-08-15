// スコアボード表示コンポーネント

'use client';

import { MatchState } from '@/types/tennis';

interface ScoreBoardProps {
  matchState: MatchState;
}

export default function ScoreBoard({ matchState }: ScoreBoardProps) {
  const { homePlayer, awayPlayer, sets, currentSet, currentGame, currentServer } = matchState;
  
  return (
    <div className="bg-green-800 text-white p-6 rounded-lg shadow-lg">
      {/* メインスコア */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* プレイヤー名 */}
        <div className="space-y-2">
          <div className={`p-2 rounded ${currentServer === 'home' ? 'bg-green-600' : 'bg-green-700'}`}>
            <div className="font-bold">{homePlayer.pokemon_name}</div>
            {currentServer === 'home' && <div className="text-xs opacity-75">サーブ</div>}
          </div>
          <div className={`p-2 rounded ${currentServer === 'away' ? 'bg-green-600' : 'bg-green-700'}`}>
            <div className="font-bold">{awayPlayer.pokemon_name}</div>
            {currentServer === 'away' && <div className="text-xs opacity-75">サーブ</div>}
          </div>
        </div>
        
        {/* セットスコア */}
        <div className="text-center">
          <div className="text-sm opacity-75 mb-1">セット</div>
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {sets.filter(set => set.home > set.away).length}
            </div>
            <div className="text-2xl font-bold">
              {sets.filter(set => set.away > set.home).length}
            </div>
          </div>
        </div>
        
        {/* 現在のゲームスコア */}
        <div className="text-center">
          <div className="text-sm opacity-75 mb-1">ゲーム</div>
          <div className="space-y-2">
            <div className="text-2xl font-bold">{currentSet.home}</div>
            <div className="text-2xl font-bold">{currentSet.away}</div>
          </div>
        </div>
      </div>
      
      {/* 詳細セット履歴 */}
      {sets.length > 0 && (
        <div className="border-t border-green-600 pt-4 mb-4">
          <div className="text-sm opacity-75 mb-2">セット詳細</div>
          <div className="grid grid-cols-1 gap-2">
            {sets.map((set, index) => (
              <div key={index} className="flex justify-between items-center bg-green-700 rounded p-2">
                <span>第{index + 1}セット</span>
                <span className="font-mono">
                  {set.home} - {set.away}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 現在のポイント */}
      <div className="border-t border-green-600 pt-4">
        <div className="text-center">
          <div className="text-sm opacity-75 mb-1">現在のポイント</div>
          <div className="text-3xl font-bold font-mono">
            {formatGameScore(currentGame)}
          </div>
          {isTiebreakScore(currentGame) && (
            <div className="text-sm opacity-75 mt-1">タイブレーク</div>
          )}
        </div>
      </div>
      
      {/* 試合状況 */}
      <div className="mt-4 text-center">
        {getMatchSituation(matchState)}
      </div>
    </div>
  );
}

// ゲームスコアをフォーマット
function formatGameScore(gameScore: string): string {
  const [home, away] = gameScore.split('-');
  
  // アドバンテージ表記を変換
  if (home === 'Ad') return 'A-40';
  if (away === 'Ad') return '40-A';
  
  return gameScore;
}

// タイブレークかどうか判定
function isTiebreakScore(gameScore: string): boolean {
  const [home, away] = gameScore.split('-');
  const homeScore = parseInt(home);
  const awayScore = parseInt(away);
  
  return !isNaN(homeScore) && !isNaN(awayScore) && (homeScore > 6 || awayScore > 6);
}

// 試合状況を取得
function getMatchSituation(matchState: MatchState): JSX.Element {
  if (matchState.isMatchComplete) {
    const winner = matchState.winner === 'home' ? matchState.homePlayer : matchState.awayPlayer;
    return (
      <div className="bg-yellow-500 text-black px-4 py-2 rounded font-bold">
        🏆 {winner?.pokemon_name} の勝利！
      </div>
    );
  }
  
  // ブレークポイント判定
  const [homeGame, awayGame] = matchState.currentGame.split('-');
  const isBreakPoint = (
    (matchState.currentServer === 'home' && awayGame === '40' && homeGame !== '40' && homeGame !== 'Ad') ||
    (matchState.currentServer === 'away' && homeGame === '40' && awayGame !== '40' && awayGame !== 'Ad')
  );
  
  if (isBreakPoint) {
    return (
      <div className="bg-red-500 px-4 py-2 rounded font-bold animate-pulse">
        ⚡ ブレークポイント！
      </div>
    );
  }
  
  // セットポイント判定
  const { home, away } = matchState.currentSet;
  const gamesPerSet = matchState.config.gamesPerSet;
  const isSetPoint = (home === gamesPerSet - 1 || away === gamesPerSet - 1) && Math.abs(home - away) <= 1;
  
  if (isSetPoint) {
    return (
      <div className="bg-orange-500 px-4 py-2 rounded font-bold animate-pulse">
        🎯 セットポイント！
      </div>
    );
  }
  
  // マッチポイント判定
  const homeSets = matchState.sets.filter(set => set.home > set.away).length;
  const awaySets = matchState.sets.filter(set => set.away > set.home).length;
  const setsToWin = matchState.config.setsToWin;
  const isMatchPoint = (homeSets === setsToWin - 1 || awaySets === setsToWin - 1) && isSetPoint;
  
  if (isMatchPoint) {
    return (
      <div className="bg-purple-500 px-4 py-2 rounded font-bold animate-pulse">
        🏆 マッチポイント！
      </div>
    );
  }
  
  // タイブレーク判定
  if (home === gamesPerSet && away === gamesPerSet) {
    return (
      <div className="bg-blue-500 px-4 py-2 rounded font-bold">
        ⚔️ タイブレーク
      </div>
    );
  }
  
  // 通常状態
  return (
    <div className="bg-green-600 px-4 py-2 rounded">
      📊 試合進行中
    </div>
  );
}