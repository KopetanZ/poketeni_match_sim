// メインページ

'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { generatePresetPlayers } from '@/lib/playerGenerator';
import PlayerCard from '@/components/PlayerCard';
import ScoreBoard from '@/components/ScoreBoard';
import MatchControls from '@/components/MatchControls';
import MatchHistory from '@/components/MatchHistory';
import InterventionModal from '@/components/InterventionModal';
import AnimationDisplay from '@/components/AnimationDisplay';
import TennisCourtView from '@/components/TennisCourtView';
import { AudioStatus } from '@/components/AudioProvider';
import { AudioControls } from '@/components/AudioControls';
import { useGameAudio } from '@/hooks/useGameAudio';
import { DetailedPointGenerator } from '@/lib/detailedPointGenerator';
import type { DetailedPointResult, CoachInstruction } from '@/types/tennis';

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
    lastPointResult,
    lastInterventionResult,
    rallyViewEnabled,
    currentRallySequence,
    setPlayers,
    startMatch,
    handleIntervention,
    clearLastPointResult,
    clearInterventionResult,
    setRallyViewEnabled,
    clearRallySequence
  } = useAppStore();

  const [animationEnabled] = useState(true);
  
  // 詳細ポイント結果管理
  const [currentDetailedResult, setCurrentDetailedResult] = useState<DetailedPointResult | null>(null);
  
  // ゲーム音響管理
  const { playPointAudio, playUISound, playInterventionResultAudio, resetAudio, isReady: isAudioReady } = useGameAudio();

  // 初期プレイヤー生成
  useEffect(() => {
    if (!homePlayer || !awayPlayer) {
      const { home, away } = generatePresetPlayers();
      setPlayers(home, away);
    }
  }, [homePlayer, awayPlayer, setPlayers]);

  // ポイント結果発生時の音響再生
  useEffect(() => {
    if (lastPointResult && isAudioReady && homePlayer && awayPlayer) {
      console.log('🎵 Playing point audio for:', lastPointResult);
      playPointAudio(lastPointResult, homePlayer, awayPlayer);
    }
  }, [lastPointResult, isAudioReady, homePlayer, awayPlayer, playPointAudio]);

  // ポイント結果から詳細結果を生成
  useEffect(() => {
    console.log('📊 Point result change detected:', {
      hasLastPointResult: !!lastPointResult,
      hasHomePlayer: !!homePlayer,
      hasAwayPlayer: !!awayPlayer,
      pointResultReason: lastPointResult?.reason,
      currentServer: currentMatch?.currentServer
    });
    
    if (lastPointResult && homePlayer && awayPlayer) {
      try {
        console.log('🔄 Generating detailed result from basic point result...');
        const detailedResult = DetailedPointGenerator.generateDetailedResult(
          lastPointResult, 
          homePlayer, 
          awayPlayer, 
          currentMatch?.currentServer === 'home' || currentMatch?.currentServer === 'away'
        );
        setCurrentDetailedResult(detailedResult);
        console.log('✅ Successfully set detailed result:', {
          reason: detailedResult.detailedReason,
          category: detailedResult.category,
          hasTrajectory: !!detailedResult.ballTrajectory,
          winner: detailedResult.winner
        });
      } catch (error) {
        console.error('❌ Failed to generate detailed result:', error);
        setCurrentDetailedResult(null);
      }
    } else {
      console.log('⚠️ Clearing detailed result - missing requirements');
      setCurrentDetailedResult(null);
    }
  }, [lastPointResult, homePlayer, awayPlayer, currentMatch?.currentServer]);

  // 新しい試合開始時の音響リセット
  useEffect(() => {
    if (isMatchActive && isAudioReady) {
      resetAudio();
    }
  }, [isMatchActive, isAudioReady, resetAudio]);

  // 監督介入結果の音響フィードバック
  useEffect(() => {
    if (lastInterventionResult && isAudioReady) {
      console.log('🎵 Playing intervention result audio:', lastInterventionResult);
      playInterventionResultAudio(
        lastInterventionResult.success, 
        lastInterventionResult.instruction, 
        lastInterventionResult.message
      );
      
      // 音響再生後、結果をクリア（音が重複しないように）
      setTimeout(() => {
        clearInterventionResult();
      }, 1000);
    }
  }, [lastInterventionResult, isAudioReady, playInterventionResultAudio, clearInterventionResult]);

  const handleStartMatch = () => {
    if (homePlayer && awayPlayer) {
      playUISound('click');
      startMatch();
    }
  };

  const handleNewPlayers = () => {
    playUISound('click');
    const { home, away } = generatePresetPlayers();
    setPlayers(home, away);
  };

  const handleInterventionWithAudio = (instruction: CoachInstruction | null) => {
    // UI sound is now handled by InterventionModal, detailed audio by useEffect
    handleIntervention(instruction);
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

        {/* ラリー表示切り替え */}
        {isMatchActive && (
          <div className="mb-6 text-center">
            <label className="inline-flex items-center space-x-2">
              <input
                type="checkbox"
                checked={!rallyViewEnabled}
                onChange={(e) => setRallyViewEnabled(!e.target.checked)}
                className="rounded"
              />
              <span className="text-white font-medium">ラリーアニメーション非表示</span>
            </label>
          </div>
        )}

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

        {/* ラリー可視化 */}
        {rallyViewEnabled && currentRallySequence && homePlayer && awayPlayer && (
          <div className="mb-6">
            <TennisCourtView
              rallySequence={currentRallySequence}
              homePlayer={homePlayer}
              awayPlayer={awayPlayer}
              onRallyComplete={() => {
                clearRallySequence();
              }}
              isPlaying={true}
              detailedResult={currentDetailedResult}
            />
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
            onSelect={handleInterventionWithAudio}
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

      {/* アニメーション表示 */}
      <AnimationDisplay
        pointResult={lastPointResult}
        onAnimationComplete={clearLastPointResult}
        isEnabled={animationEnabled}
      />

      {/* 音響システム */}
      <AudioStatus />
      <AudioControls />
    </div>
  );
}
