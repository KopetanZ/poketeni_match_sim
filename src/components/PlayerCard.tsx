// プレイヤー情報表示カード

'use client';

import { TennisPlayer } from '@/types/tennis';
import Image from 'next/image';

interface PlayerCardProps {
  player: TennisPlayer;
  side: 'home' | 'away';
  isActive?: boolean;
}

export default function PlayerCard({ player, side, isActive = false }: PlayerCardProps) {
  const staminaPercentage = (player.current_stamina / player.stats.stamina) * 100;
  const mentalPercentage = (player.current_mental / player.stats.mental) * 100;
  
  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 border-2 ${
      isActive ? 'border-blue-500' : 'border-gray-200'
    } ${side === 'home' ? 'border-l-4 border-l-blue-600' : 'border-r-4 border-r-red-600'}`}>
      {/* プレイヤー基本情報 */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative w-16 h-16">
          <Image
            src={player.pokemon_sprite}
            alt={player.pokemon_name}
            fill
            sizes="64px"
            className="object-contain"
          />
        </div>
        <div>
          <h3 className="font-bold text-lg">{player.pokemon_name}</h3>
          <div className="flex gap-1">
            {player.types.map(type => (
              <span 
                key={type}
                className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(type)}`}
              >
                {type.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {/* ステータス */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <StatBar label="サーブ" value={player.stats.serve} color="bg-red-500" />
        <StatBar label="リターン" value={player.stats.receive} color="bg-blue-500" />
        <StatBar label="ボレー" value={player.stats.volley} color="bg-green-500" />
        <StatBar label="ストローク" value={player.stats.stroke} color="bg-yellow-500" />
        <StatBar label="メンタル" value={player.stats.mental} color="bg-purple-500" />
        <StatBar label="スタミナ" value={player.stats.stamina} color="bg-orange-500" />
      </div>
      
      {/* 現在状態 */}
      <div className="space-y-2 mb-3">
        <div>
          <div className="flex justify-between text-sm">
            <span>スタミナ</span>
            <span>{Math.round(staminaPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                staminaPercentage > 60 ? 'bg-green-500' : 
                staminaPercentage > 30 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${staminaPercentage}%` }}
            />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm">
            <span>メンタル</span>
            <span>{Math.round(mentalPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                mentalPercentage > 60 ? 'bg-blue-500' : 
                mentalPercentage > 30 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${mentalPercentage}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* 特殊能力 */}
      <div>
        <h4 className="font-semibold text-sm mb-2">特殊能力</h4>
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {player.special_abilities.map(ability => (
            <div 
              key={ability.id}
              className={`px-2 py-1 rounded text-xs ${getRarityColor(ability.rarity)}`}
              title={ability.description}
            >
              {ability.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ステータスバーコンポーネント
function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div 
          className={`h-1.5 rounded-full ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ポケモンタイプの色を取得
function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    fire: 'bg-red-100 text-red-800',
    water: 'bg-blue-100 text-blue-800',
    electric: 'bg-yellow-100 text-yellow-800',
    grass: 'bg-green-100 text-green-800',
    ice: 'bg-cyan-100 text-cyan-800',
    fighting: 'bg-red-100 text-red-800',
    poison: 'bg-purple-100 text-purple-800',
    ground: 'bg-yellow-100 text-yellow-800',
    flying: 'bg-indigo-100 text-indigo-800',
    psychic: 'bg-pink-100 text-pink-800',
    bug: 'bg-green-100 text-green-800',
    rock: 'bg-yellow-100 text-yellow-800',
    ghost: 'bg-purple-100 text-purple-800',
    dragon: 'bg-indigo-100 text-indigo-800',
    dark: 'bg-gray-100 text-gray-800',
    steel: 'bg-gray-100 text-gray-800',
    fairy: 'bg-pink-100 text-pink-800',
    normal: 'bg-gray-100 text-gray-800'
  };
  
  return colors[type] || 'bg-gray-100 text-gray-800';
}

// レアリティの色を取得
function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    common: 'bg-gray-100 text-gray-800',
    rare: 'bg-blue-100 text-blue-800',
    epic: 'bg-purple-100 text-purple-800',
    legendary: 'bg-yellow-100 text-yellow-800'
  };
  
  return colors[rarity] || 'bg-gray-100 text-gray-800';
}