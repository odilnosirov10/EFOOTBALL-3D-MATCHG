/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Team, Player } from '../types/football';

export const STAR_PLAYERS: Player[] = [
  { id: 'p_messi', name: 'L. Messi', number: 10, role: 'FW', stats: { speed: 84, shooting: 92, passing: 94, defending: 39, stamina: 78, goalkeeping: 10, overall: 91 }, currentStamina: 100, marketValue: 1200, isSquadMember: false },
  { id: 'p_ronaldo', name: 'C. Ronaldo', number: 7, role: 'FW', stats: { speed: 85, shooting: 90, passing: 81, defending: 40, stamina: 84, goalkeeping: 10, overall: 87 }, currentStamina: 100, marketValue: 800, isSquadMember: false },
  { id: 'p_mbappe', name: 'K. Mbappé', number: 9, role: 'FW', stats: { speed: 97, shooting: 89, passing: 80, defending: 36, stamina: 88, goalkeeping: 10, overall: 91 }, currentStamina: 100, marketValue: 1500, isSquadMember: false },
  { id: 'p_haaland', name: 'E. Haaland', number: 9, role: 'FW', stats: { speed: 89, shooting: 93, passing: 66, defending: 45, stamina: 86, goalkeeping: 10, overall: 90 }, currentStamina: 100, marketValue: 1400, isSquadMember: false },
  { id: 'p_debruyne', name: 'K. De Bruyne', number: 17, role: 'MF', stats: { speed: 72, shooting: 85, passing: 95, defending: 65, stamina: 85, goalkeeping: 10, overall: 90 }, currentStamina: 100, marketValue: 1100, isSquadMember: false },
  { id: 'p_bellingham', name: 'J. Bellingham', number: 5, role: 'MF', stats: { speed: 80, shooting: 84, passing: 85, defending: 78, stamina: 90, goalkeeping: 10, overall: 89 }, currentStamina: 100, marketValue: 1300, isSquadMember: false },
  { id: 'p_vinicius', name: 'Vinícius Jr.', number: 7, role: 'FW', stats: { speed: 96, shooting: 84, passing: 79, defending: 32, stamina: 89, goalkeeping: 10, overall: 89 }, currentStamina: 100, marketValue: 1350, isSquadMember: false },
  { id: 'p_salah', name: 'M. Salah', number: 11, role: 'FW', stats: { speed: 89, shooting: 87, passing: 82, defending: 45, stamina: 86, goalkeeping: 10, overall: 89 }, currentStamina: 100, marketValue: 950, isSquadMember: false },
  { id: 'p_rodri', name: 'Rodri', number: 16, role: 'MF', stats: { speed: 66, shooting: 75, passing: 86, defending: 89, stamina: 92, goalkeeping: 10, overall: 90 }, currentStamina: 100, marketValue: 1250, isSquadMember: false },
  { id: 'p_vandijk', name: 'V. van Dijk', number: 4, role: 'DF', stats: { speed: 78, shooting: 60, passing: 71, defending: 91, stamina: 85, goalkeeping: 10, overall: 89 }, currentStamina: 100, marketValue: 1050, isSquadMember: false },
  { id: 'p_kane', name: 'H. Kane', number: 9, role: 'FW', stats: { speed: 69, shooting: 93, passing: 84, defending: 48, stamina: 83, goalkeeping: 10, overall: 90 }, currentStamina: 100, marketValue: 1100, isSquadMember: false },
  { id: 'p_courtois', name: 'T. Courtois', number: 1, role: 'GK', stats: { speed: 50, shooting: 12, passing: 68, defending: 15, stamina: 70, goalkeeping: 91, overall: 90 }, currentStamina: 100, marketValue: 900, isSquadMember: false }
];

export const TEAMS: Team[] = [
  {
    id: 'madrid_w',
    name: 'Madrid White',
    shortName: 'MAD',
    primaryColor: '#ffffff',
    secondaryColor: '#1e3a8a',
    tactic: '4-3-3',
    mentality: 'attacking',
    isUser: true,
    players: [
      { id: 'mad_gk', name: 'Courtois', number: 1, role: 'GK', stats: { speed: 50, shooting: 12, passing: 68, defending: 15, stamina: 70, goalkeeping: 90, overall: 88 }, currentStamina: 100, marketValue: 400, isSquadMember: true },
      { id: 'mad_df1', name: 'Militão', number: 3, role: 'DF', stats: { speed: 82, shooting: 50, passing: 68, defending: 85, stamina: 82, goalkeeping: 10, overall: 84 }, currentStamina: 100, marketValue: 350, isSquadMember: true },
      { id: 'mad_df2', name: 'Rüdiger', number: 22, role: 'DF', stats: { speed: 82, shooting: 54, passing: 70, defending: 87, stamina: 84, goalkeeping: 10, overall: 85 }, currentStamina: 100, marketValue: 380, isSquadMember: true },
      { id: 'mad_df3', name: 'Carvajal', number: 2, role: 'DF', stats: { speed: 79, shooting: 54, passing: 78, defending: 84, stamina: 86, goalkeeping: 10, overall: 83 }, currentStamina: 100, marketValue: 300, isSquadMember: true },
      { id: 'mad_df4', name: 'Mendy', number: 23, role: 'DF', stats: { speed: 84, shooting: 48, passing: 72, defending: 82, stamina: 83, goalkeeping: 10, overall: 81 }, currentStamina: 100, marketValue: 260, isSquadMember: true },
      { id: 'mad_mf1', name: 'Tchouaméni', number: 14, role: 'MF', stats: { speed: 71, shooting: 69, passing: 81, defending: 83, stamina: 85, goalkeeping: 10, overall: 82 }, currentStamina: 100, marketValue: 420, isSquadMember: true },
      { id: 'mad_mf2', name: 'Valverde', number: 15, role: 'MF', stats: { speed: 88, shooting: 80, passing: 84, defending: 78, stamina: 92, goalkeeping: 10, overall: 86 }, currentStamina: 100, marketValue: 550, isSquadMember: true },
      { id: 'mad_mf3', name: 'Bellingham', number: 5, role: 'MF', stats: { speed: 80, shooting: 84, passing: 85, defending: 78, stamina: 90, goalkeeping: 10, overall: 89 }, currentStamina: 100, marketValue: 1300, isSquadMember: true },
      { id: 'mad_fw1', name: 'Vinícius Jr.', number: 7, role: 'FW', stats: { speed: 96, shooting: 84, passing: 79, defending: 32, stamina: 89, goalkeeping: 10, overall: 89 }, currentStamina: 100, marketValue: 1350, isSquadMember: true },
      { id: 'mad_fw2', name: 'Rodrygo', number: 11, role: 'FW', stats: { speed: 89, shooting: 82, passing: 80, defending: 35, stamina: 81, goalkeeping: 10, overall: 85 }, currentStamina: 100, marketValue: 650, isSquadMember: true },
      { id: 'mad_fw3', name: 'Mbappé', number: 9, role: 'FW', stats: { speed: 97, shooting: 89, passing: 80, defending: 36, stamina: 88, goalkeeping: 10, overall: 91 }, currentStamina: 100, marketValue: 1500, isSquadMember: true }
    ]
  },
  {
    id: 'man_red',
    name: 'Manchester Red',
    shortName: 'MNR',
    primaryColor: '#dc2626',
    secondaryColor: '#facc15',
    tactic: '4-4-2',
    mentality: 'balanced',
    isUser: false,
    players: [
      { id: 'mnr_gk', name: 'Onana', number: 24, role: 'GK', stats: { speed: 52, shooting: 10, passing: 78, defending: 12, stamina: 70, goalkeeping: 83, overall: 82 }, currentStamina: 100, marketValue: 250, isSquadMember: true },
      { id: 'mnr_df1', name: 'De Ligt', number: 4, role: 'DF', stats: { speed: 70, shooting: 54, passing: 65, defending: 84, stamina: 81, goalkeeping: 10, overall: 83 }, currentStamina: 100, marketValue: 320, isSquadMember: true },
      { id: 'mnr_df2', name: 'Martinez', number: 6, role: 'DF', stats: { speed: 73, shooting: 48, passing: 74, defending: 85, stamina: 83, goalkeeping: 10, overall: 84 }, currentStamina: 100, marketValue: 340, isSquadMember: true },
      { id: 'mnr_df3', name: 'Dalot', number: 20, role: 'DF', stats: { speed: 81, shooting: 60, passing: 76, defending: 79, stamina: 85, goalkeeping: 10, overall: 81 }, currentStamina: 100, marketValue: 240, isSquadMember: true },
      { id: 'mnr_df4', name: 'Shaw', number: 23, role: 'DF', stats: { speed: 78, shooting: 55, passing: 78, defending: 80, stamina: 78, goalkeeping: 10, overall: 80 }, currentStamina: 100, marketValue: 220, isSquadMember: true },
      { id: 'mnr_mf1', name: 'Casemiro', number: 18, role: 'MF', stats: { speed: 63, shooting: 73, passing: 75, defending: 84, stamina: 80, goalkeeping: 10, overall: 82 }, currentStamina: 100, marketValue: 200, isSquadMember: true },
      { id: 'mnr_mf2', name: 'Mainoo', number: 37, role: 'MF', stats: { speed: 75, shooting: 68, passing: 81, defending: 74, stamina: 84, goalkeeping: 10, overall: 81 }, currentStamina: 100, marketValue: 380, isSquadMember: true },
      { id: 'mnr_mf3', name: 'Bruno F.', number: 8, role: 'MF', stats: { speed: 72, shooting: 83, passing: 88, defending: 66, stamina: 92, goalkeeping: 10, overall: 86 }, currentStamina: 100, marketValue: 500, isSquadMember: true },
      { id: 'mnr_mf4', name: 'Garnacho', number: 17, role: 'FW', stats: { speed: 88, shooting: 78, passing: 74, defending: 35, stamina: 82, goalkeeping: 10, overall: 80 }, currentStamina: 100, marketValue: 350, isSquadMember: true },
      { id: 'mnr_fw1', name: 'Rashford', number: 10, role: 'FW', stats: { speed: 89, shooting: 82, passing: 75, defending: 41, stamina: 81, goalkeeping: 10, overall: 83 }, currentStamina: 100, marketValue: 400, isSquadMember: true },
      { id: 'mnr_fw2', name: 'Højlund', number: 11, role: 'FW', stats: { speed: 86, shooting: 80, passing: 65, defending: 40, stamina: 82, goalkeeping: 10, overall: 80 }, currentStamina: 100, marketValue: 330, isSquadMember: true }
    ]
  },
  {
    id: 'munich_r',
    name: 'Munich Red',
    shortName: 'FCB',
    primaryColor: '#ef4444',
    secondaryColor: '#ffffff',
    tactic: '4-3-3',
    mentality: 'attacking',
    isUser: false,
    players: [
      { id: 'fcb_gk', name: 'Neuer', number: 1, role: 'GK', stats: { speed: 52, shooting: 15, passing: 78, defending: 12, stamina: 70, goalkeeping: 86, overall: 85 }, currentStamina: 100, marketValue: 150, isSquadMember: true },
      { id: 'fcb_df1', name: 'Upamecano', number: 2, role: 'DF', stats: { speed: 83, shooting: 45, passing: 68, defending: 81, stamina: 80, goalkeeping: 10, overall: 81 }, currentStamina: 100, marketValue: 280, isSquadMember: true },
      { id: 'fcb_df2', name: 'Kim M.J.', number: 3, role: 'DF', stats: { speed: 80, shooting: 40, passing: 69, defending: 85, stamina: 84, goalkeeping: 10, overall: 83 }, currentStamina: 100, marketValue: 320, isSquadMember: true },
      { id: 'fcb_df3', name: 'Kimmich', number: 6, role: 'MF', stats: { speed: 68, shooting: 72, passing: 86, defending: 81, stamina: 90, goalkeeping: 10, overall: 85 }, currentStamina: 100, marketValue: 480, isSquadMember: true },
      { id: 'fcb_df4', name: 'Davies', number: 19, role: 'DF', stats: { speed: 95, shooting: 66, passing: 76, defending: 76, stamina: 85, goalkeeping: 10, overall: 82 }, currentStamina: 100, marketValue: 450, isSquadMember: true },
      { id: 'fcb_mf1', name: 'Palhinha', number: 16, role: 'MF', stats: { speed: 64, shooting: 68, passing: 75, defending: 86, stamina: 88, goalkeeping: 10, overall: 83 }, currentStamina: 100, marketValue: 350, isSquadMember: true },
      { id: 'fcb_mf2', name: 'Musiala', number: 42, role: 'MF', stats: { speed: 85, shooting: 80, passing: 84, defending: 58, stamina: 84, goalkeeping: 10, overall: 87 }, currentStamina: 100, marketValue: 980, isSquadMember: true },
      { id: 'fcb_mf3', name: 'Gnabry', number: 7, role: 'FW', stats: { speed: 84, shooting: 81, passing: 76, defending: 42, stamina: 78, goalkeeping: 10, overall: 81 }, currentStamina: 100, marketValue: 260, isSquadMember: true },
      { id: 'fcb_fw1', name: 'Sané', number: 10, role: 'FW', stats: { speed: 89, shooting: 82, passing: 78, defending: 38, stamina: 79, goalkeeping: 10, overall: 83 }, currentStamina: 100, marketValue: 410, isSquadMember: true },
      { id: 'fcb_fw2', name: 'Kane', number: 9, role: 'FW', stats: { speed: 69, shooting: 93, passing: 84, defending: 48, stamina: 83, goalkeeping: 10, overall: 90 }, currentStamina: 100, marketValue: 1100, isSquadMember: true },
      { id: 'fcb_fw3', name: 'Olise', number: 17, role: 'FW', stats: { speed: 82, shooting: 79, passing: 81, defending: 45, stamina: 80, goalkeeping: 10, overall: 82 }, currentStamina: 100, marketValue: 390, isSquadMember: true }
    ]
  },
  {
    id: 'man_blue',
    name: 'Manchester Blue',
    shortName: 'MCI',
    primaryColor: '#0ea5e9',
    secondaryColor: '#f0f9ff',
    tactic: '3-5-2',
    mentality: 'balanced',
    isUser: false,
    players: [
      { id: 'mci_gk', name: 'Ederson', number: 31, role: 'GK', stats: { speed: 54, shooting: 15, passing: 89, defending: 12, stamina: 75, goalkeeping: 86, overall: 86 }, currentStamina: 100, marketValue: 450, isSquadMember: true },
      { id: 'mci_df1', name: 'Dias', number: 3, role: 'DF', stats: { speed: 70, shooting: 50, passing: 74, defending: 89, stamina: 85, goalkeeping: 10, overall: 88 }, currentStamina: 100, marketValue: 680, isSquadMember: true },
      { id: 'mci_df2', name: 'Akanji', number: 25, role: 'DF', stats: { speed: 80, shooting: 54, passing: 78, defending: 84, stamina: 83, goalkeeping: 10, overall: 83 }, currentStamina: 100, marketValue: 350, isSquadMember: true },
      { id: 'mci_df3', name: 'Gvardiol', number: 24, role: 'DF', stats: { speed: 79, shooting: 68, passing: 78, defending: 84, stamina: 86, goalkeeping: 10, overall: 84 }, currentStamina: 100, marketValue: 580, isSquadMember: true },
      { id: 'mci_mf1', name: 'Rodri', number: 16, role: 'MF', stats: { speed: 66, shooting: 75, passing: 86, defending: 89, stamina: 92, goalkeeping: 10, overall: 90 }, currentStamina: 100, marketValue: 1250, isSquadMember: true },
      { id: 'mci_mf2', name: 'Kovacic', number: 8, role: 'MF', stats: { speed: 73, shooting: 69, passing: 83, defending: 76, stamina: 81, goalkeeping: 10, overall: 81 }, currentStamina: 100, marketValue: 240, isSquadMember: true },
      { id: 'mci_mf3', name: 'Bernardo', number: 20, role: 'MF', stats: { speed: 75, shooting: 76, passing: 89, defending: 72, stamina: 94, goalkeeping: 10, overall: 87 }, currentStamina: 100, marketValue: 600, isSquadMember: true },
      { id: 'mci_mf4', name: 'De Bruyne', number: 17, role: 'MF', stats: { speed: 72, shooting: 85, passing: 95, defending: 65, stamina: 85, goalkeeping: 10, overall: 90 }, currentStamina: 100, marketValue: 1100, isSquadMember: true },
      { id: 'mci_mf5', name: 'Foden', number: 47, role: 'MF', stats: { speed: 84, shooting: 84, passing: 86, defending: 56, stamina: 85, goalkeeping: 10, overall: 88 }, currentStamina: 100, marketValue: 900, isSquadMember: true },
      { id: 'mci_fw1', name: 'Haaland', number: 9, role: 'FW', stats: { speed: 89, shooting: 93, passing: 66, defending: 45, stamina: 86, goalkeeping: 10, overall: 90 }, currentStamina: 100, marketValue: 1400, isSquadMember: true },
      { id: 'mci_fw2', name: 'Grealish', number: 10, role: 'FW', stats: { speed: 76, shooting: 76, passing: 83, defending: 47, stamina: 80, goalkeeping: 10, overall: 82 }, currentStamina: 100, marketValue: 310, isSquadMember: true }
    ]
  }
];

export function getLeagueStandings(teams: Team[]): any[] {
  return teams.map((team, idx) => ({
    teamName: team.name,
    teamId: team.id,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0
  })).sort((a,b) => b.points - a.points);
}
