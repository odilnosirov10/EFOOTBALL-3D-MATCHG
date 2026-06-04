/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WeatherType = 'sunny' | 'rainy' | 'night';
export type DifficultyType = 'amateur' | 'professional' | 'superstar';
export type TacticType = '4-3-3' | '4-4-2' | '3-5-2';
export type MentalityType = 'defensive' | 'balanced' | 'attacking';
export type GameMode = 
  | 'menu' 
  | 'match' 
  | 'training' 
  | 'management' 
  | 'career' 
  | 'transfer_market' 
  | 'online_lobby' 
  | 'post_match';

export interface PlayerStats {
  speed: number;      // 50-99
  shooting: number;   // 50-99
  passing: number;    // 50-99
  defending: number;  // 50-99
  stamina: number;    // 50-99
  goalkeeping: number;// 50-99
  overall: number;    // calculated average or specific rating
}

export interface Player {
  id: string;
  name: string;
  number: number;
  role: 'FW' | 'MF' | 'DF' | 'GK';
  stats: PlayerStats;
  currentStamina: number; // 0-100
  marketValue: number; // in coins
  isSquadMember: boolean;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  players: Player[];
  tactic: TacticType;
  mentality: MentalityType;
  isUser: boolean;
}

export interface MatchStats {
  possession: number; // percent
  shots: number;
  shotsOnTarget: number;
  passes: number;
  completedPasses: number;
  tackles: number;
  fouls: number;
  goals: number;
}

export interface MatchSetting {
  userTeam: Team;
  aiTeam: Team;
  weather: WeatherType;
  difficulty: DifficultyType;
  matchLengthMinutes: number; // usually accelerated (e.g. 5 mins match is 5:00 in accelerated speed)
  mode: 'friendly' | 'training_free' | 'training_penalty' | 'career_league';
}

export interface ReplayFrame {
  ballPos: { x: number; y: number; z: number };
  playerPositions: { [id: string]: { x: number; y: number; z: number; isRunning: boolean; isKicking: boolean } };
}

export interface StandingsRow {
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

export interface CareerSave {
  userTeamId: string;
  coins: number;
  matchesPlayed: number;
  seasonStats: {
    goals: number;
    conceded: number;
    wins: number;
    draws: number;
    losses: number;
  };
  standings: StandingsRow[];
  currentRound: number;
}

export interface OnlineLobbyMatch {
  id: string;
  hostName: string;
  teamName: string;
  ping: number;
  status: 'Waiting' | 'Playing';
}
