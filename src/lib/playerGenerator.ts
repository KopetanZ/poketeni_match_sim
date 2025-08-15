// サンプルキャラクター生成システム

import { TennisPlayer } from '@/types/tennis';
import { getRandomAbilities } from './specialAbilities';

// ポケモンの基本データ
interface PokemonData {
  id: number;
  name: string;
  types: string[];
  sprite: string;
}

// サンプルポケモンデータ（PokeAPI形式）
const SAMPLE_POKEMON: PokemonData[] = [
  { id: 25, name: 'ピカチュウ', types: ['electric'], sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png' },
  { id: 6, name: 'リザードン', types: ['fire', 'flying'], sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png' },
  { id: 9, name: 'カメックス', types: ['water'], sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/9.png' },
  { id: 3, name: 'フシギバナ', types: ['grass', 'poison'], sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/3.png' },
  { id: 150, name: 'ミュウツー', types: ['psychic'], sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png' },
  { id: 144, name: 'フリーザー', types: ['ice', 'flying'], sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/144.png' },
  { id: 145, name: 'サンダー', types: ['electric', 'flying'], sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/145.png' },
  { id: 146, name: 'ファイヤー', types: ['fire', 'flying'], sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/146.png' },
  { id: 131, name: 'ラプラス', types: ['water', 'ice'], sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/131.png' },
  { id: 143, name: 'カビゴン', types: ['normal'], sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/143.png' },
  { id: 94, name: 'ゲンガー', types: ['ghost', 'poison'], sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/94.png' },
  { id: 65, name: 'フーディン', types: ['psychic'], sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/65.png' },
  { id: 68, name: 'カイリキー', types: ['fighting'], sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/68.png' },
  { id: 59, name: 'ウインディ', types: ['fire'], sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/59.png' },
  { id: 130, name: 'ギャラドス', types: ['water', 'flying'], sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/130.png' },
  { id: 149, name: 'カイリュー', types: ['dragon', 'flying'], sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/149.png' },
  { id: 91, name: 'パルシェン', types: ['water', 'ice'], sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/91.png' },
  { id: 103, name: 'ナッシー', types: ['grass', 'psychic'], sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/103.png' },
  { id: 115, name: 'ガルーラ', types: ['normal'], sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/115.png' },
  { id: 142, name: 'プテラ', types: ['rock', 'flying'], sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/142.png' }
];

// プレイヤータイプ定義（能力値の傾向）
type PlayerType = 
  | 'power'      // パワー型: サーブ・ストローク重視
  | 'technical'  // 技巧型: ボレー・メンタル重視
  | 'defensive'  // 守備型: リターン・スタミナ重視
  | 'balanced'   // バランス型: 全能力平均的
  | 'mental';    // メンタル型: メンタル・スタミナ重視

const PLAYER_TYPES: PlayerType[] = ['power', 'technical', 'defensive', 'balanced', 'mental'];

// タイプ別の能力値修正
const TYPE_MODIFIERS: Record<PlayerType, Partial<TennisPlayer['stats']>> = {
  power: {
    serve: 15,
    stroke: 12,
    volley: -5,
    receive: -8,
    mental: -5,
    stamina: 5
  },
  technical: {
    serve: 5,
    stroke: 8,
    volley: 15,
    receive: 8,
    mental: 12,
    stamina: -10
  },
  defensive: {
    serve: -8,
    stroke: 5,
    volley: -5,
    receive: 15,
    mental: 8,
    stamina: 12
  },
  balanced: {
    serve: 2,
    stroke: 2,
    volley: 2,
    receive: 2,
    mental: 2,
    stamina: 2
  },
  mental: {
    serve: -5,
    stroke: 3,
    volley: 3,
    receive: 5,
    mental: 15,
    stamina: 10
  }
};

// ポケモンタイプ別の特殊修正
const POKEMON_TYPE_MODIFIERS: Record<string, Partial<TennisPlayer['stats']>> = {
  fire: { serve: 8, stroke: 5, mental: 3 },
  water: { receive: 5, stamina: 5, mental: 2 },
  electric: { serve: 10, volley: 5, mental: 5 },
  grass: { stroke: 3, stamina: 8, receive: 3 },
  ice: { mental: 8, receive: 5, volley: 3 },
  fighting: { serve: 5, stroke: 8, stamina: 5 },
  poison: { stamina: 5, mental: 3 },
  ground: { stroke: 5, stamina: 8 },
  flying: { volley: 8, serve: 3, mental: 3 },
  psychic: { mental: 12, volley: 5 },
  bug: { stamina: 3, receive: 5 },
  rock: { stamina: 10, serve: 3 },
  ghost: { mental: 8, volley: 5 },
  dragon: { serve: 5, stroke: 5, mental: 8, stamina: 5 },
  dark: { mental: 5, stroke: 5 },
  steel: { receive: 8, stamina: 5 },
  fairy: { mental: 5, volley: 5 },
  normal: { stamina: 3, receive: 3 }
};

// ランダムプレイヤー生成
export function generateRandomPlayer(level: number = 70): TennisPlayer {
  // ランダムなポケモンを選択
  const pokemon = SAMPLE_POKEMON[Math.floor(Math.random() * SAMPLE_POKEMON.length)];
  
  // ランダムなプレイヤータイプを選択
  const playerType = PLAYER_TYPES[Math.floor(Math.random() * PLAYER_TYPES.length)];
  
  // 基本能力値を生成（レベル±10の範囲でランダム）
  const baseStats = {
    serve: Math.max(10, Math.min(100, level + (Math.random() - 0.5) * 20)),
    receive: Math.max(10, Math.min(100, level + (Math.random() - 0.5) * 20)),
    volley: Math.max(10, Math.min(100, level + (Math.random() - 0.5) * 20)),
    stroke: Math.max(10, Math.min(100, level + (Math.random() - 0.5) * 20)),
    mental: Math.max(10, Math.min(100, level + (Math.random() - 0.5) * 20)),
    stamina: Math.max(10, Math.min(100, level + (Math.random() - 0.5) * 20))
  };
  
  // プレイヤータイプの修正を適用
  const typeModifier = TYPE_MODIFIERS[playerType];
  Object.keys(baseStats).forEach(key => {
    const stat = key as keyof TennisPlayer['stats'];
    const modifier = typeModifier[stat] || 0;
    baseStats[stat] = Math.max(10, Math.min(100, baseStats[stat] + modifier));
  });
  
  // ポケモンタイプの修正を適用
  pokemon.types.forEach(type => {
    const pokemonModifier = POKEMON_TYPE_MODIFIERS[type] || {};
    Object.keys(pokemonModifier).forEach(key => {
      const stat = key as keyof TennisPlayer['stats'];
      const modifier = pokemonModifier[stat] || 0;
      baseStats[stat] = Math.max(10, Math.min(100, baseStats[stat] + modifier));
    });
  });
  
  // 特殊能力をランダム生成（2-4個）
  const abilityCount = Math.floor(Math.random() * 3) + 2;
  const specialAbilities = getRandomAbilities(abilityCount);
  
  const player: TennisPlayer = {
    id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    pokemon_name: pokemon.name,
    pokemon_id: pokemon.id,
    stats: baseStats,
    current_stamina: baseStats.stamina,
    current_mental: baseStats.mental,
    special_abilities: specialAbilities,
    pokemon_sprite: pokemon.sprite,
    types: pokemon.types
  };
  
  return player;
}

// プリセットプレイヤー生成
export function generatePresetPlayers(): { home: TennisPlayer; away: TennisPlayer } {
  // 強めのホームプレイヤー
  const homePlayer = generateRandomPlayer(75);
  homePlayer.pokemon_name = 'エース・ピカチュウ';
  homePlayer.pokemon_id = 25;
  homePlayer.pokemon_sprite = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png';
  homePlayer.types = ['electric'];
  
  // バランスの取れたアウェイプレイヤー
  const awayPlayer = generateRandomPlayer(73);
  awayPlayer.pokemon_name = 'ライバル・リザードン';
  awayPlayer.pokemon_id = 6;
  awayPlayer.pokemon_sprite = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png';
  awayPlayer.types = ['fire', 'flying'];
  
  return { home: homePlayer, away: awayPlayer };
}

// 複数のランダムプレイヤーを生成
export function generateMultiplePlayers(count: number, levelRange: [number, number] = [60, 80]): TennisPlayer[] {
  const players: TennisPlayer[] = [];
  
  for (let i = 0; i < count; i++) {
    const level = levelRange[0] + Math.random() * (levelRange[1] - levelRange[0]);
    players.push(generateRandomPlayer(Math.floor(level)));
  }
  
  return players;
}

// プレイヤーの総合評価を計算
export function calculatePlayerRating(player: TennisPlayer): number {
  const stats = player.stats;
  const baseRating = (stats.serve + stats.receive + stats.volley + stats.stroke + stats.mental + stats.stamina) / 6;
  
  // 特殊能力による補正
  const abilityBonus = player.special_abilities.length * 2;
  const rarityBonus = player.special_abilities.reduce((bonus, ability) => {
    switch (ability.rarity) {
      case 'common': return bonus + 1;
      case 'rare': return bonus + 2;
      case 'epic': return bonus + 4;
      case 'legendary': return bonus + 8;
      default: return bonus;
    }
  }, 0);
  
  return Math.min(100, baseRating + abilityBonus + rarityBonus);
}