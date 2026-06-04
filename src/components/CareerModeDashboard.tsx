/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Team, StandingsRow, WeatherType, DifficultyType, MatchSetting } from '../types/football';
import { TEAMS } from '../game/SquadData';
import { Play, Trophy, DollarSign, Users, Award, ShieldAlert, Sparkles } from 'lucide-react';

interface CareerModeDashboardProps {
  userTeam: Team;
  coins: number;
  matchesPlayed: number;
  standings: StandingsRow[];
  currentRound: number;
  onKickoffMatch: (setting: MatchSetting) => void;
  onNavigateToTransfers: () => void;
  onNavigateToTactics: () => void;
  onNavigateToTraining: () => void;
  onBackToMenu: () => void;
}

export const CareerModeDashboard: React.FC<CareerModeDashboardProps> = ({
  userTeam,
  coins,
  matchesPlayed,
  standings,
  currentRound,
  onKickoffMatch,
  onNavigateToTransfers,
  onNavigateToTactics,
  onNavigateToTraining,
  onBackToMenu
}) => {
  const [selectedWeather, setSelectedWeather] = useState<WeatherType>('sunny');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyType>('professional');

  // Next opponent calculation
  const opponentsList = TEAMS.filter(t => t.id !== userTeam.id);
  const nextOpponent = opponentsList[currentRound % opponentsList.length];

  const handleStartCareerMatch = () => {
    onKickoffMatch({
      userTeam,
      aiTeam: nextOpponent,
      weather: selectedWeather,
      difficulty: selectedDifficulty,
      matchLengthMinutes: 5,
      mode: 'career_league'
    });
  };

  return (
    <div className="w-full h-full bg-slate-950 text-slate-200 p-6 flex flex-col overflow-y-auto font-sans" id="career_dashboard_container">
      {/* HEADER HERO AREA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-5 mb-6 gap-4" id="career_header">
        <div>
          <h2 className="text-2xl font-black tracking-widest text-white uppercase flex items-center space-x-2.5">
            <Trophy className="w-6 h-6 text-amber-500 animate-bounce" />
            <span>COMMUNITY CLUB LEAGUE MASTER</span>
          </h2>
          <p className="text-xs text-slate-400">Guide {userTeam.name} to domestic and international glory</p>
        </div>

        {/* Treasury */}
        <div className="flex items-center space-x-3 bg-gradient-to-r from-emerald-500/25 to-teal-500/20 border border-emerald-500/30 px-5 py-2.5 rounded-xl text-emerald-400 shadow-lg" id="career_treasury">
          <DollarSign className="w-5 h-5" />
          <span className="font-mono text-xl font-black">{coins}</span>
          <span className="text-[10px] text-emerald-500 font-extrabold uppercase tracking-wider">Club Coins</span>
        </div>
      </div>

      {/* THREE BENTO MAIN CARDS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8" id="career_grid">
        {/* CARD 1: STANDINGS TABLE DISPLAY */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-xl xl:col-span-2" id="career_standings_card">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>DIVISION 1 STANDINGS</span>
            </h3>
            
            <div className="overflow-x-auto" id="table_standings_wrapper">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="text-[10px] uppercase text-slate-500 bg-slate-950 font-bold border-b border-slate-800 font-mono">
                  <tr>
                    <th className="py-2.5 px-3">CLUB</th>
                    <th className="py-2.5 px-2 text-center">PL</th>
                    <th className="py-2.5 px-2 text-center">W</th>
                    <th className="py-2.5 px-2 text-center">D</th>
                    <th className="py-2.5 px-2 text-center">L</th>
                    <th className="py-2.5 px-2 text-center">GD</th>
                    <th className="py-2.5 px-3 text-center">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {standings.map((row, idx) => (
                    <tr 
                      key={idx} 
                      className={`hover:bg-slate-900/40 transition-colors ${row.teamName === userTeam.name ? 'bg-emerald-950/20 text-emerald-400 font-bold border-l-2 border-emerald-500' : ''}`}
                    >
                      <td className="py-3 px-3 flex items-center space-x-2">
                        <span className="font-mono font-bold text-slate-450 mr-1">{idx + 1}.</span>
                        <span>{row.teamName}</span>
                      </td>
                      <td className="py-3 px-2 text-center font-mono">{row.played}</td>
                      <td className="py-3 px-2 text-center font-mono">{row.won}</td>
                      <td className="py-3 px-2 text-center font-mono">{row.drawn}</td>
                      <td className="py-3 px-2 text-center font-mono">{row.lost}</td>
                      <td className="py-3 px-2 text-center font-mono">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-white">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-mono mt-4 border-t border-slate-850 pt-3">
            * Top 1 team qualifies for Champion Cup brackets. Play round fixtures to progress standings.
          </div>
        </div>

        {/* CARD 2: NEXT MATCH & LAUNCH PANEL */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-2xl" id="career_fixture_card">
          <div className="space-y-4">
            <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span>ROUND FIXTURE #{currentRound + 1}</span>
            </h3>

            {/* Fixture matchup card */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center space-y-3 shadow-inner" id="fixture_matchup">
              <div className="flex justify-around items-center">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center font-extrabold text-white text-sm" style={{ backgroundColor: userTeam.primaryColor }}>
                    {userTeam.shortName}
                  </div>
                  <span className="text-[11px] block mt-1.5 font-bold text-slate-200">{userTeam.shortName}</span>
                  <span className="text-[9px] text-emerald-400 font-mono uppercase bg-emerald-950/20 px-1.5 py-0.5 rounded">Home</span>
                </div>

                <span className="font-black text-slate-500 text-sm">VS</span>

                <div className="text-center bg-slate-900">
                  <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center font-extrabold text-white text-sm" style={{ backgroundColor: nextOpponent.primaryColor }}>
                    {nextOpponent.shortName}
                  </div>
                  <span className="text-[11px] block mt-1.5 font-bold text-slate-200">{nextOpponent.name}</span>
                  <span className="text-[9px] text-indigo-400 font-mono uppercase bg-indigo-950/20 px-1.5 py-0.5 rounded">Away</span>
                </div>
              </div>
            </div>

            {/* Weather Settings selectors */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">Environment Weather</label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1 rounded-lg" id="career_weather_toggle">
                <button 
                  onClick={() => setSelectedWeather('sunny')}
                  className={`py-1.5 text-center text-[10px] font-bold rounded capitalize transition ${selectedWeather === 'sunny' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Sunny
                </button>
                <button 
                  onClick={() => setSelectedWeather('rainy')}
                  className={`py-1.5 text-center text-[10px] font-bold rounded capitalize transition ${selectedWeather === 'rainy' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Rainy
                </button>
                <button 
                  onClick={() => setSelectedWeather('night')}
                  className={`py-1.5 text-center text-[10px] font-bold rounded capitalize transition ${selectedWeather === 'night' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Night
                </button>
              </div>
            </div>

            {/* Difficulty Selectors */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">Opponent Level</label>
              <select 
                value={selectedDifficulty} 
                onChange={(e) => setSelectedDifficulty(e.target.value as DifficultyType)}
                className="w-full px-3 py-1.5 bg-slate-900 text-slate-250 border border-slate-800 text-xs rounded-xl outline-none"
                id="select_career_difficulty"
              >
                <option value="amateur">Amateur Easy</option>
                <option value="professional">Professional standard</option>
                <option value="superstar">Superstar Legendary</option>
              </select>
            </div>
          </div>

          <button 
            onClick={handleStartCareerMatch}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs tracking-widest uppercase rounded-xl shadow-lg shadow-emerald-950/40 transition active:scale-[0.98] mt-4 flex items-center justify-center space-x-2"
            id="btn_career_kickoff"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>KICKOFF ROUND MATCH</span>
          </button>
        </div>
      </div>

      {/* QUICK ACTIONS UTILITIES CHIPS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4" id="career_utility_navs">
        <button 
          onClick={onNavigateToTransfers}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/30 p-4 rounded-xl text-center space-y-1 cursor-pointer transition group"
        >
          <Users className="w-5 h-5 mx-auto text-emerald-400 group-hover:scale-110 transition-transform" />
          <h4 className="text-xs font-black text-white">TRANSFERS</h4>
          <p className="text-[9px] text-slate-500">Sign star footballers</p>
        </button>

        <button 
          onClick={onNavigateToTactics}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/30 p-4 rounded-xl text-center space-y-1 cursor-pointer transition group"
        >
          <Award className="w-5 h-5 mx-auto text-cyan-400 group-hover:scale-110 transition-transform" />
          <h4 className="text-xs font-black text-white">TACTICS</h4>
          <p className="text-[9px] text-slate-500">Adjust starting grid</p>
        </button>

        <button 
          onClick={onNavigateToTraining}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/30 p-4 rounded-xl text-center space-y-1 cursor-pointer transition group"
        >
          <Sparkles className="w-5 h-5 mx-auto text-amber-400 group-hover:scale-110 transition-transform" />
          <h4 className="text-xs font-black text-white">TRAINING MODE</h4>
          <p className="text-[9px] text-slate-500">Drills and PK trials</p>
        </button>

        <button 
          onClick={onBackToMenu}
          className="bg-slate-900 hover:bg-slate-850 border border-slate-800 p-4 rounded-xl text-center space-y-1 cursor-pointer transition col-span-2 sm:col-span-2"
        >
          <span className="text-xs font-extrabold text-slate-400">EXIT TO MAIN MENU</span>
          <p className="text-[9px] text-slate-500">Save club career progress</p>
        </button>
      </div>
    </div>
  );
};
