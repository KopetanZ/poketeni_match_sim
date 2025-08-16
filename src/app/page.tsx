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
import CanvasEffectTest from '@/components/CanvasEffectTest';
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

  const [animationEnabled] = useState(false); // WINNERアニメーション無効化
  
  // 詳細ポイント結果管理
  const [currentDetailedResult, setCurrentDetailedResult] = useState<DetailedPointResult | null>(null);
  const [specialAnimationInProgress, setSpecialAnimationInProgress] = useState(false);
  
  // ゲーム音響管理
  const { playPointAudio, playUISound, playInterventionResultAudio, resetAudio, isReady: isAudioReady } = useGameAudio();
  
  // デバッグ用：グローバルにアクセス可能にする
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).debugTennis = {
        forceNetHit: () => DetailedPointGenerator.setDebugForceAnimation('hit_net'),
        forceOutBounce: () => DetailedPointGenerator.setDebugForceAnimation('out_baseline'),
        forceMissedBall: () => DetailedPointGenerator.setDebugForceAnimation('missed_return'),
        forceAceServe: () => DetailedPointGenerator.setDebugForceAnimation('ace_serve'),
        forceNetCord: () => DetailedPointGenerator.setDebugForceAnimation('net_cord'),
        forceLateSwing: () => DetailedPointGenerator.setDebugForceAnimation('late_swing'),
        reset: () => DetailedPointGenerator.setDebugForceAnimation(null)
      };
      console.log('🔧 Debug commands available: window.debugTennis');
      console.log('🔧 Available commands: forceNetHit(), forceOutBounce(), forceMissedBall(), forceAceServe(), forceNetCord(), forceLateSwing(), reset()');
    }
  }, []);

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
        
        // 特殊アニメーションが必要かチェック
        const needsSpecialAnimation = [
          'ace_serve', 'service_winner', 'hit_net', 'net_cord',
          'out_baseline', 'out_sideline', 'out_long', 'out_wide',
          'missed_return', 'late_swing', 'misjudged'
        ].includes(detailedResult.detailedReason);
        
        if (needsSpecialAnimation) {
          setSpecialAnimationInProgress(true);
          console.log('🎬 Special animation needed for:', detailedResult.detailedReason);
        } else {
          console.log('⚡ No special animation needed for:', detailedResult.detailedReason, '- AnimationDisplay can clear normally');
          
          // AnimationDisplayが無効の場合、即座にクリア
          if (!animationEnabled) {
            console.log('🔧 AnimationDisplay disabled - clearing point result immediately');
            setTimeout(() => {
              clearLastPointResult();
            }, 1000); // 少し遅延を入れて他のシステムの処理を待つ
          }
        }
        
        console.log('✅ Successfully set detailed result:', {
          reason: detailedResult.detailedReason,
          category: detailedResult.category,
          hasTrajectory: !!detailedResult.ballTrajectory,
          winner: detailedResult.winner,
          needsSpecialAnimation
        });
      } catch (error) {
        console.error('❌ Failed to generate detailed result:', error);
        setCurrentDetailedResult(null);
      }
    } else {
      // 特殊アニメーション中でなければクリア
      if (!specialAnimationInProgress) {
        console.log('⚠️ Clearing detailed result - missing requirements');
        setCurrentDetailedResult(null);
      } else {
        console.log('⏳ Keeping detailed result - special animation in progress');
      }
    }
  }, [lastPointResult, homePlayer, awayPlayer, currentMatch?.currentServer, specialAnimationInProgress]);

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

  // アニメーションテスト用の状態
  const [testAnimationRef, setTestAnimationRef] = useState<any>(null);

  // 特殊アニメーション直接テスト
  const testSpecialAnimation = (animationType: 'hit_net' | 'net_cord' | 'out_baseline' | 'missed_return' | 'ace_serve') => {
    console.log(`🎬 Testing special animation: ${animationType}`);
    playUISound('click');
    
    // テスト用の詳細結果を作成
    const testDetailedResult: DetailedPointResult = {
      winner: 'home',
      category: animationType === 'ace_serve' ? 'ace' : 'forced_error',
      detailedReason: animationType,
      description: `Test ${animationType}`,
      ballTrajectory: {
        startPosition: { x: 0.3, y: 0.8 },
        endPosition: animationType === 'out_baseline' ? { x: 0.7, y: -0.1 } : 
                    animationType === 'missed_return' ? { x: 0.8, y: 0.2 } : { x: 0.5, y: 0.5 },
        hitNetAt: (animationType === 'hit_net' || animationType === 'net_cord') ? { x: 0.5, y: 0.5 } : undefined,
        maxHeight: 0.3,
        speed: 1.0
      },
      playerActions: {
        homePlayer: { 
          type: 'stroke', 
          success: true, 
          reactionTime: 300, 
          position: { x: 0.3, y: 0.8 }, 
          targetPosition: { x: 0.7, y: 0.2 },
          movementType: 'normal'
        },
        awayPlayer: { 
          type: 'return', 
          success: false, 
          reactionTime: 400, 
          position: { x: 0.7, y: 0.2 }, 
          targetPosition: { x: 0.3, y: 0.8 },
          movementType: 'stretch'
        }
      },
      intensity: animationType === 'ace_serve' ? 1.0 : 0.6,
      dramaticEffect: 'slow_motion',
      audioEffect: ['racket_hit', 'ball_bounce']
    };
    
    // 特殊アニメーション中フラグを設定
    setSpecialAnimationInProgress(true);
    setCurrentDetailedResult(testDetailedResult);
    
    console.log('🔧 Test: Set special animation in progress and detailed result:', {
      animationType,
      specialAnimationInProgress: true,
      detailedReason: testDetailedResult.detailedReason,
      currentDetailedResult: testDetailedResult,
      hasBallTrajectory: !!testDetailedResult.ballTrajectory,
      hasHitNetAt: !!testDetailedResult.ballTrajectory.hitNetAt
    });
    
    // デバッグ用：TennisCourtViewに渡されるpropsを確認
    console.log('🔧 Debug: TennisCourtView props will be:', {
      detailedResult: testDetailedResult,
      rallyViewEnabled,
      homePlayer: !!homePlayer,
      awayPlayer: !!awayPlayer
    });
  };

  // 全アニメーション停止
  const stopAllAnimations = () => {
    console.log('⏹️ Stopping all test animations');
    playUISound('click');
    setSpecialAnimationInProgress(false);
    setCurrentDetailedResult(null);
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

        {/* ラリー可視化・アニメーションテスト */}
        {rallyViewEnabled && homePlayer && awayPlayer && (
          <div className="mb-6">
            <TennisCourtView
              rallySequence={currentRallySequence}
              homePlayer={homePlayer}
              awayPlayer={awayPlayer}
              onRallyComplete={() => {
                clearRallySequence();
              }}
              isPlaying={!!currentRallySequence || !!currentDetailedResult}
              detailedResult={currentDetailedResult}
              onSpecialAnimationComplete={() => {
                console.log('🎬 Special animation completed in main page');
                setSpecialAnimationInProgress(false);
                setCurrentDetailedResult(null);
                // 通常の試合中のみ lastPointResult をクリア（テスト時は不要）
                if (lastPointResult) {
                  clearLastPointResult();
                  console.log('✅ All animations completed - cleaned up point result and detailed result');
                } else {
                  console.log('✅ Test animation completed - cleaned up detailed result');
                }
              }}
            />
          </div>
        )}

        {/* 試合履歴 */}
        {isMatchActive && (
          <div className="mb-6">
            <MatchHistory history={matchHistory} />
          </div>
        )}

        {/* Canvas Effect Test */}
        {rallyViewEnabled && homePlayer && awayPlayer && (
          <CanvasEffectTest />
        )}

        {/* アニメーションテスト用パネル */}
        {rallyViewEnabled && homePlayer && awayPlayer && (
          <div className="mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">🎬 アニメーションテスト</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                
                {/* ネット系アニメーション */}
                <button
                  onClick={() => testSpecialAnimation('hit_net')}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                >
                  🥅 ネットイン
                </button>
                
                <button
                  onClick={() => testSpecialAnimation('net_cord')}
                  className="px-4 py-2 bg-red-400 text-white rounded-lg hover:bg-red-500 transition-colors text-sm"
                >
                  🎾 ネットコード
                </button>
                
                {/* アウト系アニメーション */}
                <button
                  onClick={() => testSpecialAnimation('out_baseline')}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                >
                  💥 アウト
                </button>
                
                {/* 見逃し系アニメーション */}
                <button
                  onClick={() => testSpecialAnimation('missed_return')}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
                >
                  👻 見逃し
                </button>
                
                {/* エース系アニメーション */}
                <button
                  onClick={() => testSpecialAnimation('ace_serve')}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                >
                  ⚡ エース
                </button>
                
                {/* テスト停止 */}
                <button
                  onClick={() => stopAllAnimations()}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  ⏹️ 停止
                </button>
              </div>
            </div>
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
        onAnimationComplete={() => {
          // 特殊アニメーション中はクリアを待機
          if (!specialAnimationInProgress) {
            console.log('🎬 AnimationDisplay clearing point result (no special animation)');
            clearLastPointResult();
          } else {
            console.log('⏳ AnimationDisplay waiting for special animation completion');
          }
        }}
        isEnabled={animationEnabled}
      />

      {/* 音響システム */}
      <AudioStatus />
      <AudioControls />
    </div>
  );
}
