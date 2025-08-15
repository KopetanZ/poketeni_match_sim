// メインページ

'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { generatePresetPlayers } from '@/lib/playerGenerator';
import PlayerCard from '@/components/PlayerCard';
import ScoreBoard from '@/components/ScoreBoard';
import MatchControls from '@/components/MatchControls';
import MatchHistory from '@/components/MatchHistory';
import InterventionModal from '@/components/InterventionModal';

export default function Home() {
  const {
    homePlayer,
    awayPlayer,
    currentMatch,
    matchHistory,
    currentIntervention,
    availableInstructions,
    isWaitingForIntervention,
    isMatchActive,
    setPlayers,
    startMatch,
    handleIntervention
  } = useAppStore();

  // 初期プレイヤー生成
  useEffect(() => {
    if (!homePlayer || !awayPlayer) {
      const { home, away } = generatePresetPlayers();
      setPlayers(home, away);
    }
  }, [homePlayer, awayPlayer, setPlayers]);

  const handleStartMatch = () => {
    if (homePlayer && awayPlayer) {
      startMatch();
    }
  };

  const handleNewPlayers = () => {
    const { home, away } = generatePresetPlayers();
    setPlayers(home, away);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 p-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🎾 ポケテニ シミュレータ
          </h1>
          <p className="text-white/80 text-lg">
            監督として重要な場面で指示を出そう！
          </p>
        </header>

        {/* プレイヤー情報 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {homePlayer && (
            <PlayerCard 
              player={homePlayer} 
              side="home"
              isActive={currentMatch?.currentServer === 'home'}
            />
          )}
          {awayPlayer && (
            <PlayerCard 
              player={awayPlayer} 
              side="away"
              isActive={currentMatch?.currentServer === 'away'}
            />
          )}
        </div>

        {/* 試合コントロール */}
        <div className="mb-6">
          <MatchControls />
        </div>

        {/* 試合開始ボタン */}
        {!isMatchActive && (
          <div className="text-center mb-6">
            <div className="flex justify-center gap-4">
              <button
                onClick={handleNewPlayers}
                className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-semibold"
              >
                🎲 新しいプレイヤー
              </button>
              <button
                onClick={handleStartMatch}
                disabled={!homePlayer || !awayPlayer}
                className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold text-lg disabled:bg-gray-400"
              >
                🚀 試合開始
              </button>
            </div>
          </div>
        )}

        {/* スコアボード */}
        {currentMatch && (
          <div className="mb-6">
            <ScoreBoard matchState={currentMatch} />
          </div>
        )}

        {/* 試合履歴 */}
        {isMatchActive && (
          <div className="mb-6">
            <MatchHistory history={matchHistory} />
          </div>
        )}

        {/* 監督介入モーダル */}
        {isWaitingForIntervention && currentIntervention && (
          <InterventionModal
            opportunity={currentIntervention}
            instructions={availableInstructions}
            remainingUses={currentMatch?.coachBudgetRemaining || 0}
            onSelect={handleIntervention}
            timeLimit={15}
          />
        )}

        {/* 試合結果 */}
        {currentMatch?.isMatchComplete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
              <h2 className="text-3xl font-bold mb-4">🏆 試合終了！</h2>
              <div className="text-xl mb-6">
                {currentMatch.winner === 'home' ? homePlayer?.pokemon_name : awayPlayer?.pokemon_name}
                の勝利！
              </div>
              <div className="space-y-2 mb-6">
                <div>最終スコア: {
                  currentMatch.sets.filter(set => set.home > set.away).length
                } - {
                  currentMatch.sets.filter(set => set.away > set.home).length
                }</div>
                <div>総ポイント数: {matchHistory.length}</div>
                <div>監督介入: {3 - currentMatch.coachBudgetRemaining} / 3 回</div>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                新しい試合
              </button>
            </div>
          </div>
        )}

        {/* フッター */}
        <footer className="text-center text-white/60 mt-12">
          <p>実況パワフルプロ野球のテニス版 - 栄冠ナイン風監督システム</p>
        </footer>
      </div>
    </div>
  );
}
